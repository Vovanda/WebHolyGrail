# Web Holy Grail

Opinionated monorepo template for production small-business websites — Next.js (App Router) + Payload CMS + Postgres/SQLite + Docker.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%20·%20Payload%20·%20TypeScript-2E86AB?style=flat-square)](docs/whg/30-philosophy.md)

[Docs](docs/whg/) · [README на русском](README.ru.md)

## What it is

A GitHub template repo with one stack, one set of architectural rules (see [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md)), and one deployment story. Click "Use this template" → you get a working Next 15 + Payload 3 skeleton at the **root** (no folder to unpack), with Infisical-based secrets and blue-green deploy wired in.

Targets the gap between static one-pagers (Tilda/Tap-style — no content editing, no growth path) and plugin-based CMSes (WordPress/Strapi — data welded to presentation, hard to grow into a real backend).

**One site grows with the business.** When the company adds a new sub-product, blog, team page, or case-studies section, you add it as `blocks/domain/<niche>/` + collections + routes in the same repo. No "we need a new website" project for every pivot — side-scaling baked into the architecture.

Generic code lives upstream in this template. Each instance you create stays in sync via [`sync-template.sh`](scripts/sync-template.sh) — picks up new primitives, fixes, and Payload upgrades without touching your domain blocks.

## Who this is for

A small business that:

- outgrew Tilda/Tap (need real CMS + custom blocks + own database) but doesn't want WordPress (plugin hell, PHP, presentation welded to data)
- starts as a business-card site, then adds a catalog, then a blog, then a customer portal — over months, not all at once
- has one developer (or a small team) who values an opinionated stack over endless choice

Concrete example niches the template is built around: kennel/breeder, café/restaurant, clinic/practice, master/craftsman studio, small e-shop with editorial content.

### Not the right tool for

| You need                                      | Use instead                                                                   |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| E-commerce with checkout/payments first-class | [Vercel Commerce](https://vercel.com/templates/next.js/nextjs-commerce)       |
| Application without CMS                       | [T3 stack](https://create.t3.gg/)                                             |
| Documentation site only                       | [Astro Starlight](https://starlight.astro.build/)                             |
| Admin panel only (CRUD over existing DB)      | [Refine.dev](https://refine.dev/)                                             |
| Headless CMS as a service                     | [Strapi](https://strapi.io/), [Sanity](https://www.sanity.io/), Payload Cloud |
| Static blog                                   | [Hugo](https://gohugo.io/), [Eleventy](https://www.11ty.dev/), Astro          |

WHG is for the "between" case: site + CMS + room to grow into an app — by one stack, in one repo.

## Status

The architectural design is mature. The implementation is **work in progress** — see [open issues](https://github.com/Vovanda/WebHolyGrail/issues) for the current backlog (template hardening, CI, tests, vision discussions). Recommended use today: read, fork for reference, file feedback. First versioned release (`v0.1.0`) when critical/high blockers close.

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
| Tests         | Vitest + Playwright                              | Test setup scaffolded; coverage WIP (see issues #19, #20)                       |

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

Project types: `minimal` (current). Additional starting presets are under discussion — see issue [#27](https://github.com/Vovanda/WebHolyGrail/issues/27). Growth always happens via `blocks/domain/<niche>/` on top of whatever starting config you pick.

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
├── scripts/                   # setup-infisical, sync-template, …
├── docs/whg/                  # architecture docs
├── .claude/skills/            # holygrail-* + payload* + infisical + template-sync
├── dev.sh, dev-setup.sh       # Infisical-wrapped dev
└── LICENSE                    # MIT
```

The four component levels (L1–L4) — `ui/` atoms, `primitives/` molecules, `layout/`+`decor/` structural, `domain/` business niches — are explained in [`32-structure.md`](docs/whg/32-structure.md).

## Documentation

|                                                         |                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`00-overview.md`](docs/whg/00-overview.md)             | Entry point: what this is, what it isn't, the architectural separations       |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)         | Architectural rules (audit in progress — see issue #25)                       |
| [`32-structure.md`](docs/whg/32-structure.md)           | Monorepo and per-site layout, three growth models                             |
| [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md) | Frontend stack and the block model                                            |
| [`36-block-coverage.md`](docs/whg/36-block-coverage.md) | Block-model coverage: Payload out of the box vs. custom work                  |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)       | How a new site is scaffolded (gh template → Infisical → dev)                  |
| [`38-invariants.md`](docs/whg/38-invariants.md)         | Invariant collections and blocks reused across sites                          |
| [`40-versions.md`](docs/whg/40-versions.md)             | Stack versions, upgrade policy, breaking-change discipline                    |
| [`45-data-location.md`](docs/whg/45-data-location.md)   | Where values live — Payload vs Infisical vs code, by "who changes them"       |
| [`stack/`](docs/stack/)                                 | Stack components reference — versions, install, MCP servers, AI skills, links |

## Contributing & feedback

Backlog and design discussions live in [GitHub Issues](https://github.com/Vovanda/WebHolyGrail/issues). Issue templates: `bug` / `feat` / `chore`. Discussion threads tagged `discussion` / `vision` — that's where stack choices, project-type policy, shadcn-vs-sync, etc. are being worked through.

## License

[MIT](LICENSE) — see [`LICENSE`](LICENSE) for copyright.
