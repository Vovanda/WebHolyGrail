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

; Выдача конверта: секрет отдаётся только зашифрованным на токен зрителя.
(define-fun envelopeIssued ((v Video) (z Viewer)) Bool
  (and (= (status v) Ready)
       (or (= (access v) Public) (signedIn z))))

; Вскрытие конверта — только собственным токеном зрителя.
(define-fun envelopeOpened ((v Video) (z Viewer) (t Int)) Bool
  (and (envelopeIssued v z) (= t (token z))))

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
; наборы и свои покупатели. Поэтому право — отдельная связь «зритель × набор»,
; а не флаг на ролике и не свойство плейлиста.
;
; Почему не каскад «закрытый плейлист закрывает свои ролики»: тогда платный
; набор с бесплатными вводными уроками невозможен — они закрылись бы вместе
; с остальными. Ролик сам говорит, нужен ли для него доступ; набор говорит,
; чем этот доступ выдаётся.

(declare-sort Playlist 0)
(declare-sort Author 0)

(declare-fun playlistOwner (Playlist) Author)
(declare-fun inPlaylist (Video Playlist) Bool)

; Право зрителя на набор. Способ выдачи (код, оплата, рука администратора)
; модели безразличен — важен сам факт.
(declare-fun entitled (Viewer Playlist) Bool)

; Ролику нужен доступ. Бесплатные вводные уроки признака не имеют и открыты
; всем, даже находясь в платном наборе.
(define-fun needsEntitlement ((v Video)) Bool (= (access v) Private))

; Итог: закрытый ролик открывается, если у зрителя есть право хотя бы на один
; набор, куда этот ролик входит. Купил любой курс с этим уроком — смотришь.
(define-fun mayWatch ((v Video) (z Viewer)) Bool
  (or (not (needsEntitlement v))
      (exists ((p Playlist)) (and (inPlaylist v p) (entitled z p)))))

(define-fun envelopeIssuedWithEntitlements ((v Video) (z Viewer)) Bool
  (and (= (status v) Ready) (mayWatch v z)))

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

;@TEST          Неавторизованный не получает конверт к закрытому
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::отказ анониму
(push)
(declare-const v Video)
(declare-const z Viewer)
(assert (= (access v) Private))
(assert (not (signedIn z)))
(assert (envelopeIssued v z))
(check-sat)
(pop)

;@TEST          Закрытие режима прекращает выдачу тому же зрителю
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::после закрытия отказ
(push)
(declare-const before Video)
(declare-const after Video)
(declare-const z Viewer)
(assert (= (status after) Ready))
(assert (= (access before) Public))
(assert (= (access after) Private))
(assert (not (signedIn z)))
(assert (envelopeIssued after z))
(check-sat)
(pop)

;@TEST          Открытое отдаётся кому угодно, вход не нужен
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::аноним смотрит открытое
(push)
(declare-const v Video)
(declare-const z Viewer)
(assert (= (status v) Ready))
(assert (= (access v) Public))
(assert (not (signedIn z)))
(assert (envelopeIssued v z))
(check-sat)
(pop)

;@TEST          Конверт вскрывается только собственным токеном
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::чужой токен
(push)
(declare-const v Video)
(declare-const mine Viewer)
(declare-const other Viewer)
(assert (distinct mine other))
(assert (envelopeOpened v mine (token other)))
(check-sat)
(pop)

;@TEST          Недорезанное видео не отдаёт конверт ни в каком режиме
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/grant-access.test.ts::видео ещё в очереди
(push)
(declare-const v Video)
(declare-const z Viewer)
(assert (not (= (status v) Ready)))
(assert (envelopeIssued v z))
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

;@TEST          Бесплатный урок открыт всем даже в платном наборе
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::бесплатный урок
(push)
(declare-const v Video)
(declare-const p Playlist)
(declare-const z Viewer)
(assert (= (status v) Ready))
(assert (= (access v) Public))
(assert (inPlaylist v p))
(assert (not (entitled z p)))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Закрытый урок без права не открывается
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::нет права
(push)
(declare-const v Video)
(declare-const z Viewer)
(assert (needsEntitlement v))
(assert (forall ((p Playlist)) (not (entitled z p))))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Право на набор открывает все его закрытые уроки
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::оплата открывает набор
(push)
(declare-const v Video)
(declare-const p Playlist)
(declare-const z Viewer)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (inPlaylist v p))
(assert (entitled z p))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Право на чужой набор не открывает урок
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::право на другой курс
(push)
(declare-const v Video)
(declare-const mine Playlist)
(declare-const other Playlist)
(declare-const z Viewer)
(assert (needsEntitlement v))
(assert (inPlaylist v mine))
(assert (not (inPlaylist v other)))
(assert (entitled z other))
(assert (forall ((p Playlist)) (=> (entitled z p) (= p other))))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Урок в двух курсах открывается правом на любой из них
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::урок в двух курсах
(push)
(declare-const v Video)
(declare-const first Playlist)
(declare-const second Playlist)
(declare-const z Viewer)
(assert (distinct first second))
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (inPlaylist v first))
(assert (inPlaylist v second))
(assert (entitled z second))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Наборы разных продавцов не смешиваются
;@EXPECT        sat
;@COVERED-BY    n/a — проверка модели
(push)
(declare-const trainer Author)
(declare-const member Author)
(declare-const first Playlist)
(declare-const second Playlist)
(assert (distinct trainer member))
(assert (= (playlistOwner first) trainer))
(assert (= (playlistOwner second) member))
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
