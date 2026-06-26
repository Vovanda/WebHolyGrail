# Web Holy Grail

Готовый self-hosted сайт с CMS-админкой. Клонируете, деплоите — и сразу создаёте страницы через визуальную админку. Стек: Next.js 15 + Payload 3 + Docker. MIT.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](../LICENSE)

[Что это и зачем — `docs/whg/00-overview.md`](whg/00-overview.md) · [English README](README.en.md) · [Main README](../README.md)

## Быстрый старт

```bash
gh repo create my-site --template Vovanda/WebHolyGrail --private --clone
cd my-site && corepack enable && pnpm install
pnpm setup-infisical -- --site my-site
./dev-setup.sh
./dev.sh
```

Открывается http://localhost:3000 (сайт), http://localhost:3001/admin (админка).

## Стек

| Слой       | Выбор                                          |
| ---------- | ---------------------------------------------- |
| Фронт      | Next.js 15 (App Router) + React 19             |
| UI         | shadcn/ui + Tailwind + CSS-токены              |
| CMS        | Payload 3.x (TypeScript, админка на русском)   |
| БД         | SQLite / Postgres (адаптер одной строкой)      |
| Контракты  | `contracts/` workspace (one-way seam)          |
| Контейнеры | Docker compose + blue-green в проде            |
| Хранилище  | S3-совместимое (MinIO, B2, R2, AWS S3, Yandex) |
| Секреты    | Infisical (self-host или cloud)                |
| Тесты      | Vitest + Playwright                            |

Обоснование каждого слоя — [`whg/15-vision.md`](whg/15-vision.md).

## Структура

```
.
├── src/
│   ├── client/                # Next.js 15 app
│   └── cms/                   # Payload 3.x app
├── contracts/                 # shared types (client/cms → contracts)
├── deploy/{local,prod,proxy-stack}/
├── scripts/                   # setup-infisical, sync-template
└── docs/whg/                  # документация
```

Детали — [`whg/32-structure.md`](whg/32-structure.md).

## Документация

| Файл                                             | Что                                                   |
| ------------------------------------------------ | ----------------------------------------------------- |
| [`00-overview.md`](whg/00-overview.md)           | Категория, боль которую закрывает, что в коробке      |
| [`15-vision.md`](whg/15-vision.md)               | Stack rationale: почему именно эти выборы             |
| [`30-philosophy.md`](whg/30-philosophy.md)       | R-rules R1-R9                                         |
| [`32-structure.md`](whg/32-structure.md)         | Структура монорепо, growth models, project types      |
| [`37-scaffolding.md`](whg/37-scaffolding.md)     | Создание нового сайта (gh template → Infisical → dev) |
| [`45-data-location.md`](whg/45-data-location.md) | Где живут значения — Payload / Infisical / код        |
| [`stack/`](stack/)                               | Reference по компонентам стека                        |

## Лицензия

[MIT](../LICENSE)
