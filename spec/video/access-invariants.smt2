; Модель доступа к видео.
;
; Пишется от потоков в docs/whg/42-access-flows.md и ведёт за собой код:
; правило меняется здесь, гоняется verify_access.py, и только потом правится
; реализация.
;
; Четыре сущности. Доступ безличен и держит состав с датой отсечки; право
; личное и со своими условиями; код - билет к доступу, его диктуют вслух;
; ссылка ведёт к тому же доступу, но живёт по своим правилам - её адрес
; длинный, а срок обязателен.

; ---------------------------------------------------------------------------
; СЕКЦИЯ A — УНИВЕРСУМ
; ---------------------------------------------------------------------------

(declare-datatype Status ((Uploaded) (Queued) (Encoding) (Ready) (Failed)))
(declare-datatype Access ((Public) (Private)))

(declare-sort Video 0)
(declare-fun status (Video) Status)
(declare-fun access (Video) Access)
(declare-fun hasOriginal (Video) Bool)
(declare-fun hasRendition (Video) Bool)

; Поколение секрета. Растёт при смене секрета; прежняя выдача действительна,
; пока поколение не сменилось.
(declare-fun generation (Video) Int)
(assert (forall ((v Video)) (>= (generation v) 0)))

(declare-sort Playlist 0)
(declare-fun inPlaylist (Video Playlist) Bool)

(declare-sort Viewer 0)
(declare-sort Author 0)

; Идентичность зрителя: маркер посетителя, учётная запись, телефон или почта.
; Право принадлежит ей, а не браузеру.
(declare-fun identity (Viewer) Int)

(declare-fun owns (Viewer Video) Bool)
(declare-fun isAdmin (Viewer) Bool)

; ---------------------------------------------------------------------------
; СЕКЦИЯ B — ИНВАРИАНТЫ СОСТОЯНИЙ
; ---------------------------------------------------------------------------

; Нарезка существует тогда и только тогда, когда видео готово.
(assert (forall ((v Video)) (= (hasRendition v) (= (status v) Ready))))

; Оригинал удаляется ровно при переходе в Ready: иначе повтор задачи после
; сбоя останется без исходника.
(assert (forall ((v Video)) (= (hasOriginal v) (not (= (status v) Ready)))))

; ---------------------------------------------------------------------------
; СЕКЦИЯ C — ДОСТУП
; ---------------------------------------------------------------------------

(declare-sort Pass 0)
(declare-fun passOwner (Pass) Author)
(declare-fun passHasVideo (Pass Video) Bool)
(declare-fun passHasPlaylist (Pass Playlist) Bool)

; Дата отсечки. Ноль - бессрочно; дата в прошлом закрывает доступ у всех
; держателей разом.
(declare-fun passCutoff (Pass) Int)
(assert (forall ((p Pass)) (>= (passCutoff p) 0)))

; Покрытие: напрямую либо через подборку.
(define-fun passCovers ((p Pass) (v Video)) Bool
  (or (passHasVideo p v)
      (exists ((pl Playlist)) (and (passHasPlaylist p pl) (inPlaylist v pl)))))

; Ноль в сроке и в пределе значит «без ограничения».
(define-fun deadlineAlive ((deadline Int) (now Int)) Bool
  (or (= deadline 0) (> deadline now)))

(define-fun passAlive ((p Pass) (now Int)) Bool
  (deadlineAlive (passCutoff p) now))

; ---------------------------------------------------------------------------
; СЕКЦИЯ D — ПРАВО
; ---------------------------------------------------------------------------

(declare-fun rightHeld (Viewer Pass) Bool)
(declare-fun rightUntil (Viewer Pass) Int)
(declare-fun rightViews (Viewer Pass) Int)
(declare-fun rightMaxViews (Viewer Pass) Int)

(assert (forall ((z Viewer) (p Pass))
  (and (>= (rightUntil z p) 0) (>= (rightViews z p) 0) (>= (rightMaxViews z p) 0))))

; Живость вычисляется из условий, флагом не хранится.
(define-fun rightAlive ((z Viewer) (p Pass) (now Int)) Bool
  (and (rightHeld z p)
       (deadlineAlive (rightUntil z p) now)
       (or (= (rightMaxViews z p) 0) (< (rightViews z p) (rightMaxViews z p)))))

; Проверка в два шага и в этом порядке: жив доступ, потом право.
(define-fun grants ((z Viewer) (p Pass) (now Int)) Bool
  (and (passAlive p now) (rightAlive z p now)))

; Право принадлежит идентичности.
(assert (forall ((a Viewer) (b Viewer) (p Pass))
  (=> (and (rightHeld a p) (not (= (identity a) (identity b)))) (not (rightHeld b p)))))

; Право на доступ у человека одно. Он узнаётся любым своим признаком - маркером
; браузера, учётной записью, телефоном, почтой, - и повторная выдача находит
; прежнее право по любому из них, а не заводит второе.
;
; Иначе вошедший получал бы второе право рядом с тем, что лежало на маркере,
; и в списке владельца один покупатель выглядел бы двумя.
(declare-fun sameHolder (Viewer Viewer) Bool)

(assert (forall ((a Viewer) (b Viewer))
  (=> (= (identity a) (identity b)) (sameHolder a b))))

(assert (forall ((a Viewer) (b Viewer) (p Pass))
  (=> (and (sameHolder a b) (rightHeld a p)) (rightHeld b p))))

; Отзыв поштучно.
(declare-fun revoked (Viewer Pass) Bool)
(assert (forall ((z Viewer) (p Pass)) (=> (revoked z p) (not (rightHeld z p)))))

; ---------------------------------------------------------------------------
; СЕКЦИЯ E — КОД
; ---------------------------------------------------------------------------

; Код - одноразовый пароль к доступу: кто получил, тот получил и право. Его
; диктуют вслух, поэтому он короткий и в алфавите без похожих начертаний;
; короткая жизнь заменяет длину - подобрать за пять минут нельзя.
(declare-sort Code 0)
(declare-fun codePass (Code) Pass)
(declare-fun codeRevoked (Code) Bool)
(declare-fun codeExpires (Code) Int)
(declare-fun codeMaxUses (Code) Int)
(declare-fun codeUsed (Code) Int)

; Что код даёт праву: срок и предел просмотров.
(declare-fun codeGrantUntil (Code) Int)
(declare-fun codeGrantViews (Code) Int)

(assert (forall ((c Code))
  (and (>= (codeExpires c) 0) (>= (codeMaxUses c) 0) (>= (codeUsed c) 0)
       (>= (codeGrantUntil c) 0) (>= (codeGrantViews c) 0))))

; Годность кода: отзыв, срок, предел срабатываний.
(define-fun codeUsable ((c Code) (now Int)) Bool
  (and (not (codeRevoked c))
       (deadlineAlive (codeExpires c) now)
       (or (= (codeMaxUses c) 0) (< (codeUsed c) (codeMaxUses c)))))

; Активация заводит право на предъявителя: учётная запись не нужна.
(define-fun activates ((c Code) (now Int)) Bool (codeUsable c now))

; Срок после активации: повторная продлевает, но не сокращает.
(define-fun untilAfterActivation ((had Int) (c Code)) Int
  (ite (= had 0)
       0
       (ite (= (codeGrantUntil c) 0)
            0
            (ite (> (codeGrantUntil c) had) (codeGrantUntil c) had))))

(define-fun usedAfterActivation ((c Code)) Int (+ (codeUsed c) 1))

; ---------------------------------------------------------------------------
; СЕКЦИЯ E2 — ССЫЛКА-ПРИГЛАШЕНИЕ
; ---------------------------------------------------------------------------

; Ссылка ведёт к тому же доступу, что и код, но живёт по своим правилам: её
; адрес длинный и машинный - короткий подобрали бы перебором, - и срок у неё
; обязателен, потому что она остаётся в чужой переписке.
(declare-sort Link 0)
(declare-fun linkPass (Link) Pass)
(declare-fun linkRevoked (Link) Bool)
(declare-fun linkExpires (Link) Int)
(declare-fun linkMaxUses (Link) Int)
(declare-fun linkUsed (Link) Int)

(assert (forall ((l Link))
  (and (>= (linkExpires l) 0) (>= (linkMaxUses l) 0) (>= (linkUsed l) 0))))

; Срок обязателен: нулевого, то есть бессрочного, у ссылки не бывает.
(assert (forall ((l Link)) (> (linkExpires l) 0)))

(define-fun linkUsable ((l Link) (now Int)) Bool
  (and (not (linkRevoked l))
       (> (linkExpires l) now)
       (or (= (linkMaxUses l) 0) (< (linkUsed l) (linkMaxUses l)))))

(define-fun usedAfterFollow ((l Link)) Int (+ (linkUsed l) 1))

; ---------------------------------------------------------------------------
; СЕКЦИЯ F — ПРОСМОТР
; ---------------------------------------------------------------------------

; Ключ спрашивают на каждый отрезок потока, поэтому просмотр - первое взятие
; ключа к записи в пределах окна, а не каждый запрос.
(define-fun viewWindow () Int 86400)

(declare-fun lastTaken (Viewer Video) Int)
(assert (forall ((z Viewer) (v Video)) (>= (lastTaken z v) 0)))

(define-fun withinWindow ((last Int) (now Int)) Bool
  (and (> last 0) (<= (- now last) viewWindow)))

(define-fun countsAsView ((z Viewer) (v Video) (now Int)) Bool
  (not (withinWindow (lastTaken z v) now)))

; Одновременные просмотры: активен тот, кто отметился не позже порога.
(define-fun staleAfter () Int 120)
(define-fun watchAlive ((now Int) (last Int)) Bool (<= (- now last) staleAfter))
(define-fun admitWithoutEviction ((n Int) (lim Int)) Bool (< n lim))
(define-fun aliveAfterEviction ((n Int) (lim Int)) Int (ite (< n lim) (+ n 1) lim))

; Действительность прежней выдачи привязана к поколению секрета.
(define-fun grantValid ((gIssued Int) (gNow Int)) Bool (= gIssued gNow))
(define-fun generationAfterRekey ((g Int)) Int (+ g 1))

; Смена режима не трогает ни нарезку, ни секрет.
(define-fun accessAfterToggle ((a Access)) Access (ite (= a Public) Private Public))
(define-fun statusAfterToggle ((s Status)) Status s)
(define-fun generationAfterToggle ((g Int)) Int g)

; ---------------------------------------------------------------------------
; СЕКЦИЯ G — ВЫДАЧА КЛЮЧА
; ---------------------------------------------------------------------------

(define-fun needsEntitlement ((v Video)) Bool (= (access v) Private))

; Своё автор смотрит всегда: иначе он публикует вслепую.
(define-fun mayWatch ((v Video) (z Viewer) (now Int)) Bool
  (or (not (needsEntitlement v))
      (owns z v)
      (exists ((p Pass)) (and (passCovers p v) (grants z p now)))))

; Ключ уходит шестнадцатью байтами; токен лишь называет, кто спрашивает.
(define-fun keyIssued ((v Video) (z Viewer) (now Int)) Bool
  (and (= (status v) Ready) (mayWatch v z now)))

; ---------------------------------------------------------------------------
; СЕКЦИЯ H — ТЕСТЫ
; ---------------------------------------------------------------------------
;   ;@TEST          имя
;   ;@EXPECT        sat|unsat
;   ;@COVERED-BY    <файл теста>::<случай>
;
; unsat — отрицание свойства невыполнимо, значит свойство держится.
; sat    — сценарий достижим, значит случай разрешён.

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
(assert (keyIssued v z now))
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
(assert (not (owns z v)))
(assert (keyIssued v z now))
(check-sat)
(pop)

;@TEST          Право на доступ открывает всё, что доступ покрывает
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlement-source.test.ts::право на подборку
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
(assert (= (passCutoff p) 0))
(assert (= (rightUntil z p) 0))
(assert (= (rightMaxViews z p) 0))
(assert (keyIssued v z now))
(check-sat)
(pop)

;@TEST          Отсечка доступа закрывает материал, хотя личное право бессрочно
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlement-source.test.ts::отсечка доступа
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (not (owns z v)))
(assert (> now 0))
(assert (and (> (passCutoff p) 0) (<= (passCutoff p) now)))
(assert (forall ((other Pass)) (=> (not (= other p)) (not (rightHeld z other)))))
(assert (keyIssued v z now))
(check-sat)
(pop)

;@TEST          Отсечка гасит обоих держателей разом
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlement-source.test.ts::отзыв разом
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const anna Viewer)
(declare-const boris Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (not (owns anna v)))
(assert (not (owns boris v)))
(assert (> now 0))
(assert (and (> (passCutoff p) 0) (<= (passCutoff p) now)))
(assert (forall ((other Pass))
  (=> (not (= other p))
      (and (not (rightHeld anna other)) (not (rightHeld boris other))))))
(assert (or (keyIssued v anna now) (keyIssued v boris now)))
(check-sat)
(pop)

;@TEST          Личный срок короче общего закрывает раньше отсечки
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlement-source.test.ts::личный срок
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (not (owns z v)))
(assert (> now 0))
(assert (= (passCutoff p) 0))
(assert (and (> (rightUntil z p) 0) (<= (rightUntil z p) now)))
(assert (forall ((other Pass)) (=> (not (= other p)) (not (rightHeld z other)))))
(assert (keyIssued v z now))
(check-sat)
(pop)

;@TEST          Исчерпанный счёт просмотров больше не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlement-source.test.ts::счёт просмотров
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (not (owns z v)))
(assert (= (passCutoff p) 0))
(assert (= (rightUntil z p) 0))
(assert (and (> (rightMaxViews z p) 0) (>= (rightViews z p) (rightMaxViews z p))))
(assert (forall ((other Pass)) (=> (not (= other p)) (not (rightHeld z other)))))
(assert (keyIssued v z now))
(check-sat)
(pop)

;@TEST          Право не двоится: тот же человек другим признаком находит прежнее
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/write-entitlement.test.ts::поиск по всем признакам
(push)
(declare-const p Pass)
(declare-const marked Viewer)
(declare-const signed Viewer)
(assert (sameHolder marked signed))
(assert (rightHeld marked p))
(assert (not (rightHeld signed p)))
(check-sat)
(pop)

;@TEST          Право одного не открывает материал другому
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlement-source.test.ts::чужое право
(push)
(declare-const p Pass)
(declare-const a Viewer)
(declare-const b Viewer)
(assert (not (= (identity a) (identity b))))
(assert (rightHeld a p))
(assert (rightHeld b p))
(check-sat)
(pop)

;@TEST          Владелец смотрит свой закрытый материал без всякого права
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::своё автор смотрит
(push)
(declare-const v Video)
(declare-const z Viewer)
(declare-const now Int)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (owns z v))
(assert (forall ((p Pass)) (not (rightHeld z p))))
(assert (keyIssued v z now))
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
(assert (forall ((p Pass)) (not (rightHeld z p))))
(assert (keyIssued v z now))
(check-sat)
(pop)

;@TEST          Право на доступ, не покрывающий материал, его не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlement-source.test.ts::доступ не покрывает
(push)
(declare-const v Video)
(declare-const p Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (needsEntitlement v))
(assert (not (owns z v)))
(assert (not (passCovers p v)))
(assert (forall ((other Pass)) (=> (not (= other p)) (not (rightHeld z other)))))
(assert (keyIssued v z now))
(check-sat)
(pop)

;@TEST          Материал в двух доступах открывается правом на любой
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlement-source.test.ts::два доступа
(push)
(declare-const v Video)
(declare-const first Pass)
(declare-const second Pass)
(declare-const z Viewer)
(declare-const now Int)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (not (= first second)))
(assert (passHasVideo first v))
(assert (passHasVideo second v))
(assert (not (rightHeld z first)))
(assert (rightHeld z second))
(assert (= (passCutoff second) 0))
(assert (= (rightUntil z second) 0))
(assert (= (rightMaxViews z second) 0))
(assert (keyIssued v z now))
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
(assert (keyIssued v z now))
(check-sat)
(pop)

;@TEST          Смена режима не сбрасывает нарезку и не трогает секрет
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/collections/Media.test.ts::переключение без перенарезки
(push)
(declare-const s Status)
(declare-const g Int)
(assert (or (not (= (statusAfterToggle s) s)) (not (= (generationAfterToggle g) g))))
(check-sat)
(pop)

;@TEST          Прежние выдачи прекращают действовать только со сменой секрета
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/crypto-period.test.ts::смена секрета
(push)
(declare-const g Int)
(assert (grantValid g (generationAfterRekey g)))
(check-sat)
(pop)

;@TEST          Код срабатывает без учётной записи
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/redeem.test.ts::код срабатывает без учётной записи
(push)
(declare-const c Code)
(declare-const now Int)
(assert (= (codeExpires c) 0))
(assert (= (codeMaxUses c) 0))
(assert (not (codeRevoked c)))
(assert (activates c now))
(check-sat)
(pop)

;@TEST          Отозванный код не срабатывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/redeem.test.ts::отозванный код
(push)
(declare-const c Code)
(declare-const now Int)
(assert (codeRevoked c))
(assert (activates c now))
(check-sat)
(pop)

;@TEST          Просроченный код не срабатывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/redeem.test.ts::просроченный код
(push)
(declare-const c Code)
(declare-const now Int)
(assert (> now 0))
(assert (and (> (codeExpires c) 0) (<= (codeExpires c) now)))
(assert (activates c now))
(check-sat)
(pop)

;@TEST          Исчерпанный предел срабатываний закрывает код
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/redeem.test.ts::исчерпанный лимит
(push)
(declare-const c Code)
(declare-const now Int)
(assert (and (> (codeMaxUses c) 0) (>= (codeUsed c) (codeMaxUses c))))
(assert (activates c now))
(check-sat)
(pop)

;@TEST          Бессрочной ссылки не бывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/collections/MediaAccessLinks.ts::срок обязателен
(push)
(declare-const l Link)
(assert (= (linkExpires l) 0))
(check-sat)
(pop)

;@TEST          Отозванная ссылка не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/redeem-link.test.ts::отозванная ссылка
(push)
(declare-const l Link)
(declare-const now Int)
(assert (linkRevoked l))
(assert (linkUsable l now))
(check-sat)
(pop)

;@TEST          Просроченная ссылка не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/redeem-link.test.ts::просроченная ссылка
(push)
(declare-const l Link)
(declare-const now Int)
(assert (<= (linkExpires l) now))
(assert (linkUsable l now))
(check-sat)
(pop)

;@TEST          Исчерпавшая предел ссылка не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/redeem-link.test.ts::исчерпанный предел
(push)
(declare-const l Link)
(declare-const now Int)
(assert (and (> (linkMaxUses l) 0) (>= (linkUsed l) (linkMaxUses l))))
(assert (linkUsable l now))
(check-sat)
(pop)

;@TEST          Переход по ссылке засчитывает срабатывание
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/accept-link.test.ts::счётчик срабатываний
(push)
(declare-const l Link)
(assert (not (= (usedAfterFollow l) (+ (linkUsed l) 1))))
(check-sat)
(pop)

;@TEST          Активация засчитывает срабатывание
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/activate-code.test.ts::счётчик срабатываний
(push)
(declare-const c Code)
(assert (not (= (usedAfterActivation c) (+ (codeUsed c) 1))))
(check-sat)
(pop)

;@TEST          Повторная активация не укорачивает бессрочное право
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/keep-entitlement.test.ts::бессрочное не укорачивается
(push)
(declare-const c Code)
(assert (not (= (untilAfterActivation 0 c) 0)))
(check-sat)
(pop)

;@TEST          Повторная активация продлевает, но не сокращает срок
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/keep-entitlement.test.ts::продление
(push)
(declare-const c Code)
(declare-const had Int)
(assert (> had 0))
(assert (> (codeGrantUntil c) 0))
(assert (< (untilAfterActivation had c) had))
(check-sat)
(pop)

;@TEST          Взятие ключа внутри окна новым просмотром не считается
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/view-window.test.ts::внутри окна
(push)
(declare-const z Viewer)
(declare-const v Video)
(declare-const now Int)
(assert (> (lastTaken z v) 0))
(assert (<= (- now (lastTaken z v)) viewWindow))
(assert (countsAsView z v now))
(check-sat)
(pop)

;@TEST          Возврат за пределами окна считается новым просмотром
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/view-window.test.ts::за окном
(push)
(declare-const z Viewer)
(declare-const v Video)
(declare-const now Int)
(assert (> (lastTaken z v) 0))
(assert (> (- now (lastTaken z v)) viewWindow))
(assert (countsAsView z v now))
(check-sat)
(pop)

;@TEST          Первое в жизни взятие ключа считается просмотром
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/view-window.test.ts::первое взятие
(push)
(declare-const z Viewer)
(declare-const v Video)
(declare-const now Int)
(assert (= (lastTaken z v) 0))
(assert (countsAsView z v now))
(check-sat)
(pop)

;@TEST          Лимит одновременных просмотров не превышается
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/key-rate.test.ts::лимит просмотров
(push)
(declare-const n Int)
(declare-const lim Int)
(assert (>= n lim))
(assert (admitWithoutEviction n lim))
(check-sat)
(pop)

;@TEST          Вытеснение не поднимает число активных выше лимита
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/key-rate.test.ts::вытеснение
(push)
(declare-const n Int)
(declare-const lim Int)
(assert (>= n 0))
(assert (> lim 0))
(assert (<= n lim))
(assert (> (aliveAfterEviction n lim) lim))
(check-sat)
(pop)

;@TEST          Молчащий дольше порога перестаёт занимать место
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/key-rate.test.ts::протухание
(push)
(declare-const now Int)
(declare-const last Int)
(assert (> (- now last) staleAfter))
(assert (watchAlive now last))
(check-sat)
(pop)

;@TEST          Оригинал не пропадает, пока нарезки нет
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/collections/Media.test.ts::оригинал на месте
(push)
(declare-const v Video)
(assert (not (= (status v) Ready)))
(assert (not (hasOriginal v)))
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
