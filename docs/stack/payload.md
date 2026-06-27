# Payload CMS

> Headless CMS на Node 20 + TypeScript. Schema-as-code (collections / globals / blocks), генерирует REST + GraphQL + admin UI из одного `payload.config.ts`. MIT licensed, self-host (no Cloud lock-in).
>
> В Holy Grail — единственный CMS-движок. Через Payload менеджер сайта (R0) меняет любой контент. Через Local API я (Claude) делаю seed / миграции / job'ы прямо из Node-процесса.

## Текущие версии

| Компонент                      | Версия       | Где tracking                |
| ------------------------------ | ------------ | --------------------------- |
| `payload` (core)               | `^3.40.0`    | в `src/cms/package.json`    |
| `@payloadcms/next`             | matches core | в `src/cms/package.json`    |
| `@payloadcms/db-sqlite`        | matches core | основной для нас            |
| `@payloadcms/db-postgres`      | matches core | когда переходим на Postgres |
| `@payloadcms/richtext-lexical` | matches core | rich text editor            |
| `@payloadcms/storage-s3`       | matches core | media → S3/MinIO            |
| `@payloadcms/translations`     | matches core | i18n                        |

Все Payload пакеты — **одна major-version line**, апдейтятся вместе через `pnpm up "@payloadcms/*"`.

Релизы tracking:

- [GitHub releases](https://github.com/payloadcms/payload/releases) — все пакеты публикуются вместе
- [Changelog](https://github.com/payloadcms/payload/blob/main/CHANGELOG.md)
- [Roadmap](https://github.com/payloadcms/payload/discussions/categories/roadmap)

## Что мы используем (3.x специфика)

- **Next 15 integration** — Payload 3 = Next-native, admin живёт в `src/cms/app/(payload)/admin/`, REST в `app/(payload)/api/`. Одно Next-приложение для CMS.
- **Lexical rich text editor** — заменил Slate в 3.x. Современный, JSON-сериализуемый, расширяемый.
- **SQLite adapter** (`@payloadcms/db-sqlite` через better-sqlite3) — по дефолту. Для визиток / лендингов / блогов хватает. Переход на Postgres через смену одного импорта.
- **Drizzle ORM** под капотом — Payload 3 переехал на Drizzle с предыдущего MikroORM. Миграции через `payload migrate` + `payload migrate:create`.
- **Jobs Queue** — новая фича 3.x. Native фоновые задачи (вместо отдельного hangfire-аналога) с админ-кнопкой "Run", retries, cron-расписанием. См. skill `payload-jobs`.
- **Local API** — `payload.create({collection, data})`, `payload.find({collection, where})`, `payload.update()` etc. Типобезопасно, выполняется в том же процессе что и сервер. Используется в seed-скриптах, jobs, hooks.
- **importMap** — для custom React-компонентов в админке. `baseDir` в config'е → пути в полях `/admin/components/<File>#default`.

## Что мы НЕ используем

- **Payload Cloud** — vendor lock-in недопустим. Self-host везде, тот же codebase.
- **Slate editor** — deprecated в 3.x, мигрировали на Lexical.
- **MongoDB adapter** — Drizzle через MongoDB существует, но мы реляционные (SQLite/Postgres).
- **Plugin marketplace** — пользуемся только официальными `@payloadcms/*` пакетами, без third-party plugins (R7 — нулевая стартовая нагрузка).
- **MCP server** — community-overhead без пользы. Local API + REST + admin UI покрывают всё что мне нужно.

## Установка / запуск

В Holy Grail — Payload как workspace package (`src/cms/`), не отдельная инсталляция:

```bash
# В корне репо:
pnpm install                              # резолвит @payloadcms/*
pnpm --filter cms dev                     # Next-dev для CMS на :3001
# или через root:
./dev.sh                                  # стартует cms + client вместе с Infisical
```

Прод — docker контейнер `src/cms/Dockerfile`, отдельный от client'а.

## AI Skills (для агента)

Существуют **два официальных источника skills от Payload** + **наши локальные**:

### 1. `payloadcms/skills` repo (GitHub-based, не npm)

| Skill           | Что покрывает                                                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `payload`       | Общий workflow — collections, fields, hooks, access control, queries, adapters, jobs queue, custom endpoints, localization, plugins |
| `cms-migration` | Interactive workflows для миграции **FROM** внешних CMSes — WordPress, Contentful, Strapi, Sanity, Webflow                          |

Установка:

```bash
# Universal CLI (пуллит из GitHub):
npx skills add payloadcms/skills

# Manual:
git clone https://github.com/payloadcms/skills /tmp/payload-skills
cp -r /tmp/payload-skills/skills/payload .claude/skills/
```

### 2. `payloadcms/payload` monorepo plugin (`tools/claude-plugin/`)

Тот же `payload` skill + детализированные reference-документы в `skills/payload/reference/`:

- `FIELDS.md`, `COLLECTIONS.md`, `HOOKS.md`
- `ACCESS-CONTROL.md`, `ACCESS-CONTROL-ADVANCED.md`
- `QUERIES.md`, `ADAPTERS.md`, `ADVANCED.md`

Установка:

```bash
/plugin install github:payloadcms/payload
```

Активируется автоматически когда работаешь с `payload.config.ts` или files в Payload-структуре. Явный вызов через `@payload` в чате.

### 3. Наши локальные skills (`.claude/skills/` в этом репо)

Holy Grail-flavored — учитывают **R-правила, contracts/ seam, blue-green deploy.sh, наши patterns**. Дополняют официальные, не дублируют.

| Skill               | Когда триггерить                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `payload` (наш)     | Любая работа с Payload в **Holy Grail контексте** — collections, fields, hooks с учётом R3 (contracts seam), R0 (контент в БД), наших access patterns |
| `payload-jobs`      | Создаёшь фоновую задачу через Jobs Queue 3.x — c учётом нашей структуры jobs/ и Holy Grail deploy lifecycle                                           |
| `payload-migration` | Меняешь блок/коллекцию/global — точный workflow миграции SQLite **с интеграцией в `deploy.sh` blue-green** (миграция применяется до nginx switch)     |

**Рекомендация:** установить **#1 + #2** официальные для широкого knowledge, наши локальные #3 — для project-specific patterns. Все три уровня вместе дают полное покрытие.

## llms-full.txt

Payload предоставляет AI-friendly version всей документации на [`https://payloadcms.com/llms-full.txt`](https://payloadcms.com/llms-full.txt). Можно загрузить в context через WebFetch когда нужно глубокое погружение в конкретную фичу.

## Local API я касаюсь в

| Где                                    | Что                                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/cms/src/seed/<task>.ts`           | Seed-скрипты — initial admin, sample pages, fixtures. Запуск через `pnpm exec tsx src/cms/src/seed/<task>.ts` |
| `src/cms/src/jobs/<task>.ts`           | Payload Jobs (3.x feature) — фоновые задачи (синхронизация, импорт)                                           |
| `src/cms/src/lib/<helper>.ts`          | Утилиты вокруг Local API — типизированные обёртки, batch операции                                             |
| `src/cms/src/collections/<X>.ts` hooks | `beforeChange`, `afterChange`, `beforeRead` — встроенные hooks внутри коллекций                               |

REST API (`src/client` → `src/cms`) — через `src/client/src/lib/api-client.ts` (server-side fetch). См. R3.

## Миграции

Workflow — `.claude/skills/payload-migration/SKILL.md`. Кратко:

```bash
# 1. Меняешь src/cms/src/collections/<X>.ts (поле, тип, default)
# 2. Генеришь миграцию:
pnpm --filter cms exec payload migrate:create <name>
# 3. Просматриваешь generated TS-миграцию, при необходимости правишь SQL
# 4. Применяешь:
pnpm --filter cms exec payload migrate
# или auto на старте deploy.sh (см. deploy.sh '→ Applying migrations')
```

**Идемпотентность** — `payload migrate` пропускает уже применённые. Безопасно гнать на каждом deploy.

## Когда апдейтить

| Что                            | Когда                                                              |
| ------------------------------ | ------------------------------------------------------------------ |
| `@payloadcms/*` minor / patch  | через `pnpm up "@payloadcms/*"` continuously                       |
| `@payloadcms/*` major          | quarterly — читаем migration guide, smoke в dev ветке, потом merge |
| AI skills `@payloadcms/skills` | `npx @payloadcms/skills add` периодически (новые skills)           |

При major upgrade Payload (например 3.x → 4.x):

- Backup БД обязательно
- Migration guide в [docs/migration](https://payloadcms.com/docs)
- Тестим в ветке `chore/payload-major-N` через `./dev.sh`
- После теста — обновляем `40-versions.md` и `sync-template.sh` в WHG

## Известные ограничения и watch list

- **SQLite single-writer** — concurrent write throughput ограничен (~1000 ops/sec). Когда упрёмся — Postgres swap (один импорт).
- **Drizzle переход** в 3.x был breaking — старые MikroORM миграции не работают (только relevant если переезжаем с 2.x site).
- **Lexical schema** — JSON структура rich text. При изменении конфига editor'а старые записи могут потерять блоки. Тестим миграции editor changes.
- **Admin UI bundle** — генерится при старте, занимает ~30-60 сек первый раз. Norm. Если >2 минут — посмотри логи.
- **`importMap`** для custom admin компонентов — кэшируется, при добавлении нового нужно перегенерировать (`payload generate:importmap`).
- **i18n fallback** — `fallbackLanguage: 'ru'` в нашей конфигурации. Если поле не локализовано — fallback'нет.

## Skills из репо WHG (наши, для агента)

В корне инстанса `.claude/skills/`:

| Skill               | Когда триггерить                                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `payload`           | Любая работа с Payload — collections, fields, hooks, access control, REST queries, transactions, debugging validation/permission errors |
| `payload-jobs`      | Создаёшь фоновую задачу (sync, импорт, periodic check, генерация отчёта) — Jobs Queue 1:1 без велосипеда                                |
| `payload-migration` | Меняешь блок/коллекцию/global — точный workflow миграции SQLite без потери данных                                                       |

## Ссылки

- [Сайт](https://payloadcms.com/)
- [Docs](https://payloadcms.com/docs)
- [REST API reference](https://payloadcms.com/docs/rest-api/overview)
- [Local API reference](https://payloadcms.com/docs/local-api/overview)
- [GitHub: payload monorepo](https://github.com/payloadcms/payload)
- [GitHub: skills standalone repo](https://github.com/payloadcms/skills) — 2 skills, install через `npx skills add payloadcms/skills`
- [GitHub: monorepo claude-plugin](https://github.com/payloadcms/payload/tree/main/tools/claude-plugin) — тот же `payload` skill + reference/ детализация
- [Discord community](https://discord.com/invite/payload)
- [`llms-full.txt` для AI context](https://payloadcms.com/llms-full.txt) — полные docs одним файлом, можно загрузить через WebFetch

## Связанные

- [`45-data-location.md`](../whg/45-data-location.md) — что хранится в Payload vs Infisical
- `.claude/skills/payload/SKILL.md` — workflow для меня
- `.claude/skills/payload-jobs/SKILL.md`
- `.claude/skills/payload-migration/SKILL.md`
- [`docs/whg/32-structure.md`](../whg/32-structure.md) — где Payload в монорепо
- [`docs/whg/40-versions.md`](../whg/40-versions.md) — версии стека + upgrade policy
