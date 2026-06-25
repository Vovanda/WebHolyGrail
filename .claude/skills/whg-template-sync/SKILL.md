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

## Stop-conditions (зову instance admin)

- **Sync ломает critical-path в proд-инстансе** (после sync prod не стартует). Откатить через `git reset --hard HEAD~1` в feature-ветке (sync делался не в main — это и есть зачем feature-ветка).
- **rsync падает на permission denied** или `.git` corrupt — не «починить наугад», посмотреть state.
- **Архитектурное решение перейти на npm-пакеты** — крупная развилка, требует instance admin.

## Связанные

- `scripts/sync-template.sh` — реализация.
- `.template-version` — version marker в инстансе.
- `whg-rules` — R3 (contracts seam), R5 (block = чистая функция), R9 (abstraction follows experience) — почему именно whitelist именно такой.
- `whg-infisical` — секреты не в этом sync'е, они в Infisical Cloud (workspaceId в `.infisical.json` — НЕ перетирается sync'ом).
