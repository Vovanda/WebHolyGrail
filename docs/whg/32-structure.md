# Repository structure

> Single source of truth: monorepo at the top, identical site layout repeated underneath.

## Monorepo layout

```
WebHolyGrail/                     # monorepo umbrella
│
├── packages/                     # shared core — grows OUT of sites/, not before (R9)
│   ├── ui/                       # @holygrail/ui — block catalogue
│   ├── tokens/                   # base design tokens (sites override the palette)
│   ├── contracts/                # base type contracts (page/block shapes)
│   └── _template/                # site scaffold (the seed for new sites)
│
├── sites/                        # live sites
│   ├── <site>/                   # each site has the structure below
│   └── <site>/
│
├── deploy/                       # platform-level nginx (when many sites share one host)
│   ├── local/
│   └── prod/
│
├── docs/                         # framework docs (you're reading them)
├── tools/                        # repo tooling (lint, hooks, etc.)
├── package.json                  # workspaces: packages/*, sites/*
└── README.md
```

### Boundaries to keep straight

- **Top-level `deploy/`** = multi-site host (one nginx in front of many sites). **Per-site `deploy/`** (below) = how that one site is built and shipped.
- **`packages/_template/`** sits in `packages/`, not in `sites/` — it's a generator seed, not a live site.

### How a site connects to the core

A site declares the shared packages as workspace dependencies, not by copying: `@holygrail/ui` for blocks, `tokens` for the base palette, `contracts` for base types. Site-specific code stays inside the site's folder. Custom patterns that earn their way in graduate into `packages/` later — never the other way round.

## Per-site layout

```
<site>/                           # one site (created from packages/_template)
│
├── deploy/                       # site orchestration
│   ├── local/
│   │   └── docker-compose.yml    # client + cms + db (+ api when it grows)
│   ├── prod/
│   │   ├── compose.bluegreen.yml
│   │   └── deploy.sh             # blue-green deploy script
│   └── db/                       # database (adapter chosen per site type)
│
├── docs/                         # site-specific docs
│
├── tools/                        # site-specific tooling
│
├── contracts/                    # THE SEAM — sits ABOVE src/, not inside it
│   ├── pages.ts                  # page / block shapes
│   ├── forms.ts                  # form / submission shapes
│   └── entities.ts               # domain entities (for CRUD/api)
│   # Dependency is one-way: client/cms/api → contracts. Never the other way.
│
├── src/
│   ├── client/                   # FRONT (Next.js) — render layer, doesn't know about Payload
│   │   ├── Dockerfile            # ← Dockerfile lives WITH the app (carries itself)
│   │   ├── app/
│   │   ├── blocks/               # site-specific blocks (shared blocks come from @holygrail/ui)
│   │   ├── components/ui/        # shadcn primitives
│   │   ├── lib/
│   │   │   └── api-client.ts     # talks to cms (and api on growth) via contracts/
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── tokens.css        # site tokens (inherit base, override palette)
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tailwind.config.ts
│   │   └── tsconfig.json
│   │
│   ├── cms/                      # CONTENT (Payload)
│   │   ├── Dockerfile            # ← its own Dockerfile
│   │   ├── collections/
│   │   ├── app/(payload)/admin/  # admin UI — a backend feature, leaves with the CMS
│   │   ├── payload.config.ts     # database adapter chosen here
│   │   ├── server.ts             # exposes the API in the shape of contracts/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                      # BUSINESS LOGIC — appears as the site grows
│       └── (empty in model 1; .NET/Node when needed)
│
├── .env.example                  # template — what variables exist (no real values)
├── package.json                  # workspaces: client, cms, api, contracts
└── README.md
```

### Layout principles

- **Dockerfile lives with the app, not in `deploy/`.** `client/Dockerfile`, `cms/Dockerfile`. The app knows how to build itself and carries that with it. `deploy/` only orchestrates.
- **`contracts/` sits above `src/`, not inside it.** The seam isn't on the same level as the apps it connects. Dependency is one-way: `client/`, `cms/`, `api/` depend on `contracts/`; `contracts/` depends on no one. Putting it inside `src/` invites accidental reverse imports (client → contracts → client) and breaks the seam.
- **The database is visible but behind an access layer.** `deploy/db/` (init + volume + backup). Data is the permanent foundation — it doesn't belong hidden inside a single compose line. Picking SQLite vs. Postgres is a pragmatic call (see [`70`](70-backend-data.md), R8).
- **Environments belong in `deploy/`.** `local/` and `prod/`. Secrets management hooks into these.
- **`.env.example` is documentation, not storage.** Lists what variables exist; real values come from your secrets manager.

## Three growth models (same tree, three configurations)

- **Model 1 — CMS only (startup, landing page / CRUD).** `client` + `cms` + `contracts`; `api/` empty. CMS is the backend.
- **Model 2 — CMS + api side by side (growth).** Business logic appears → write `src/api/` (e.g. .NET) with repositories. **CMS stays** and keeps owning content; `api/` owns data and logic. Side-scaling, the core isn't touched (R4).
- **Model 3 — no CMS (highload, rare).** `cms/` is pulled out entirely. Database and `client/` stay. The frontend doesn't change — it still talks via `contracts/`.

The common misreading is "the CMS gets replaced by a backend". That's wrong: the **backend grows up alongside the CMS** (model 2). The CMS leaves only in model 3, which most sites never reach.

## When a site graduates to its own repo

Default: stay inside the monorepo (`sites/<site>/`, share workspace packages locally). Move out only when there's real reason: separate teams on front/back, the CMS has been replaced by something with its own release cycle, or the `api/` is shared by multiple frontends. For a typical site, a separate repo is overengineering (R7).
