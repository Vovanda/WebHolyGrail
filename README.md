# Web Holy Grail

Opinionated monorepo template for production small-business websites — Next.js (App Router) + Payload CMS + Postgres/SQLite + Docker.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%20·%20Payload%20·%20TypeScript-2E86AB?style=flat-square)](docs/whg/30-philosophy.md)

[Live examples](https://whg.sawking.tech) · [Docs](docs/whg/) · [README на русском](README.ru.md)

## What it is

A monorepo template with one stack, one set of architectural rules (R1–R9, see [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md)), and one deployment story. Sites are created from `packages/_template`, scaffolded by an LLM agent or by hand, and live under `sites/<site>/`.

Targets the gap between static one-pagers (no content editing) and plugin-based CMSes (data welded to presentation, hard to grow into a real backend).

## Stack

| Layer         | Choice                                           | Why                                                                             |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| Frontend      | **Next.js** (App Router, SSR/SSG) + React        | SSR, file-based routing, good editor/LLM tooling                                |
| UI primitives | **shadcn/ui** + Tailwind + CSS tokens            | Components copied into the repo, no opaque dependency                           |
| CMS           | **Payload 3.x** (MIT, TypeScript)                | Single source of truth: schema + REST/GraphQL + admin generated from one config |
| Database      | **SQLite** by default, **Postgres** when scaling | One-line adapter swap; relational from day one                                  |
| Contracts     | `contracts/` workspace                           | One-way dependency: `client/`, `cms/`, `api/` → `contracts/`                    |
| Containers    | Docker + compose, blue-green for prod            | Per-app Dockerfile; reference deploy scripts included                           |
| Storage       | S3-compatible (any provider or MinIO)            | Same API across providers                                                       |
| Tests         | Vitest + Playwright                              | Unit + smoke at every PR                                                        |

Live examples of sites built on this template: [whg.sawking.tech](https://whg.sawking.tech).

## Quick start

```bash
# 1. "Use this template" on GitHub, or:
gh repo create my-site --template <owner>/<repo> --private

# 2. Bootstrap
cd my-site
corepack enable
pnpm install

# 3. Set up env for a site
cd sites/<your-site>
./dev-setup.sh

# 4. Run dev stack
./dev.sh
```

Then http://localhost:3000 (site) and http://localhost:3001/admin (Payload admin).

## Project structure

```
WebHolyGrail/
├── packages/                  # shared core (grows out of sites/ — R9)
│   ├── ui/  ·  tokens/  ·  contracts/
│   └── _template/             # site scaffold
├── sites/
│   └── <site>/
│       ├── contracts/         # type contracts (sits above src/)
│       ├── src/client/        # Next.js front (own Dockerfile)
│       ├── src/cms/           # Payload CMS (own Dockerfile)
│       └── deploy/{local,prod}/   # docker-compose, blue-green deploy
├── deploy/                    # platform-level nginx (multi-site host)
├── docs/whg/                  # architecture docs
└── LICENSE                    # MIT
```

## Documentation

|                                                         |                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`00-overview.md`](docs/whg/00-overview.md)             | Entry point: what this is, what it isn't, the architectural separations |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)         | Architectural rules R1–R9                                               |
| [`32-structure.md`](docs/whg/32-structure.md)           | Monorepo and per-site layout, three growth models                       |
| [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md) | Frontend stack and the block model                                      |
| [`36-block-coverage.md`](docs/whg/36-block-coverage.md) | Block-model coverage: Payload out of the box vs. custom work            |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)       | How a new site is scaffolded (experimental)                             |
| [`38-invariants.md`](docs/whg/38-invariants.md)         | Invariant collections and blocks reused across sites                    |

## License

[MIT](LICENSE) © 2026 Vladimir Savkin / [Sawking.Tech](https://sawking.tech).
