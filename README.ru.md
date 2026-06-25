# Web Holy Grail

Opinionated монорепо-шаблон для production-сайтов микробизнесу — Next.js (App Router) + Payload CMS + Postgres/SQLite + Docker.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%20·%20Payload%20·%20TypeScript-2E86AB?style=flat-square)](docs/whg/30-philosophy.md)

[Live examples](https://whg.sawking.tech) · [Docs](docs/whg/) · [English README](README.md)

## Что это

Монорепо-шаблон с одним стеком, одним набором архитектурных правил (R1–R9, см. [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md)) и одной историей деплоя. Сайты создаются из `packages/_template`, наполняются вручную или LLM-агентом, живут под `sites/<site>/`.

Закрывает разрыв между статическими лендингами (нельзя редактировать контент) и плагинными CMS (данные сцеплены с презентацией, тяжело вырасти в нормальный бэкенд).

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
# 1. «Use this template» на GitHub, или:
gh repo create my-site --template <owner>/<repo> --private

# 2. Bootstrap
cd my-site
corepack enable
pnpm install

# 3. Env для сайта
cd sites/<your-site>
./dev-setup.sh

# 4. Запустить dev-стек
./dev.sh
```

Дальше http://localhost:3000 (сайт) и http://localhost:3001/admin (админка Payload).

## Структура проекта

```
WebHolyGrail/
├── packages/                  # общее ядро (растёт из sites/ — R9)
│   ├── ui/  ·  tokens/  ·  contracts/
│   └── _template/             # скелет нового сайта
├── sites/
│   └── <site>/
│       ├── contracts/         # типы-контракты (над src/)
│       ├── src/client/        # Next.js фронт (свой Dockerfile)
│       ├── src/cms/           # Payload CMS (свой Dockerfile)
│       └── deploy/{local,prod}/   # docker-compose, blue-green deploy
├── deploy/                    # nginx уровня платформы (multi-site)
├── docs/whg/                  # архитектурная документация
└── LICENSE                    # MIT
```

## Документация

|                                                         |                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`00-overview.md`](docs/whg/00-overview.md)             | Entry point: что это, чем НЕ является, ключевые архитектурные разделения |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)         | Архитектурные правила R1–R9                                              |
| [`32-structure.md`](docs/whg/32-structure.md)           | Монорепо и структура сайта, три модели роста                             |
| [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md) | Фронт-стек и блочная модель                                              |
| [`36-block-coverage.md`](docs/whg/36-block-coverage.md) | Покрытие блочной модели: Payload из коробки vs. кастомная работа         |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)       | Как рождается новый сайт (experimental)                                  |
| [`38-invariants.md`](docs/whg/38-invariants.md)         | Инвариантные коллекции и блоки, переиспользуемые между сайтами           |

## Лицензия

[MIT](LICENSE) © 2026 Владимир Савкин / [Sawking.Tech](https://sawking.tech).
