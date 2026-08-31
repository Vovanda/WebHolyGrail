---
name: whg-template-sync
description: Workflow обновления Holy Grail инстансов (<slug>-site / <slug-b> / ...) из upstream template (WebHolyGrail) через `scripts/sync-template.sh`. Whitelist-based rsync только generic-частей (primitives/layout/decor/system/ui, layouts/, lib generic, contracts generic, deploy, .claude/skills/holygrail-*), domain-папки (blocks/domain/, src/cms/src/collections/<domain>, app/(site)/<domain-routes>) **не трогает**. Поддерживает выбор source-ветки (--ref main/develop/sha/tag) и удалённого репо (--repo). Триггерить когда: правится template-уровневый код в WHG → нужно зеркалить в инстансы; новый PR в инстанс с template-syncом; устанавливаешь свежую версию template на pinned tag.
---

# Skill: whg-template-sync

> Обновление дочерних инстансов Holy Grail из upstream template — без npm-либ. Пока (1-3 инстанса) — rsync white-list; после 3+ инстансов переезжаем на `@holygrail/*` npm-пакеты.

## Когда триггерить

- В **WHG (template)** прошёл коммит с правкой generic-кода (новый primitive, fix Carousel, новый layout-preset, апдейт payload-config skeleton). Нужно дотянуть до инстансов.
- Создал свежий инстанс — хочешь подтянуть последний WHG как baseline.
- Инстансу нужен specific tag/PR template'а — например `v0.2.0` или `pr/42`.
- Появилось расхождение между инстансом и template (дрифт), хочешь привести к общему знаменателю.
- Дебажишь странность типа «в WHG fix есть, в <slug> нет» — sync приведёт к общему состоянию.

## Когда НЕ триггерить

- Когда правка domain-only (в `blocks/domain/<niche>/` или domain collections) — sync её не тронет (она в blacklist'е), а WHG её не содержит.
- Когда правка только в **одном** инстансе и не должна идти в template — не идёт в template, и sync её не вернёт назад. Это **upstream→downstream** только. Обратный путь (instance→WHG) — manual cherry-pick или PR.

## Workflow

```bash
# В инстансе (например <slug>-site/):
cd ../<slug>-site
git checkout -b chore/sync-template-$(date +%Y%m%d)

# Запуск sync (из WHG):
../WebHolyGrail/scripts/sync-template.sh . --ref main

# Что произошло:
#   - rsync generic-whitelist из WHG → инстанс
#   - .template-version в инстансе обновлён до текущего WHG SHA
#   - blocks/domain/, app/(site)/<domain>/, migrations/, site.config.ts — НЕ тронуты

# Проверка:
git status
git diff --stat                          # масштаб
pnpm install                              # peer-deps drift
pnpm -r exec tsc --noEmit                # typecheck smoke
pnpm dev                                  # runtime smoke

# Если ок:
git add -A
git commit -m "chore(sync): pull template main (<sha>)"
git push -u origin chore/sync-template-...
gh pr create --title "Sync template main → <sha>" --body "..."
# Merge → checkout main → pull → smoke снова
```

## Параметры скрипта

| Флаг              | Default       | Зачем                                                                                                                                                      |
| ----------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `<instance-path>` | required      | Куда rsync'аем (root инстанса)                                                                                                                             |
| `--ref`           | `main`        | Source-ветка/тег/sha в template. `develop` для preview изменений до релиза. `tag/v0.2.0` для pinned. `pr/42` для пробного PR. `<sha>` для точной фиксации. |
| `--repo`          | local sibling | Path к локальному clone WHG или GitHub `owner/name` / URL. Если не передан — берёт `..` от skill                                                           |
| `--dry-run`       | `false`       | rsync --dry-run, ничего не пишет, только показывает что будет                                                                                              |

## Whitelist (что копируется из WHG → инстанс)

**Client:**

- `src/client/src/ui/` (shadcn-атомы)
- `src/client/src/blocks/{primitives,layout,decor,system}/`
- `src/client/src/layouts/`
- `src/client/src/lib/{api-client,utils,seo,analytics,theme-bootstrap,lexical-text}.ts`/`*/`
- `src/client/src/styles/`

**CMS:**

- `src/cms/src/blocks/` (Hero/Quote/Timeline/etc Payload-блок-defs)
- `src/cms/src/collections/{Pages,Media,Users,FormSubmissions,ReusableBlocks,Posts,Comments,FaqGroups}.ts`
- `src/cms/src/globals/SiteSettings.ts`

**Contracts:** generic only — `blocks/faq/forms/globals/layout/media/notices/pages/reusable/social/theme.ts`

**Deploy + skills:**

- `deploy/` (local + prod)
- `.claude/skills/holygrail-*`, `payload*`
- `dev.sh`, `dev-setup.sh` (Infisical-aware)

## Blacklist (что инстанс ВЛАДЕЕТ, sync не трогает)

- `src/client/src/blocks/domain/<niche>/` — все доменные блоки
- `src/client/src/app/(site)/<domain-routes>/` — domain pages (например `/dog/[slug]`, `/catalog`)
- `src/client/src/app/internal/<domain>/` — domain internal API proxies
- `src/cms/src/collections/<Domain>.ts` (Dogs, Litters, Patients, Vehicles, …)
- `src/cms/src/blocks/<DomainBlock>.ts`
- `src/cms/migrations/` — domain-зависимы, инстанс владеет
- `contracts/src/<domain>.ts` (dogs, litters, pedigree, rkf — domain types)
- `contracts/src/index.ts` — **merge-zone** (не overwrite — там может быть domain reexports)
- `src/cms/src/payload.config.ts` — **merge-zone** (инстанс добавляет domain collections поверх generic)
- `.claude/skills/<site>-*` (например <slug>-context, <slug>-migration)
- `site.config.ts`, `.env*`, `.infisical.json`

## Общий файл, в который дописывает сайт, - разъём

Файл, где движок даёт своё, а сайт добавляет доменное, не может ездить целиком:
обновление уносит дописанное вместе с работающими страницами. Такой файл
разводится на два.

- `<имя>.engine.<ext>` - набор движка. Ездит, всегда полон.
- `<имя>.<ext>` - точка сборки сайта. Зона `skip`, синк её не трогает.

Так уже разведены наборы блоков (`blocks/engine.ts` и `blocks/index.ts`),
реестр блоков клиента (`block-registry.engine.tsx` и `block-registry.tsx`),
обращения к CMS (`api-client.engine.ts` и `api-client.ts`).

Признак, что разъём нужен: после прогона у сайта пропали функции, импорты
или регистрации, которых в шаблоне нет и быть не может. Чинить надо разъёмом
в шаблоне, а не возвратом файла из истории на одном сайте - иначе то же самое
повторится у остальных.

Поймано 31.08.2026 на veo55: прогон 28.08 заменил `api-client.ts` шаблонным,
и одиннадцать доменных запросов сайта исчезли - тридцать девять ошибок типов,
сборка встала.

## Файл, который синк не возит

Помечается в шапке:

```
/* ***************************************************************
 *  @sync-skip - файл остаётся у себя, синк не возит его по сайтам.
 *
 *  Причина: <одной строкой, почему чужому сайту это не нужно>
 *************************************************************** */
```

Сам маркер - короткая строка `@sync-skip`, по ней ищет и разметка, и человек
грепом. Рамка вокруг - чтобы её не пролистали в файле на тысячу строк схемы.

Пометка главнее правил по пути и работает в любом файле, а не только в
миграции. Снимок `.json` уезжает вслед за своей миграцией сам: комментарий
в него не вписать, а расходиться с ней он не должен.

Второй способ - суффикс в имени: `20260901_120000_showcase.sync-skip.ts`.
Он нагляднее в списке файлов, но применённой миграции не подходит: её имя
записано в `payload_migrations` каждой базы, и переименование заставит
прогнать её заново. Для таких - только пометка в шапке.

Так помечается всё, что чужому сайту не нужно: таблицы блоков из `domain`,
разовая починка данных, схема собственной коллекции. Без пометки сайт получает
чужую пустую таблицу, и сверка схемы после каждого прогона отвечает
расхождением там, где всё на месте.

Пометка работает в обе стороны. Файл перестаёт ездить к новым сайтам, а у тех,
кто уже его получил, он удаляется при ближайшем прогоне - но только если копия
не менялась: отпечаток из перечня совпал, значит своего в ней ничего нет.
Правленную копию синк оставляет и говорит о ней.

Поэтому же пометка - способ убрать свой файл со всех сайтов разом: нашли дыру
в нём, пометили, прогнали синк.

## Конфликты

Возможны когда:

1. **Инстанс локально доработал generic-файл** (например в `lib/utils.ts` добавил domain-helper). Sync его перетрёт.
   - **Симптом:** в git diff после sync пропали локальные функции.
   - **Что делать:** локальные правки в generic — **код-smell**. Либо в WHG как upstream PR, либо переехать в `domain/<niche>/lib/`. Если ушёл upstream — следующий sync уже подхватит.

2. **payload.config.ts расходится.** Sync его НЕ трогает — но инстанс ожидает что в нём есть generic + domain collections. Если в WHG добавили generic collection (например `Tags`), инстансу надо **вручную добавить** её в свой payload.config.
   - Файл `.template-version` помогает: смотришь diff WHG между prev_sha → current_sha по `src/cms/src/payload.config.ts` и переносишь руками.

3. **contracts/src/index.ts расходится.** Аналогично — merge-zone. Sync не трогает, инстанс добавляет domain reexports поверх. Новые generic exports — вручную.

4. **peer-deps drift.** Sync переносит package.json у `src/cms`/`src/client`/`contracts` (потому что это часть whitelist'а через rsync директорий) → версии React/Next/Payload могут поменяться. `pnpm install` после sync обязателен.
   - **Симптом:** TS errors на новых типах после sync.
   - **Что делать:** проверить `package.json` diff, locked-version в `.template-version` указывает на какой версии template ехали.

## `.template-version` в инстансе

После каждого sync в инстансе пишется:

```
# Holy Grail template sync marker.
source_sha=fe7dcde
source_ref=main
synced_at=2026-06-25T17:42:13Z
previous_sha=8c873d7
```

Использовать:

- Узнать на какой версии WHG едет инстанс — `cat .template-version`.
- Посмотреть что изменилось в template с последнего sync — `git -C ../WebHolyGrail log $(grep previous_sha .template-version | cut -d= -f2)..main --oneline`.
- В CI — алерт если sync не делали >30 дней (technical drift).

Этот файл коммитится в инстанс. В WHG не существует.

## Стратегия веток в WHG

- **`main`** — стабильный, после ревью. Default для production-инстансов.
- **`develop`** — собираются изменения, preview. Для adventurous инстансов (<slug-b> возможно).
- **(опционально) `nightly`** — auto-rebase develop по cron с тестами.
- **tags `v0.1.0, v0.2.0`** — pinned релизы. Инстанс пинится `--ref tag/v0.2.0` если хочет стабильности и не хочет автомат-апгрейдов.

## Эволюция

**Сейчас (1-3 инстанса):** rsync white-list. Простой, прозрачный, debug-friendly. Минус — изменения **тиражируются переписыванием файлов**, не через npm dependencies.

**После 3+ инстансов:** выделяем `@holygrail/ui`, `@holygrail/blocks`, `@holygrail/contracts`, `@holygrail/deploy` npm-пакеты. Инстанс делает `pnpm add @holygrail/blocks@^1.2.0`. Sync = `pnpm up`. Преимущество — peer-deps управляются semver, breaking changes явные через major version. Минус — overhead release-процесса на template-стороне (changeset / version / publish).

**Триггер для перехода:** когда rsync конфликтит regularly (>3 раза за месяц на >1 инстанс) или когда хочется одновременно поддерживать v1.0 (legacy инстансы) и v2.0 (новые).

## Версии и ветки: не путаться

Правила короткие, нарушение любого сразу путает картину.

1. **Источник чист и отправлен.** Обновление тянет из шаблона, поэтому в нём не должно
   быть незакоммиченного, а `main` должен быть отправлен. Иначе на сайт уезжает то,
   чего не видел ни прогон проверок, ни рабочий сайт.
2. **Круг идёт в своей ветке сайта**, названной по отпечатку шаблона: `sync/whg-<sha>`.
   По имени видно, откуда взято, и это же значение ложится в маркер `.template-version`.
3. **В `main` сайта прогон не делают.** Слияние - последний шаг круга, после чистых
   проверок и осмотра.
4. **Шаблон ушёл вперёд, пока шёл круг** - круг повторяется на новой версии в новой
   ветке. Сливать ветку, снятую с устаревшего отпечатка, значит выкладывать вчерашнее.
5. **Маркер - источник правды.** `.template-version` в сайте говорит, на чём он стоит;
   сверяться с ним, а не с памятью.

Скрипт помогает: печатает отпечаток источника в начале и отказывается работать, если
в шаблоне есть незакоммиченное или он не отправлен.

## Порядок круга

Прогон - не одно действие, а круг: синк → разбор → правка **в шаблоне** → синк заново тем же
сайтом. Пока круг не чист, следующий сайт не берут: та же засада вылезет и там.

```bash
# 1. точка отсчёта: дерево чистое, проверки ДО прогона
git -C <site> status --porcelain && (cd <site> && pnpm -r lint)
git -C <site> checkout -b sync/whg-<sha>

# 2. прогон
node scripts/sync-template.mjs <site>

# 3. после прогона - обязательно в этом порядке
cd <site>
pnpm install                       # приехавший код тянет новые зависимости
pnpm --filter cms generate:types   # типы Payload собираются из сборки админки
pnpm -r lint && pnpm -r test
PAYLOAD_SECRET=dummy DATABASE_URI=file:/tmp/c.db S3_BUCKET=d S3_REGION=us-east-1   S3_ENDPOINT=https://invalid.local S3_ACCESS_KEY_ID=d S3_SECRET_ACCESS_KEY=d   pnpm --filter cms run check:schema

# 4. глазами: поднять стенд на своих портах
CLIENT_PORT=4010 CMS_PORT=4011 ./dev.sh
```

Три шага после прогона неочевидны и каждый раз стоили круга: без установки падают типы
на «нет такого модуля», без генерации типов - на коллекциях, которых «не существует»,
а проверка схемы поднимает Payload и требует секрет.

Ход круга пишется в `docs/sync-journal.md`: симптом, причина, решение. Гладкий прогон
записывается так же - по нему видно, что путь пройден, а не пропущен.

## Миграции: движка едут все, свои - только под своё

Шаблон не сайт и бизнес-логики не несёт, поэтому каждая его миграция улучшает шаблон
целиком и едет всем. Наложением: доменные миграции сайта остаются на месте. Индекс
не возится - синк пересобирает его по фактическому составу каталога.

**Сайт не генерирует миграций под блоки шаблона.** Структура приезжает готовой; свои
миграции - только под свои коллекции. Нарушение этого и породило все столкновения,
которые мы разбирали: сайт сгенерировал себе миграцию под блок, которого тогда ещё
не было в шаблоне, позже шаблон завёл свою - и в каталоге оказались две записи об одном.
Движок сверяет применённое по именам файлов, вторую считает новой и падает
на «таблица уже существует».

Синк проверяет это перед прогоном: ищет таблицу, создаваемую дважды, и колонку,
добавляемую дважды, называет оба файла и останавливается. В базу он не лезет и ничего
не генерирует - разбирает человек.

Разбор простой: сверить, покрывает ли миграция шаблона операции своей целиком. Покрывает -
свою убрать. На живой базе, где обе уже применены, приехавшую пометить применённой.

## Наборы движка: почему не ездят точки сборки

Пять мест собирают всё вместе - контракты, сборка админки, список блоков админки, реестр
блоков клиента, задания. Каждое разведено на набор движка (ездит) и точку сборки (сайту).

Иначе выходит одно из двух: точка у сайта отстаёт - общее приезжает файлом, а строки в
сборке нет, и типы падают; либо точка ездит зеркалом и затирает доменное сайта (R10).

Проверять при правке шаблона: добавил общую коллекцию, блок или задание - клади в набор,
а не в точку сборки.

## Удаление из шаблона = удаление из всех сайтов

Зеркало (`MIRROR`) удаляет в инстансе то, чего нет в шаблоне. Значит выпиливание
примитива, блока или хелпера в WHG — это выпиливание его из пяти сайтов сразу,
и сборка там падает на первом импорте.

Перед удалением:

```bash
# кто ссылается — проверять в инстансах, не в шаблоне
for d in <instance-dirs>; do grep -rln "<ИмяКомпонента>" "$d/src" --include=*.tsx; done
```

Есть ссылки — не удалять: пометить `@deprecated` с заменой, перевести сайты, удалить
потом (R10).

## Stop-conditions (зову instance admin)

- **Sync ломает critical-path в proд-инстансе** (после sync prod не стартует). Откатить через `git reset --hard HEAD~1` в feature-ветке (sync делался не в main — это и есть зачем feature-ветка).
- **rsync падает на permission denied** или `.git` corrupt — не «починить наугад», посмотреть state.
- **Архитектурное решение перейти на npm-пакеты** — крупная развилка, требует instance admin.

## Связанные

- `scripts/sync-template.sh` — реализация.
- `.template-version` — version marker в инстансе.
- `whg-rules` — R3 (contracts seam), R5 (block = чистая функция), R9 (abstraction follows experience) — почему именно whitelist именно такой.
- `whg-infisical` — секреты не в этом sync'е, они в Infisical Cloud (workspaceId в `.infisical.json` — НЕ перетирается sync'ом).
