# client — Next 15 public frontend

Public-facing site. Talks to the CMS **only** through `@<scope>/contracts` (R3).

## Stack

- **Next 15** + React 19 + App Router (SSR by default)
- **Tailwind 3.4** — utilities encapsulated inside components (R1)
- **CSS tokens** (`src/styles/tokens.css`) — single source of truth for palette / radii / typography (R2)
- **clsx + tailwind-merge** — `cn` helper for conditional classes
- **Playwright** — smoke and E2E

## Run locally (no Docker)

```bash
# From the monorepo root
pnpm --filter client dev
# → http://localhost:3000
```

Requires the CMS to be running on `http://localhost:3001` (see `../cms/README.md`).

Via Infisical:

```bash
infisical run --env=dev -- pnpm --filter client dev
```

## Structure

```
src/
├── app/                       # App Router (Server Components by default)
│   ├── layout.tsx             # root layout + metadata from SiteSettings
│   └── page.tsx               # home page
├── lib/
│   ├── api-client.ts          # CMS client via contracts
│   └── utils.ts               # cn helper
└── styles/
    ├── tokens.css             # CSS variables (R2)
    └── globals.css            # tailwind + base styles
```

## Principles

- **R1** — Tailwind utilities live inside components, not bare `<div className="px-4 py-2 bg-...">` on pages.
- **R2** — no `bg-[#hex]` / inline color. Only variables from `tokens.css`.
- **R3** — `import from '../../cms/...'` is **forbidden**. Only through the contracts workspace.
- **R5+** — blocks are JSON-serializable, no `children: ReactNode` in public APIs. See `docs/whg/30-philosophy.md`.
- **Server Components by default.** `'use client'` only when there is state/effect/handler.
