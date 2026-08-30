; ============================================================================
; Видео — инварианты доступа, нарезки и просмотров (Z3 / SMT-LIB v2)
; ============================================================================
; Спутник docs/whg/39-video.md.
;
; Зачем формально. Три места этой механики отказывают тихо: система продолжает
; работать и выглядеть исправной.
;   1) выдача секрета мимо политики,
;   2) удаление оригинала не в том состоянии,
;   3) учёт одновременных просмотров.
; Поэтому свойства доказываются, а не проверяются на глаз.
;
; Файл ведущий: сначала правится он и гоняется verify_access.py, потом пишется
; код и рантайм-тест. Оба — в одном коммите.
;
; Имена латиницей — Z3 не принимает кириллицу в идентификаторах.
;
; Прогон онлайн:
;   https://microsoft.github.io/z3guide/playground/Freeform%20Editing/
; Локально:
;   pip install z3-solver && python spec/video/verify_access.py
; ============================================================================

(set-logic ALL)
(set-option :produce-models true)

; ---------------------------------------------------------------------------
; СЕКЦИЯ A — УНИВЕРСУМ И СИГНАТУРЫ
; ---------------------------------------------------------------------------

; Состояния нарезки. Соответствуют полю hls.status у медиафайла.
(declare-datatype Status ((Uploaded) (Queued) (Encoding) (Ready) (Failed)))

; Режим доступа. Это политика выдачи, а не способ хранения: сегменты
; зашифрованы всегда и одинаково в обоих режимах.
(declare-datatype Access ((Public) (Private)))

(declare-sort Video 0)
(declare-fun status      (Video) Status)
(declare-fun access      (Video) Access)
(declare-fun hasOriginal (Video) Bool)
(declare-fun hasRendition (Video) Bool)

; Поколение секрета. Растёт при каждой смене секрета; сегменты зашифрованы
; секретом своего поколения. Служит признаком того, что прежние выдачи
; перестали действовать.
(declare-fun generation (Video) Int)
(assert (forall ((v Video)) (>= (generation v) 0)))

(declare-sort Viewer 0)
(declare-fun signedIn (Viewer) Bool)
(declare-fun token    (Viewer) Int)

; Токен персональный: одинаковый токен означает одного и того же зрителя.
(assert (forall ((a Viewer) (b Viewer))
  (=> (= (token a) (token b)) (= a b))))

; ---------------------------------------------------------------------------
; СЕКЦИЯ B — ИНВАРИАНТЫ СОСТОЯНИЙ
; ---------------------------------------------------------------------------

; ИНВ-1: нарезка существует тогда и только тогда, когда видео готово.
(assert (forall ((v Video))
  (= (hasRendition v) (= (status v) Ready))))

; ИНВ-2: оригинал удаляется ровно при переходе в Ready. В любом другом
; состоянии он обязан лежать на месте — иначе повтор задачи после сбоя
; останется без исходника.
(assert (forall ((v Video))
  (= (hasOriginal v) (not (= (status v) Ready)))))

; ---------------------------------------------------------------------------
; СЕКЦИЯ C — ОПЕРАЦИИ
; ---------------------------------------------------------------------------

;; Выдача ключа описана ниже, в секции прав: keyIssuedByRights. Здесь её нет
;; намеренно. Прежняя выдача спрашивала «вошёл ли зритель», и это была не
;; модель, а привычка из площадок с учётными записями: у нас регистрации
;; зрителей нет вовсе, а код доступа затем и придуман, чтобы право получал
;; предъявитель. Конверта тоже нет: ключ уходит шестнадцатью байтами, как его
;; ждёт плеер, а токен лишь называет, кто спрашивает.

; Смена режима доступа. Меняет политику и не трогает ни состояние нарезки,
; ни файлы, ни поколение секрета — поэтому переключение мгновенно.
(define-fun accessAfterToggle ((a Access)) Access
  (ite (= a Public) Private Public))

(define-fun statusAfterToggle ((s Status)) Status s)

(define-fun generationAfterToggle ((g Int)) Int g)

; Действительность ранее выданной выдачи: она привязана к поколению секрета.
; Пока поколение прежнее — выдача в силе; сменилось — больше не действует.
(define-fun grantValid ((gIssued Int) (gNow Int)) Bool
  (= gIssued gNow))

; Смена секрета — единственная операция, повышающая поколение.
(define-fun generationAfterRekey ((g Int)) Int (+ g 1))

; Просмотры. Активен тот, кто отметился не позже порога протухания.
(define-fun staleAfter () Int 120)

(define-fun watchAlive ((now Int) (last Int)) Bool
  (<= (- now last) staleAfter))

; Допуск нового просмотра при лимите — без вытеснения и с вытеснением.
(define-fun admitWithoutEviction ((n Int) (lim Int)) Bool
  (< n lim))

(define-fun aliveAfterEviction ((n Int) (lim Int)) Int
  (ite (< n lim) (+ n 1) lim))

; ---------------------------------------------------------------------------
; СЕКЦИЯ C2 — НАБОРЫ И ПРАВА
; ---------------------------------------------------------------------------
; Курсы продаёт не один владелец сайта, а участники сообщества: у каждого свои
; плейлисты и свои покупатели. Поэтому право — отдельная связь «зритель × плейлист»,
; а не флаг на видео и не свойство плейлиста.
;
; Почему не каскад «закрытый плейлист закрывает свои видео»: тогда платный
; плейлист с бесплатными вводными уроками невозможен — они закрылись бы вместе
; с остальными. Видео сам говорит, нужен ли для него доступ; плейлист говорит,
; чем этот доступ выдаётся.

(declare-sort Playlist 0)
(declare-sort Author 0)

(declare-fun inPlaylist (Video Playlist) Bool)

;; --------------------------------------------------------------------------
;; Доступ - то, что продают и то, что отбирают целиком.
;;
;; Он безличен: не «Аня купила», а «Курс открыт». Знает, какие материалы в него
;; входят - напрямую или через подборку, - и держит общую дату отсечки. Ноль
;; означает «бессрочно»; дата в прошлом закрывает доступ у всех разом, сколько
;; бы прав под ним ни выдали.
;;
;; Ради этой строки доступ и заведён отдельной сущностью. Права выдаются
;; поштучно, и закрыть материал ото всех, обходя каждое, нереально: одно
;; обязательно останется незакрытым.
(declare-sort Pass 0)
(declare-fun passOwner (Pass) Author)

(declare-fun passHasVideo    (Pass Video) Bool)
(declare-fun passHasPlaylist (Pass Playlist) Bool)
(declare-fun passCutoff      (Pass) Int)

(assert (forall ((p Pass)) (>= (passCutoff p) 0)))

;; Доступ покрывает материал напрямую либо через подборку, в которую тот входит.
;; Состав подборки поменялся - покрытие поменялось само, догонять нечего.
(define-fun passCovers ((p Pass) (v Video)) Bool
  (or (passHasVideo p v)
      (exists ((pl Playlist)) (and (passHasPlaylist p pl) (inPlaylist v pl)))))

;; --------------------------------------------------------------------------
;; Право - личное и со своими условиями.
;;
;; Своя дата истечения и своё число просмотров: один купил бессрочно, другой
;; вошёл по недельному промо, и это один и тот же доступ, а не два.
;;
;; Хранится записью, а не внутри токена. Так было не всегда: право из
;; погашенного кода жило в токене, и отозвать его было нельзя - сервер о нём
;; не знал вовсе. Всё, что выдано, обязано существовать записью.
(declare-fun rightHeld     (Viewer Pass) Bool)
(declare-fun rightUntil    (Viewer Pass) Int)
(declare-fun rightViews    (Viewer Pass) Int)
(declare-fun rightMaxViews (Viewer Pass) Int)

(assert (forall ((z Viewer) (p Pass))
  (and (>= (rightUntil z p) 0)
       (>= (rightViews z p) 0)
       (>= (rightMaxViews z p) 0))))

;; Живость вычисляется из условий, а не хранится флагом: иначе истёкшее ждало бы,
;; пока его кто-нибудь погасит, и до тех пор пускало бы.
;;
;; Ноль в сроке и в лимите значит «без ограничения» - это отсутствие условия,
;; а не условие «ноль».
(define-fun deadlineAlive ((deadline Int) (now Int)) Bool
  (or (= deadline 0) (> deadline now)))

(define-fun passAlive ((p Pass) (now Int)) Bool
  (deadlineAlive (passCutoff p) now))

(define-fun rightAlive ((z Viewer) (p Pass) (now Int)) Bool
  (and (rightHeld z p)
       (deadlineAlive (rightUntil z p) now)
       (or (= (rightMaxViews z p) 0)
           (< (rightViews z p) (rightMaxViews z p)))))

;; Проверка двухступенчатая и в этом порядке: жив ли доступ, и только потом
;; смотрим право. Отсюда же следует счёт срока по более раннему из двух:
;; личная бессрочность не переживает отсечку доступа.
(define-fun grants ((z Viewer) (p Pass) (now Int)) Bool
  (and (passAlive p now) (rightAlive z p now)))

;; Право принадлежит идентичности, а не токену. Токен лишь предъявляет её:
;; у другого посетителя она другая, и чужое право по нему не находится.
;;
;; Работает и для анонима: сервер выдаёт ему маркер при первой встрече, и право
;; по коду записывается на этот маркер - так же, как купленное на учётную запись.
(declare-fun identity (Viewer) Int)

(assert (forall ((a Viewer) (b Viewer) (p Pass))
  (=> (and (rightHeld a p) (not (= (identity a) (identity b))))
      (not (rightHeld b p)))))

;; Отзыв поштучно. Снятое право перестаёт открывать немедленно: ключ спрашивают
;; на каждый кусок, и следующая же просьба упирается в его отсутствие.
(declare-fun revoked (Viewer Pass) Bool)

(assert (forall ((z Viewer) (p Pass))
  (=> (revoked z p) (not (rightHeld z p)))))

;; Свой закрытый материал автор смотрит всегда.
;;
;; Это не поблажка, а рабочая необходимость: перед публикацией нужно убедиться,
;; что залит нужный файл, а закрытое иначе не откроется даже тому, кто его
;; загрузил, - и автор публикует вслепую.
(declare-fun owns (Viewer Video) Bool)

;; Роль администратора площадки доступа к чужому закрытому НЕ даёт.
;;
;; На площадке с несколькими авторами администратор посторонний для чужого
;; материала: иначе он молча выкачивает чужие платные подборки. Полностью это
;; не защищает - ключи от базы у него, - но выдать себе право придётся явно,
;; и запись об этом останется.
(declare-fun isAdmin (Viewer) Bool)

;; Владение живёт в учётной записи, поэтому автор всегда вошедший.
(assert (forall ((z Viewer) (v Video)) (=> (owns z v) (signedIn z))))

;; Материалу нужен доступ. Открытые признака не имеют и доступны всем, даже
;; лёжа внутри платного доступа: это бесплатный вводный урок, которым курс
;; продают.
(define-fun needsEntitlement ((v Video)) Bool (= (access v) Private))

;; Итог: закрытый материал открывает живое право на любой доступ, который его
;; покрывает. Прав может быть несколько, хватает одного.
(define-fun mayWatch ((v Video) (z Viewer) (now Int)) Bool
  (or (not (needsEntitlement v))
      (owns z v)
      (exists ((p Pass)) (and (passCovers p v) (grants z p now)))))

(define-fun keyIssuedByRights ((v Video) (z Viewer) (now Int)) Bool
  (and (= (status v) Ready) (mayWatch v z now)))

; ---------------------------------------------------------------------------
; СЕКЦИЯ D — ТЕСТЫ
; ---------------------------------------------------------------------------
; Схема блока:
;   ;@TEST          имя
;   ;@EXPECT        sat|unsat
;   ;@COVERED-BY    <файл теста>::<случай>   (или «n/a — проверка модели»)
;   (push) ... (check-sat) (pop)
;
; unsat — отрицание свойства невыполнимо, значит свойство держится.
; sat    — описанный сценарий достижим, значит случай разрешён.

;@TEST          Оба режима достижимы у готового видео
;@EXPECT        sat
;@COVERED-BY    n/a — проверка модели
(push)
(declare-const openOne Video)
(declare-const closedOne Video)
(assert (= (status openOne) Ready))
(assert (= (status closedOne) Ready))
(assert (= (access openOne) Public))
(assert (= (access closedOne) Private))
(check-sat)
(pop)

;@TEST          Переключение режима работает в обе стороны
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/collections/Media.test.ts::переключение режима
(push)
(assert (or (not (= (accessAfterToggle Public) Private))
            (not (= (accessAfterToggle Private) Public))))
(check-sat)
(pop)

;@TEST          Смена режима не сбрасывает нарезку и не трогает секрет
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/collections/Media.test.ts::переключение без перенарезки
(push)
(declare-const s Status)
(declare-const g Int)
(assert (or (not (= (statusAfterToggle s) s))
            (not (= (generationAfterToggle g) g))))
(check-sat)
(pop)

;@TEST          Закрытие режима прекращает выдачу тому же зрителю
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::после закрытия отказ
(push)
(declare-const before Video)
(declare-const after Video)
(declare-const z Viewer)
(declare-const now Int)
(assert (= (status after) Ready))
(assert (= (access before) Public))
(assert (= (access after) Private))
(assert (forall ((p Pass)) (not (rightHeld z p))))
(assert (not (owns z after)))
(assert (keyIssuedByRights after z now))
(check-sat)
(pop)

;@TEST          Открытое отдаётся кому угодно, вход не нужен
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::аноним смотрит открытое
(push)
(declare-const v Video)
(declare-const z Viewer)
(declare-const now Int)
(assert (= (status v) Ready))
(assert (= (access v) Public))
(assert (forall ((p Pass)) (not (rightHeld z p))))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Недорезанное видео не отдаёт ключ ни в каком режиме
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::видео ещё в очереди
(push)
(declare-const v Video)
(declare-const z Viewer)
(declare-const now Int)
(assert (not (= (status v) Ready)))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Прежние выдачи прекращают действовать только со сменой секрета
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::поколение секрета
(push)
(declare-const g Int)
(assert (grantValid g (generationAfterRekey g)))
(check-sat)
(pop)

;@TEST          Пока секрет прежний, ранее выданное остаётся в силе
;@EXPECT        sat
;@COVERED-BY    n/a — проверка модели
(push)
(declare-const g Int)
(assert (grantValid g (generationAfterToggle g)))
(check-sat)
(pop)

;@TEST          Оригинал не пропадает, пока нарезки нет
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/media/build-hls.test.ts::сбой не уносит исходник
(push)
(declare-const v Video)
(assert (not (hasRendition v)))
(assert (not (hasOriginal v)))
(check-sat)
(pop)

;@TEST          После ошибки исходник на месте и задачу можно повторить
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/media/build-hls.test.ts::повтор после ошибки
(push)
(declare-const v Video)
(assert (= (status v) Failed))
(assert (hasOriginal v))
(check-sat)
(pop)

;@TEST          Лимит просмотров не превышается без вытеснения
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/watch-limit.test.ts::третий на двух местах
(push)
(declare-const alive Int)
(declare-const lim Int)
(assert (> lim 0))
(assert (>= alive lim))
(assert (admitWithoutEviction alive lim))
(check-sat)
(pop)

;@TEST          Вытеснение не поднимает число активных выше лимита
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/watch-limit.test.ts::вытеснение старейшего
(push)
(declare-const alive Int)
(declare-const lim Int)
(assert (and (>= alive 0) (> lim 0)))
(assert (> (aliveAfterEviction alive lim) lim))
(check-sat)
(pop)

;@TEST          Молчащий дольше порога перестаёт занимать место
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/watch-limit.test.ts::протухший просмотр
(push)
(declare-const now Int)
(declare-const last Int)
(assert (> (- now last) staleAfter))
(assert (watchAlive now last))
(check-sat)
(pop)

;@TEST          Открытый материал доступен всем, даже покрытый платным доступом
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::открытая запись
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (= (status v) Ready))
(assert (= (access v) Public))
(assert (passHasVideo p v))
(assert (not (rightHeld z p)))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Закрытый материал без права не открывается
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::нет права
(push)
(declare-const v Video)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (forall ((p Pass)) (not (rightHeld z p))))
; Не автор: своё он смотрит независимо от прав.
(assert (not (owns z v)))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Право на доступ открывает всё, что доступ покрывает
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::право на доступ
(push)
(declare-const v Video)
(declare-const pl Playlist)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (inPlaylist v pl))
(assert (passHasPlaylist p pl))
(assert (rightHeld z p))
; Ни доступ, ни право не истекли.
(assert (= (passCutoff p) 0))
(assert (= (rightUntil z p) 0))
(assert (= (rightMaxViews z p) 0))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Отсечка доступа закрывает материал, хотя личное право бессрочно
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::отсечка доступа
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (passHasVideo p v))
(assert (rightHeld z p))
; Личных ограничений нет вовсе.
(assert (= (rightUntil z p) 0))
(assert (= (rightMaxViews z p) 0))
; А отсечка доступа уже прошла.
(assert (> (passCutoff p) 0))
(assert (<= (passCutoff p) now))
(assert (not (owns z v)))
; Другого доступа, покрывающего материал, у него нет.
(assert (forall ((q Pass)) (=> (not (= q p)) (not (rightHeld z q)))))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Отсечка доступа гасит обоих держателей разом
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::отзыв доступа разом
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const anna Viewer)
(declare-const boris Viewer)
(declare-const now Int)
(assert (distinct anna boris))
(assert (needsEntitlement v))
(assert (passHasVideo p v))
; Права у обоих есть и личных ограничений нет.
(assert (and (rightHeld anna p) (rightHeld boris p)))
(assert (and (= (rightUntil anna p) 0) (= (rightUntil boris p) 0)))
(assert (and (= (rightMaxViews anna p) 0) (= (rightMaxViews boris p) 0)))
(assert (not (owns anna v)))
(assert (not (owns boris v)))
(assert (forall ((q Pass)) (=> (not (= q p)) (and (not (rightHeld anna q)) (not (rightHeld boris q))))))
; Владелец переставил отсечку на сегодня.
(assert (> (passCutoff p) 0))
(assert (<= (passCutoff p) now))
; Хотя бы одному ключ всё же достался - этого быть не должно.
(assert (or (keyIssuedByRights v anna now) (keyIssuedByRights v boris now)))
(check-sat)
(pop)

;@TEST          Личный срок короче общего закрывает раньше отсечки
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::личный срок короче
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (passHasVideo p v))
(assert (rightHeld z p))
(assert (= (rightMaxViews z p) 0))
; Доступ ещё жив, а личное право уже истекло.
(assert (or (= (passCutoff p) 0) (> (passCutoff p) now)))
(assert (> (rightUntil z p) 0))
(assert (<= (rightUntil z p) now))
(assert (not (owns z v)))
(assert (forall ((q Pass)) (=> (not (= q p)) (not (rightHeld z q)))))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Исчерпанный счёт просмотров больше не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::счёт просмотров исчерпан
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (passHasVideo p v))
(assert (rightHeld z p))
(assert (= (passCutoff p) 0))
(assert (= (rightUntil z p) 0))
; Лимит задан и выбран.
(assert (> (rightMaxViews z p) 0))
(assert (>= (rightViews z p) (rightMaxViews z p)))
(assert (not (owns z v)))
(assert (forall ((q Pass)) (=> (not (= q p)) (not (rightHeld z q)))))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Право одного не открывает материал другому
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::чужое право не открывает
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const first Viewer)
(declare-const second Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (passHasVideo p v))
(assert (not (= first second)))
(assert (rightHeld first p))
; Идентичности разные - именно они, а не токен, держат право.
(assert (not (= (identity first) (identity second))))
(assert (forall ((q Pass)) (not (rightHeld second q))))
(assert (not (owns second v)))
(assert (keyIssuedByRights v second now))
(check-sat)
(pop)

;@TEST          Код открывает закрытый материал без учётной записи
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::код открывает без входа
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (passHasVideo p v))
(assert (not (signedIn z)))
; Право записано на маркер, выданный анониму: учётной записи нет, а отозвать
; выданное всё равно можно - запись существует.
(assert (rightHeld z p))
(assert (= (passCutoff p) 0))
(assert (= (rightUntil z p) 0))
(assert (= (rightMaxViews z p) 0))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Администратор площадки чужое закрытое не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::администратор не смотрит чужое
(push)
(declare-const v Video)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (isAdmin z))
(assert (not (owns z v)))
; Роль сама по себе записи о праве не создаёт.
(assert (forall ((p Pass)) (not (rightHeld z p))))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Владелец смотрит свой закрытый материал без всякого права
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::владелец смотрит своё
(push)
(declare-const v Video)
(declare-const z Viewer)
(declare-const now Int)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (owns z v))
; Ни одного права у него нет - открывает именно владение.
(assert (forall ((p Pass)) (not (rightHeld z p))))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Чужой закрытый материал владение своим не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::чужое владение не открывает
(push)
(declare-const mine Video)
(declare-const other Video)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement other))
(assert (not (= mine other)))
(assert (owns z mine))
(assert (not (owns z other)))
(assert (forall ((p Pass)) (not (rightHeld z p))))
(assert (keyIssuedByRights other z now))
(check-sat)
(pop)

;@TEST          Право на доступ, не покрывающий материал, его не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::право на другой доступ
(push)
(declare-const v Video)
(declare-const mine Pass)
(declare-const other Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (not (= mine other)))
(assert (passCovers mine v))
(assert (not (passCovers other v)))
; Право есть, но на тот доступ, который этот материал не покрывает.
(assert (rightHeld z other))
(assert (forall ((q Pass)) (=> (rightHeld z q) (= q other))))
(assert (not (owns z v)))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Материал в двух доступах открывается правом на любой
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::материал в двух доступах
(push)
(declare-const v Video)
(declare-const first Pass)
(declare-const second Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (distinct first second))
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (passHasVideo first v))
(assert (passHasVideo second v))
(assert (rightHeld z second))
(assert (= (passCutoff second) 0))
(assert (= (rightUntil z second) 0))
(assert (= (rightMaxViews z second) 0))
(assert (keyIssuedByRights v z now))
(check-sat)
(pop)

;@TEST          Доступы разных продавцов не смешиваются
;@EXPECT        sat
;@COVERED-BY    n/a — проверка модели
(push)
(declare-const trainer Author)
(declare-const member Author)
(declare-const first Pass)
(declare-const second Pass)
(assert (distinct trainer member))
(assert (= (passOwner first) trainer))
(assert (= (passOwner second) member))
(check-sat)
(pop)

;@TEST          Модель непротиворечива
;@EXPECT        sat
;@COVERED-BY    n/a — проверка модели
(push)
(declare-const v Video)
(assert (= (status v) Ready))
(check-sat)
(pop)
