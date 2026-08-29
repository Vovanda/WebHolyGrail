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
; плейлисты и свои покупатели. Поэтому право — отдельная связь «зритель × плейлист»,
; а не флаг на видео и не свойство плейлиста.
;
; Почему не каскад «закрытый плейлист закрывает свои видео»: тогда платный
; плейлист с бесплатными вводными уроками невозможен — они закрылись бы вместе
; с остальными. Видео сам говорит, нужен ли для него доступ; плейлист говорит,
; чем этот доступ выдаётся.

(declare-sort Playlist 0)
(declare-sort Author 0)

(declare-fun playlistOwner (Playlist) Author)
(declare-fun inPlaylist (Video Playlist) Bool)

; Право зрителя на плейлист. Способ выдачи (код, оплата, рука администратора)
; модели безразличен — важен сам факт.
;
; Источников два, и они не равнозначны по хранению. Купленное право — запись
; в базе за учётной записью: его видно, продлевают и отзывают. Право из
; погашенного кода записи не имеет: оно лежит в токене зрителя и живёт ровно
; столько же, сколько токен. Для доступа разницы нет, поэтому итоговое
; entitled — их объединение.
(declare-fun purchased      (Viewer Playlist) Bool)
(declare-fun grantedInToken (Viewer Playlist) Bool)

(define-fun entitled ((z Viewer) (p Playlist)) Bool
  (or (purchased z p) (grantedInToken z p)))

; Право из токена принадлежит токену, а не человеку: у другого зрителя токен
; другой, и то же самое право в нём не появляется само.
(assert (forall ((a Viewer) (b Viewer) (p Playlist))
  (=> (and (grantedInToken a p) (not (= a b)))
      (or (= (token a) (token b)) (not (grantedInToken b p))))))

; Свой закрытый видео автор смотрит всегда.
;
; Это не поблажка, а рабочая необходимость: перед публикацией нужно убедиться,
; что залит нужный файл, а закрытый видео иначе не откроется даже тому, кто его
; загрузил, - и автор публикует вслепую.
(declare-fun owns (Viewer Video) Bool)

; Роль администратора площадки доступа к чужому закрытому НЕ даёт.
;
; На площадке с несколькими авторами администратор посторонний для чужого
; материала: иначе он молча выкачивает чужие платные подборки. Полностью от него
; это не защищает - ключи от базы у него, - но выдать себе право придётся явно,
; и запись об этом останется.
(declare-fun isAdmin (Viewer) Bool)

; Владение живёт в учётной записи, поэтому автор всегда вошедший.
(assert (forall ((z Viewer) (v Video)) (=> (owns z v) (signedIn z))))

; Купленное право закрепляется за учётной записью: анониму его не за кем
; удержать. Право из кода вход не требует — в этом и смысл промо-доступа.
(assert (forall ((z Viewer) (p Playlist))
  (=> (purchased z p) (signedIn z))))

; Видео нужен доступ. Открытые видео признака не имеют и доступны всем,
; даже находясь в платном плейлисте.
(define-fun needsEntitlement ((v Video)) Bool (= (access v) Private))

; Право на саму запись. Выдаётся, когда запись продаётся отдельно или не лежит
; ни в одной подборке: без него такую запись не открыть ничем, и закрытая
; запись вне подборок становится тем, что нельзя открыть даже за деньги.
(declare-fun purchasedVideo (Viewer Video) Bool)

; Оно тоже закрепляется за учётной записью - по той же причине, что и право
; на подборку: анониму его не за кем удержать.
(assert (forall ((z Viewer) (v Video))
  (=> (purchasedVideo z v) (signedIn z))))

; Итог: закрытая запись открывается правом на неё саму либо правом на любую
; подборку, куда она входит.
;
; Право на подборку перекрывает поштучный замок записи намеренно: серии продают
; и по одной, и оптом, и купивший оптом не должен упираться в те, что кто-то
; когда-то продал отдельно.
;
; Обратное неверно и здесь не выражено: из права на запись право на подборку
; не следует - купил девятую серию, купил девятую серию.
(define-fun mayWatch ((v Video) (z Viewer)) Bool
  (or (not (needsEntitlement v))
      (owns z v)
      (purchasedVideo z v)
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

;@TEST          Открытый видео доступен всем даже в платном плейлисте
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::открытый видео
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

;@TEST          Закрытый видео без права не открывается
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::нет права
(push)
(declare-const v Video)
(declare-const z Viewer)
(assert (needsEntitlement v))
(assert (forall ((p Playlist)) (not (entitled z p))))
; Ни поштучного права: с ним запись открылась бы и без подборок.
(assert (not (purchasedVideo z v)))
; Не автор видео: своё он смотрит независимо от прав.
(assert (not (owns z v)))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Право на плейлист открывает всё закрытое в нём
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::право на плейлист
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

;@TEST          Право на саму запись открывает её вне всяких подборок
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::право на саму запись
(push)
(declare-const v Video)
(declare-const z Viewer)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
; Запись не лежит ни в одной подборке: раньше такую нельзя было открыть ничем.
(assert (forall ((p Playlist)) (not (inPlaylist v p))))
(assert (purchasedVideo z v))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Право на одну запись не открывает соседнюю в той же подборке
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::поштучное право не растекается
(push)
(declare-const bought Video)
(declare-const other Video)
(declare-const p Playlist)
(declare-const z Viewer)
(assert (not (= bought other)))
(assert (needsEntitlement other))
(assert (inPlaylist bought p))
(assert (inPlaylist other p))
; Куплена одна запись, права на подборку нет.
(assert (purchasedVideo z bought))
(assert (not (purchasedVideo z other)))
(assert (forall ((q Playlist)) (not (entitled z q))))
(assert (not (owns z other)))
(assert (envelopeIssuedWithEntitlements other z))
(check-sat)
(pop)

;@TEST          Код открывает закрытый видео без учётной записи
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::код открывает закрытый видео без входа
(push)
(declare-const v Video)
(declare-const p Playlist)
(declare-const z Viewer)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (inPlaylist v p))
(assert (not (signedIn z)))
(assert (grantedInToken z p))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Право из кода не достаётся другому зрителю
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::чужой токен не открывает
(push)
(declare-const v Video)
(declare-const p Playlist)
(declare-const first Viewer)
(declare-const second Viewer)
(assert (needsEntitlement v))
(assert (inPlaylist v p))
(assert (not (= first second)))
(assert (grantedInToken first p))
; У второго зрителя нет ни покупки, ни своего погашенного кода на этот плейлист,
; и права первого он не наследует.
(assert (forall ((q Playlist)) (not (purchased second q))))
; Ни в одном плейлисте с этим уроком у второго зрителя своего кода нет: иначе
; отказ не про наследование права, а про другой плейлист.
(assert (forall ((q Playlist)) (=> (inPlaylist v q) (not (grantedInToken second q)))))
; Второй зритель посторонний: видео не его.
(assert (not (owns second v)))
; И поштучного права у него нет: с ним отказ был бы не про наследование.
(assert (not (purchasedVideo second v)))
(assert (envelopeIssuedWithEntitlements v second))
(check-sat)
(pop)

;@TEST          Администратор площадки чужое закрытое не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::администратор не смотрит чужое
(push)
(declare-const v Video)
(declare-const z Viewer)
(assert (needsEntitlement v))
(assert (isAdmin z))
(assert (not (owns z v)))
; Роль сама по себе прав не даёт - ни на подборку, ни на запись.
(assert (not (purchasedVideo z v)))
(assert (forall ((p Playlist)) (not (purchased z p))))
(assert (forall ((q Playlist)) (=> (inPlaylist v q) (not (grantedInToken z q)))))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Владелец смотрит свой закрытый видео без всякого права
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::владелец смотрит своё
(push)
(declare-const v Video)
(declare-const z Viewer)
(assert (= (status v) Ready))
(assert (needsEntitlement v))
(assert (owns z v))
(assert (forall ((p Playlist)) (not (purchased z p))))
(assert (forall ((p Playlist)) (not (grantedInToken z p))))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Чужой закрытый видео владение своим не открывает
;@EXPECT        unsat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::чужое владение не открывает
(push)
(declare-const mine Video)
(declare-const other Video)
(declare-const z Viewer)
(assert (needsEntitlement other))
(assert (not (= mine other)))
(assert (owns z mine))
(assert (not (owns z other)))
; Чужую запись он не покупал: иначе отказ был бы не про владение.
(assert (not (purchasedVideo z other)))
(assert (forall ((p Playlist)) (not (purchased z p))))
(assert (forall ((q Playlist)) (=> (inPlaylist other q) (not (grantedInToken z q)))))
(assert (envelopeIssuedWithEntitlements other z))
(check-sat)
(pop)

;@TEST          Право на чужой плейлист не открывает видео
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
; Зритель посторонний: своё он смотрел бы и без права.
(assert (not (owns z v)))
; И записи поштучно не покупал: речь про право на другую подборку.
(assert (not (purchasedVideo z v)))
(assert (envelopeIssuedWithEntitlements v z))
(check-sat)
(pop)

;@TEST          Видео в двух плейлистах открывается правом на любой из них
;@EXPECT        sat
;@COVERED-BY    src/cms/src/lib/video/entitlements.test.ts::видео в двух плейлистах
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

;@TEST          Плейлисты разных продавцов не смешиваются
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
