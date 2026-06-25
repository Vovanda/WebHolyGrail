# `_template/` — site scaffold

> The seed used to create new sites. Lives in `packages/`, not in `sites/`, so it is not mistaken for a live site and not accidentally deployed.

## How a new site is created

```bash
# From the monorepo root:
cp -R packages/_template sites/<your-site>

# Rename inside the new folder:
#  - package.json name
#  - workspace references in src/client, src/cms
#  - site.config.ts (site name, domain, palette, database)
#  - deploy/local/.env.local
```

A scaffolding script (`pnpm holygrail new <site>`) automating these steps is planned (see [`docs/whg/37-scaffolding.md`](../../docs/whg/37-scaffolding.md)).

## What the template contains

The template mirrors the per-site layout described in [`docs/whg/32-structure.md`](../../docs/whg/32-structure.md):

```
_template/
├── contracts/                # type contracts (above src/)
│   ├── pages.ts
│   ├── forms.ts
│   └── entities.ts
├── src/
│   ├── client/               # Next.js front (own Dockerfile)
│   │   ├── app/              # App Router routes
│   │   ├── blocks/           # site-specific blocks (shared blocks come from @holygrail/ui)
│   │   ├── components/ui/    # shadcn primitives
│   │   ├── lib/
│   │   │   └── api-client.ts # talks to cms (and api on growth) via contracts/
│   │   └── styles/
│   │       ├── globals.css
│   │       └── tokens.css    # site tokens (inherit base, override palette)
│   └── cms/                  # Payload CMS (own Dockerfile)
│       ├── collections/
│       │   ├── Pages.ts
│       │   ├── Media.ts
│       │   ├── Users.ts
│       │   └── FormSubmissions.ts
│       ├── app/(payload)/admin/
│       ├── payload.config.ts # database adapter chosen here
│       └── server.ts
├── deploy/
│   ├── local/                # docker-compose.yml for dev
│   └── prod/
│       ├── compose.bluegreen.yml
│       └── deploy.sh
├── tools/
├── docs/                     # per-site documentation
├── site.config.ts            # site identity in one place (name, domain, palette, DB)
├── .env.example
├── package.json
└── README.md
```

## Status

Currently empty — the working reference is `sites/veo55/`. The extraction into `_template/` is in progress; once the structure stabilises, this folder will be populated and the reference site will start consuming `@holygrail/*` workspace packages instead of having its own copies.

See [`docs/whg/37-scaffolding.md`](../../docs/whg/37-scaffolding.md) for the longer-term tooling plan.
