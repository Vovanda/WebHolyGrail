# Payload CMS

> Headless CMS на Node 20 + TypeScript. Schema-as-code (collections / globals / blocks), генерирует REST + GraphQL + admin UI из одного `payload.config.ts`. MIT licensed, self-host (no Cloud lock-in).
>
> В Holy Grail — единственный CMS-движок. Через Payload менеджер сайта (R0) меняет любой контент. Через Local API я (Claude) делаю seed / миграции / job'ы прямо из Node-процесса.

## Текущие версии

| Компонент | Версия | Где tracking |
|---|---|---|
| `payload` (core) | `^3.40.0` | в `src/cms/package.json` |
| `@payloadcms/next` | matches core | в `src/cms/package.json` |
| `@payloadcms/db-sqlite` | matches core | основной для нас |
| `@payloadcms/db-postgres` | matches core | когда переходим на Postgres |
| `@payloadcms/richtext-lexical` | matches core | rich text editor |
| `@payloadcms/storage-s3` | matches core | media → S3/MinIO |
| `@payloadcms/translations` | matches core | i18n |

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

## AI Skills repo (для агента)

`@payloadcms/agentic-skills` — официальные skills от Payload для Claude/Cursor/Continue. Поставляется через `@payloadcms/skills` npm package.

Установка:
```bash
npx @payloadcms/skills add                # интерактивный wizard выбора нужных skills
# или конкретно:
npx @payloadcms/skills add payload-collections
```

После установки skills попадают в `~/.claude/skills/` (для Claude Code) или соответствующую папку другого AI-агента.

Tracking releases:
- [GitHub releases](https://github.com/payloadcms/payload/releases) — skills публикуются вместе с core
- [Payload docs](https://payloadcms.com/docs) — где описаны новые skills

В нашем репо `.claude/skills/` уже есть:
- `payload/SKILL.md` — общий workflow с Payload (config, collections, fields, hooks)
- `payload-jobs/SKILL.md` — Jobs Queue 3.x (фоновые задачи)
- `payload-migration/SKILL.md` — миграции SQLite без потери данных

Эти три — наши (написанные под Holy Grail), а не из `@payloadcms/skills`. Обновляем по мере находок (см. PLAN).

## Local API я касаюсь в

| Где | Что |
|---|---|
| `src/cms/src/seed/<task>.ts` | Seed-скрипты — initial admin, sample pages, fixtures. Запуск через `pnpm exec tsx src/cms/src/seed/<task>.ts` |
| `src/cms/src/jobs/<task>.ts` | Payload Jobs (3.x feature) — фоновые задачи (синхронизация, импорт) |
| `src/cms/src/lib/<helper>.ts` | Утилиты вокруг Local API — типизированные обёртки, batch операции |
| `src/cms/src/collections/<X>.ts` hooks | `beforeChange`, `afterChange`, `beforeRead` — встроенные hooks внутри коллекций |

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

| Что | Когда |
|---|---|
| `@payloadcms/*` minor / patch | через `pnpm up "@payloadcms/*"` continuously |
| `@payloadcms/*` major | quarterly — читаем migration guide, smoke в dev ветке, потом merge |
| AI skills `@payloadcms/skills` | `npx @payloadcms/skills add` периодически (новые skills) |

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

| Skill | Когда триггерить |
|---|---|
| `payload` | Любая работа с Payload — collections, fields, hooks, access control, REST queries, transactions, debugging validation/permission errors |
| `payload-jobs` | Создаёшь фоновую задачу (sync, импорт, periodic check, генерация отчёта) — Jobs Queue 1:1 без велосипеда |
| `payload-migration` | Меняешь блок/коллекцию/global — точный workflow миграции SQLite без потери данных |

## Ссылки

- [Сайт](https://payloadcms.com/)
- [Docs](https://payloadcms.com/docs)
- [REST API reference](https://payloadcms.com/docs/rest-api/overview)
- [Local API reference](https://payloadcms.com/docs/local-api/overview)
- [GitHub: payload](https://github.com/payloadcms/payload)
- [GitHub: skills (`@payloadcms/skills`)](https://github.com/payloadcms/payload) — в составе monorepo
- [Discord community](https://discord.com/invite/payload)
- [llms.txt (для AI)](https://payloadcms.com/llms.txt) — если есть; иначе через WebFetch на docs URL

## Связанные

- [`45-data-location.md`](../whg/45-data-location.md) — что хранится в Payload vs Infisical
- `.claude/skills/payload/SKILL.md` — workflow для меня
- `.claude/skills/payload-jobs/SKILL.md`
- `.claude/skills/payload-migration/SKILL.md`
- [`docs/whg/32-structure.md`](../whg/32-structure.md) — где Payload в монорепо
- [`docs/whg/40-versions.md`](../whg/40-versions.md) — версии стека + upgrade policy
