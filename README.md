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

> Заполнится по мере подъёма Шага 3 (см. PLAN).

## Секреты

- Хранилище: **Infisical** (Cloud free на старте).
- `.env` НИКОГДА не коммитим. `.env.example` — шаблон.
- Локально: `infisical login`, дальше `pnpm dev` под `infisical run --`.
- На VPS: `infisical run -- docker compose up -d`.

## Принципы

См. `CLAUDE.md`. Кратко: SOLID, чистая архитектура, документация публичных API, тесты на логику в том же коммите, атомарные коммиты по `.claude/skills/git-style` (стиль детально в личных скиллах Володи).
