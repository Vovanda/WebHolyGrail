# Web Holy Grail

Готовый self-hosted сайт с CMS-админкой. Клонируете, деплоите — и сразу создаёте страницы через визуальную админку. Стек: Next.js 15 + Payload 3 + Docker. MIT.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

[Что это и зачем — `docs/whg/00-overview.md`](docs/whg/00-overview.md) · [README in English](docs/README.en.md) · [README на русском](docs/README.ru.md)

## Quick start

```bash
gh repo create my-site --template Vovanda/WebHolyGrail --private --clone
cd my-site && corepack enable && pnpm install
pnpm setup-infisical -- --site my-site
./dev-setup.sh
./dev.sh
```

Открывается http://localhost:3000 (сайт), http://localhost:3001/admin (CMS).

## Стек

| Слой       | Выбор                                              |
| ---------- | -------------------------------------------------- |
| Frontend   | Next.js 15 (App Router) + React 19                 |
| UI         | shadcn/ui + Tailwind + CSS-токены                  |
| CMS        | Payload 3.x (TypeScript-first, админка на русском) |
| Database   | SQLite / Postgres (адаптер одной строкой)          |
| Contracts  | `contracts/` workspace (one-way seam)              |
| Containers | Docker compose + blue-green в проде                |
| Storage    | S3-совместимое (MinIO, B2, R2, AWS S3, Yandex)     |
| Secrets    | Infisical (self-host или cloud)                    |
| Tests      | Vitest + Playwright                                |

Обоснование выбора каждого слоя — [`docs/whg/15-vision.md`](docs/whg/15-vision.md).

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

Детали — [`docs/whg/32-structure.md`](docs/whg/32-structure.md).

## Docs

| File                                                  | What                                                  |
| ----------------------------------------------------- | ----------------------------------------------------- |
| [`00-overview.md`](docs/whg/00-overview.md)           | Категория, боль которую закрывает, что в коробке      |
| [`15-vision.md`](docs/whg/15-vision.md)               | Stack rationale: почему именно эти выборы             |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)       | R-rules R1-R9                                         |
| [`32-structure.md`](docs/whg/32-structure.md)         | Структура монорепо, growth models, project types      |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)     | Создание нового сайта (gh template → Infisical → dev) |
| [`45-data-location.md`](docs/whg/45-data-location.md) | Где живут значения — Payload / Infisical / код        |
| [`stack/`](docs/stack/)                               | Per-component reference                               |

## License

[MIT](LICENSE)
