# Web Holy Grail

**Start as a landing. Grow into anything.**

An architectural foundation for self-hosted websites that grow. The stack, the project structure, and the rules of evolution are already decided. Websites rarely die from lack of technology — they die from being built as temporary solutions. WHG gives you a foundation to start small and grow without rewriting a year later.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](../LICENSE)

[What it is and why — `docs/whg/00-overview.md`](whg/00-overview.md) · [README на русском](README.ru.md) · [Main README](../README.md)

## Quick start

```bash
gh repo create my-site --template Vovanda/WebHolyGrail --private --clone
cd my-site && corepack enable && pnpm install
pnpm setup-infisical -- --site my-site
./dev-setup.sh
./dev.sh
```

Open http://localhost:3000 (site), http://localhost:3001/admin (CMS).

## Stack

| Layer      | Choice                                         |
| ---------- | ---------------------------------------------- |
| Frontend   | Next.js 15 (App Router) + React 19             |
| UI         | shadcn/ui + Tailwind + CSS tokens              |
| CMS        | Payload 3.x (TypeScript, Russian admin UI)     |
| Database   | SQLite / Postgres (one-line adapter swap)      |
| Contracts  | `contracts/` workspace (one-way seam)          |
| Containers | Docker compose + blue-green in prod            |
| Storage    | S3-compatible (MinIO, B2, R2, AWS S3, Yandex)  |
| Secrets    | Infisical (self-host or cloud)                 |
| Tests      | Vitest + Playwright (scaffolded; coverage WIP) |

Rationale for each layer — [`whg/15-vision.md`](whg/15-vision.md).

## Structure

```
.
├── src/
│   ├── client/                # Next.js 15 app
│   └── cms/                   # Payload 3.x app
├── contracts/                 # shared types (client/cms → contracts)
├── deploy/{local,prod,proxy-stack}/
├── scripts/                   # setup-infisical, sync-template
└── docs/whg/                  # documentation
```

Details — [`whg/32-structure.md`](whg/32-structure.md).

## Docs

| File                                             | What                                                   |
| ------------------------------------------------ | ------------------------------------------------------ |
| [`00-overview.md`](whg/00-overview.md)           | Category, the problem it addresses, what's in the box  |
| [`15-vision.md`](whg/15-vision.md)               | Stack rationale: why these choices                     |
| [`30-philosophy.md`](whg/30-philosophy.md)       | R-rules R1-R9                                          |
| [`32-structure.md`](whg/32-structure.md)         | Monorepo layout, growth models, project types          |
| [`37-scaffolding.md`](whg/37-scaffolding.md)     | Scaffolding a new site (gh template → Infisical → dev) |
| [`45-data-location.md`](whg/45-data-location.md) | Where values live — Payload / Infisical / code         |
| [`stack/`](stack/)                               | Per-component reference                                |

## License

[MIT](../LICENSE)
