# Repository structure

> Web Holy Grail repo root **is** the site. After "Use this template" you get a working Next 15 + Payload 3 skeleton, no `packages/_template/` to copy, no `sites/<name>/` to unpack.

## Root layout

```
.                                    # ← root = your site (после Use this template)
│
├── src/
│   ├── client/                      # FRONT — Next.js 15 (App Router)
│   │   ├── Dockerfile               # ← Dockerfile lives WITH the app
│   │   ├── next.config.ts
│   │   ├── package.json             # name: "client"
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── playwright.config.ts
│   │   ├── playwright/              # smoke tests
│   │   ├── public/                  # branding assets, decor SVGs, favicon
│   │   └── src/
│   │       ├── app/                 # App Router routes
│   │       │   ├── (site)/
│   │       │   │   ├── layout.tsx
│   │       │   │   ├── not-found.tsx
│   │       │   │   └── [[...slug]]/page.tsx   # generic Pages catch-all
│   │       │   ├── api/health/
│   │       │   ├── sitemap.ts, robots.ts, layout.tsx
│   │       ├── ui/                  # L1 — shadcn primitives (button/input/dialog)
│   │       ├── blocks/
│   │       │   ├── primitives/      # L2 — generic molecules
│   │       │   │   ├── Carousel/    # directory pattern: index.ts + variants + types
│   │       │   │   │   ├── CarouselRows.tsx
│   │       │   │   │   ├── types.ts
│   │       │   │   │   └── index.ts
│   │       │   │   ├── Separator/   # WaveDivider, future LineDivider, ...
│   │       │   │   ├── FaqAccordion/
│   │       │   │   ├── Hero.tsx, Quote.tsx, Timeline.tsx, ...
│   │       │   ├── layout/          # L3 — Header, Footer, NavDrawer
│   │       │   ├── decor/           # L3 — purely decorative (ContentFrame *moved to /layouts*)
│   │       │   ├── system/          # PageOutlet
│   │       │   └── domain/          # L4 — business-niche blocks (one folder per niche)
│   │       │       └── kennel/      # example niche stub
│   │       ├── layouts/             # SiteLayout + Panel/Slot system + ContentFrame
│   │       │   ├── ContentFrame.tsx
│   │       │   ├── presets/
│   │       │   └── site-layout/
│   │       ├── lib/                 # utils, seo, social, api-client, theme-bootstrap
│   │       ├── styles/              # globals.css, tokens.css
│   │       └── components/          # (intentionally empty — everything moved into blocks/)
│   │
│   └── cms/                         # CONTENT — Payload 3.x
│       ├── Dockerfile
│       ├── package.json             # name: "cms"
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── src/
│           ├── payload.config.ts    # collections, plugins, jobs, S3 storage
│           ├── collections/         # Pages, Media, Users, FormSubmissions,
│           │                        # ReusableBlocks, Posts, Comments, FaqGroups
│           ├── globals/             # SiteSettings
│           └── blocks/              # Payload block definitions (Hero, Quote, ...)
│
├── contracts/                       # THE SEAM — typed boundary
│   ├── package.json                 # name: "contracts"
│   └── src/
│       ├── index.ts                 # one barrel — every public type is reexported
│       ├── blocks.ts, pages.ts, media.ts, globals.ts, theme.ts, layout.ts
│       ├── forms.ts, faq.ts, reusable.ts, social.ts, notices.ts
│
├── deploy/
│   ├── local/                       # docker-compose.yml for `pnpm compose:up`
│   ├── prod/                        # blue-green deploy.sh (Infisical-wrapped)
│   └── proxy-stack/                 # shared host nginx (multi-site umbrella)
│
├── scripts/
│   ├── setup-infisical.ts           # bootstrap Infisical project for this site
│   ├── sync-template.sh             # pull updates FROM upstream WHG → this instance
│   └── migrate-veo55-to-domain.sh   # one-shot: legacy veo55-site → template format
│
├── docs/whg/                        # you're reading this
│
├── .claude/skills/                  # holygrail-{rules,layouts,modals,ui-reference,
│                                    #            infisical,template-sync},
│                                    # payload, payload-jobs, payload-migration
│
├── dev.sh, dev-setup.sh             # `infisical run --env=dev -- pnpm dev`
├── .env.example                     # what env vars exist (real values via Infisical)
├── package.json                     # root: workspaces + scripts + Infisical SDK
├── pnpm-workspace.yaml              # contracts, src/cms, src/client
├── tsconfig.base.json
├── README.md, README.ru.md, LICENSE (MIT)
└── CLAUDE.md
```

## Boundaries to keep straight

- **Root = your site.** There is no `sites/`, no `packages/_template/`. The root **is** the scaffold. Use this template → clone → `./dev-setup.sh && ./dev.sh` → working dev stack.
- **`contracts/` is the seam.** `client/` and `cms/` import only from `contracts`. Never `client → cms` or vice versa. This makes the CMS replaceable.
- **Dockerfile lives with the app, not in `deploy/`.** `src/client/Dockerfile`, `src/cms/Dockerfile`. The app knows how to build itself. `deploy/` only orchestrates.
- **`.env.example` is documentation.** Lists what variables exist. Real values live in Infisical Cloud (`.infisical.json` workspace marker is committed; secrets aren't).

## Four levels of components

```
src/client/src/
├── ui/             L1 ATOMS       shadcn primitives (button, input, dialog)
├── blocks/
│   ├── primitives/ L2 MOLECULES   Carousel, Hero, FAQ, Quote, Timeline, Separator
│   ├── layout/     L3 STRUCTURAL  Header, Footer, NavDrawer
│   ├── decor/      L3 DECOR       purely visual additions
│   └── domain/     L4 BUSINESS    one folder per niche (kennel/, clinic/, cafe/)
```

Generic levels (L1–L3) — provided by the template, updated via `sync-template.sh`.
Domain level (L4) — owned by the instance, untouched by sync.

## Three growth models (same tree)

- **Model 1 — single-CMS (default).** `client` + `cms` + `contracts`. CMS is the backend.
- **Model 2 — CMS + custom api side-by-side.** Add `src/api/` when business logic grows beyond Payload hooks. CMS keeps owning content; `api` owns logic.
- **Model 3 — no CMS (rare, high-load).** Pull `cms` out, keep DB and `client`. Frontend doesn't change — still talks via `contracts`.

## Instances vs template

- **This repo** (`Vovanda/WebHolyGrail`, public, MIT, isTemplate=true) — upstream template. Generic only.
- **Instances** (private, one per real site) — created via "Use this template". Generic + domain overlay.
- **Sync** — `sync-template.sh` pulls updates from template into instance. Domain isn't touched. See [`.claude/skills/holygrail-template-sync/SKILL.md`](../../.claude/skills/holygrail-template-sync/SKILL.md).
