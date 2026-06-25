# Web Holy Grail

Opinionated monorepo template for production small-business websites — Next.js (App Router) + Payload CMS + Postgres/SQLite + Docker.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%20·%20Payload%20·%20TypeScript-2E86AB?style=flat-square)](docs/whg/30-philosophy.md)

[Live examples](https://whg.sawking.tech) · [Docs](docs/whg/) · [README на русском](README.ru.md)

## What it is

A GitHub template repo with one stack, one set of architectural rules (R0–R15, see [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md)), and one deployment story. Click "Use this template" → you get a working Next 15 + Payload 3 skeleton at the **root** (no folder to unpack), with Infisical-based secrets and blue-green deploy wired in.

Targets the gap between static one-pagers (no content editing) and plugin-based CMSes (data welded to presentation, hard to grow into a real backend).

**One site grows with the business.** When the company adds a new sub-product, blog, team page, or case-studies section, you add it as `blocks/domain/<niche>/` + collections + routes in the same repo. No "we need a new website" project for every pivot — R4 side-scaling baked into the architecture.

Generic code lives upstream in this template. Each instance you create stays in sync via [`sync-template.sh`](scripts/sync-template.sh) — picks up new primitives, fixes, and Payload upgrades without touching your domain blocks.

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
# 1. Create your instance (always --private — instances are not public):
gh repo create <owner>/my-site --template Vovanda/WebHolyGrail --private --clone
cd my-site

# 2. Install:
corepack enable
pnpm install

# 3. Bootstrap (Infisical project + secrets + dev/staging/prod envs):
pnpm setup-infisical -- --site my-site [--type minimal]

# 4. Run dev stack:
./dev-setup.sh                                 # one-time — MinIO + Infisical defaults
./dev.sh                                       # starts CMS :3001 + Client :3000
```

Project types: `minimal` (current), `business-card` / `blog` / `portal` (roadmap). Type is the starting configuration — growth always happens via `blocks/domain/<niche>/` on top.

Open http://localhost:3000 (site) and http://localhost:3001/admin (Payload admin).

For the full scaffolding flow (machine identity for prod, deploy, sync) see [`docs/whg/37-scaffolding.md`](docs/whg/37-scaffolding.md).

## Project structure

```
.                              # ← root = your site (no folder to unpack)
├── src/
│   ├── client/                # Next.js 15 (App Router, own Dockerfile)
│   │   └── src/{ui,blocks,layouts,lib,styles,app}/
│   │       blocks/{primitives,layout,decor,system,domain}/
│   └── cms/                   # Payload 3.x (own Dockerfile)
├── contracts/                 # typed seam — client/cms → contracts (one-way)
├── deploy/{local,prod,proxy-stack}/
├── scripts/                   # setup-infisical, sync-template, migrate-veo55
├── docs/whg/                  # architecture docs
├── .claude/skills/            # holygrail-* + payload* + infisical + template-sync
├── dev.sh, dev-setup.sh       # Infisical-wrapped dev
└── LICENSE                    # MIT
```

The four component levels (L1–L4) — `ui/` atoms, `primitives/` molecules, `layout/`+`decor/` structural, `domain/` business niches — are explained in [`32-structure.md`](docs/whg/32-structure.md).

## Documentation

|                                                         |                                                                         |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`00-overview.md`](docs/whg/00-overview.md)             | Entry point: what this is, what it isn't, the architectural separations |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)         | Architectural rules R1–R9                                               |
| [`32-structure.md`](docs/whg/32-structure.md)           | Monorepo and per-site layout, three growth models                       |
| [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md) | Frontend stack and the block model                                      |
| [`36-block-coverage.md`](docs/whg/36-block-coverage.md) | Block-model coverage: Payload out of the box vs. custom work            |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)       | How a new site is scaffolded (gh template → Infisical → dev)            |
| [`38-invariants.md`](docs/whg/38-invariants.md)         | Invariant collections and blocks reused across sites                    |
| [`40-versions.md`](docs/whg/40-versions.md)             | Stack versions, upgrade policy, breaking-change discipline              |
| [`45-data-location.md`](docs/whg/45-data-location.md)   | Where values live — Payload vs Infisical vs code, by "who changes them" |
| [`stack/`](docs/stack/)                                 | Stack components reference — versions, install, MCP servers, AI skills, links |

## License

[MIT](LICENSE) © 2026 Vladimir Savkin / [Sawking.Tech](https://sawking.tech).
