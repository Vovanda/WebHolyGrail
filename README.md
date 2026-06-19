# Web Holy Grail

> Opinionated dev-среда и растущая база компонентов для производства честных сайтов микробизнесу.

**Архитектурный контекст** — в Memory MCP проекта `HolyGrail`, заметки 00–90.
**Правила для агента и человека** — в `CLAUDE.md` и `.claude/rules/common.md`.
**Текущий план** — Memory MCP `HolyGrail/plan/PLAN`.

## Структура

```
WebHolyGrail/                   # монорепо-зонтик
├── sites/
│   └── veo55/                  # первый сайт (питомник veo55.ru)
│       ├── contracts/          # типы-разъём (НАД src/)
│       ├── src/
│       │   ├── client/         # Next 14 (Dockerfile свой)
│       │   └── cms/            # Payload 3.x (Dockerfile свой)
│       └── deploy/local/       # docker-compose сайта
├── packages/                   # общее ядро (растёт ИЗ sites/, не до)
├── platform/                   # инфра уровня монорепо (по нужде)
├── deploy/                     # общий nginx-зонтик прод-окружения (когда понадобится)
├── .claude/                    # rules + skills для агента
└── CLAUDE.md                   # входная инструкция
```

## Старт

### Требования

- Node ≥ 20.11 (рекомендация: 22 LTS)
- pnpm ≥ 9 (включается через `corepack enable`)
- Docker Desktop / Engine
- Infisical CLI ([инструкция](https://infisical.com/docs/cli/overview))

### Первый запуск (когда инфра поднята — Шаги 3+)

```bash
corepack enable
pnpm install
infisical login          # один раз
pnpm compose:up           # client + cms + sqlite
```

### Полезные скрипты

| Скрипт                  | Что делает                                                 |
| ----------------------- | ---------------------------------------------------------- |
| `pnpm dev`              | dev-сервер для всех sites/\* (Next + Payload)              |
| `pnpm build`            | production-сборка                                          |
| `pnpm lint`             | ESLint по всем workspace'ам                                |
| `pnpm test`             | Vitest по всем workspace'ам                                |
| `pnpm smoke`            | Playwright smoke (главная + админка открываются)           |
| `pnpm compose:up`       | docker compose up -d (с подтянутыми Infisical-секретами)   |
| `pnpm compose:down`     | остановить контейнеры                                      |
| `pnpm compose:logs`     | логи всех контейнеров стримом                              |
| `pnpm changeset`        | завести запись о грядущей версии (после фичи/фикса)        |
| `pnpm version-packages` | применить накопленные changesets → бамп версий + CHANGELOG |

## Инфра

Карта всего что в репо стоит и зачем — `docs/infra-journal.md`. Обновляется при каждом значимом добавлении инфры (новый хук, новая dev-зависимость, новая утилита).

## Версионирование

- **[Changesets](https://github.com/changesets/changesets)** — каждая существенная фича/фикс сопровождается changeset (`pnpm changeset` → выбрать пакет + bump-тип + описание). Релиз: `pnpm version-packages` бампит версии и обновляет `CHANGELOG.md`.
- **commitlint** — pre-commit-хук валидирует conventional-commit формат (`type(scope): summary`). Плохие сообщения не уходят в историю.
- **husky** — управляет git-хуками. `pnpm install` автоматически их активирует через `prepare`.

## Секреты

Полная инструкция — [`docs/secrets/README.md`](./docs/secrets/README.md). Кратко:

- Хранилище: **Infisical** (Cloud free на старте).
- `.env` НИКОГДА не коммитим. `.env.example` — шаблон-документация (в git).
- Локально: `infisical login` → `infisical init` в `sites/veo55/` → `infisical run --env=dev -- pnpm dev`.
- На VPS: service-token + `infisical run --env=prod --token=$INFISICAL_TOKEN -- docker compose up -d`.

## Принципы

См. `CLAUDE.md`. Кратко: SOLID, чистая архитектура, документация публичных API, тесты на логику в том же коммите, атомарные коммиты по `.claude/skills/git-style` (стиль детально в личных скиллах Володи).
