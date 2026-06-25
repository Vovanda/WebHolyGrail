# Web Holy Grail

Opinionated монорепо-шаблон для production-сайтов микробизнесу — Next.js (App Router) + Payload CMS + Postgres/SQLite + Docker.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%20·%20Payload%20·%20TypeScript-2E86AB?style=flat-square)](docs/whg/30-philosophy.md)

[Live examples](https://whg.sawking.tech) · [Docs](docs/whg/) · [English README](README.md)

## Что это

GitHub template-репо с одним стеком, одним набором архитектурных правил (R0–R15, см. [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md)) и одной историей деплоя. Нажми "Use this template" — в корне получишь рабочий каркас Next 15 + Payload 3 (без папки для распаковки), с Infisical-секретами и blue-green деплоем уже подключёнными.

Закрывает разрыв между статическими лендингами (нельзя редактировать контент) и плагинными CMS (данные сцеплены с презентацией, тяжело вырасти в нормальный бэкенд).

**Один сайт растёт вместе с бизнесом.** Когда компания добавляет новый sub-продукт, блог, команду, case studies — это добавляется как `blocks/domain/<niche>/` + collections + routes в том же репо. Никаких «нам нужен новый сайт» при каждом pivot'е бизнеса — R4 side-scaling вшит в архитектуру.

Generic-код живёт upstream в этом шаблоне. Каждый инстанс синхронизируется через [`sync-template.sh`](scripts/sync-template.sh) — подтягивает новые примитивы, фиксы и Payload-апгрейды не трогая твои domain-блоки.

## Стек

| Слой         | Выбор                                          | Зачем                                                                      |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| Фронт        | **Next.js** (App Router, SSR/SSG) + React      | SSR, файловая роутинг, удобство для редакторов и LLM                       |
| UI-примитивы | **shadcn/ui** + Tailwind + CSS-токены          | Код компонентов в репо, без чёрного ящика                                  |
| CMS          | **Payload 3.x** (MIT, TypeScript)              | Один источник правды: схема + REST/GraphQL + админка из одного конфига     |
| БД           | **SQLite** по умолчанию, **Postgres** на росте | Адаптер меняется одной строкой; реляционно с первого дня                   |
| Контракты    | `contracts/` workspace                         | Однонаправленная зависимость: `client/`, `cms/`, `api/` → `contracts/`     |
| Контейнеры   | Docker + compose, blue-green в проде           | Свой Dockerfile у каждого приложения; reference deploy-скрипты в комплекте |
| Хранилище    | S3-совместимое (любой провайдер или MinIO)     | Один API у всех                                                            |
| Тесты        | Vitest + Playwright                            | Unit + smoke на каждый PR                                                  |

Примеры сайтов на этом шаблоне: [whg.sawking.tech](https://whg.sawking.tech).

## Быстрый старт

```bash
# 1. Создаём инстанс из шаблона:
gh repo create <owner>/my-site --template Vovanda/WebHolyGrail --private --clone
cd my-site

# 2. Устанавливаем:
corepack enable
pnpm install

# 3. Bootstrap секретов (Infisical Cloud):
infisical login                                # один раз на машину
pnpm setup-infisical -- --site my-site         # project + dev/staging/prod envs

# 4. Запускаем dev-стек:
./dev-setup.sh                                 # один раз на checkout
./dev.sh                                       # CMS :3001 + Client :3000
```

Дальше http://localhost:3000 (сайт) и http://localhost:3001/admin (админка Payload).

Полный flow scaffolding (machine identity для прода, деплой, sync) — в [`docs/whg/37-scaffolding.md`](docs/whg/37-scaffolding.md).

## Структура проекта

```
.                              # ← корень = твой сайт (нет папки для распаковки)
├── src/
│   ├── client/                # Next.js 15 (App Router, свой Dockerfile)
│   │   └── src/{ui,blocks,layouts,lib,styles,app}/
│   │       blocks/{primitives,layout,decor,system,domain}/
│   └── cms/                   # Payload 3.x (свой Dockerfile)
├── contracts/                 # типизированный разъём — client/cms → contracts (R3)
├── deploy/{local,prod,proxy-stack}/
├── scripts/                   # setup-infisical, sync-template, migrate-veo55
├── docs/whg/                  # архитектурная документация
├── .claude/skills/            # holygrail-* + payload* + infisical + template-sync
├── dev.sh, dev-setup.sh       # Infisical-обёрнутый dev
└── LICENSE                    # MIT
```

Четыре уровня компонентов (L1–L4) — `ui/` атомы, `primitives/` молекулы, `layout/`+`decor/` структурные, `domain/` бизнес-ниши — описаны в [`32-structure.md`](docs/whg/32-structure.md).

## Документация

|                                                         |                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`00-overview.md`](docs/whg/00-overview.md)             | Entry point: что это, чем НЕ является, ключевые архитектурные разделения |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)         | Архитектурные правила R1–R9                                              |
| [`32-structure.md`](docs/whg/32-structure.md)           | Монорепо и структура сайта, три модели роста                             |
| [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md) | Фронт-стек и блочная модель                                              |
| [`36-block-coverage.md`](docs/whg/36-block-coverage.md) | Покрытие блочной модели: Payload из коробки vs. кастомная работа         |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)       | Как рождается новый сайт (gh template → Infisical → dev)                 |
| [`38-invariants.md`](docs/whg/38-invariants.md)         | Инвариантные коллекции и блоки, переиспользуемые между сайтами           |
| [`40-versions.md`](docs/whg/40-versions.md)             | Версии стека, политика апгрейдов, breaking-change дисциплина             |

## Лицензия

[MIT](LICENSE) © 2026 Владимир Савкин / [Sawking.Tech](https://sawking.tech).
