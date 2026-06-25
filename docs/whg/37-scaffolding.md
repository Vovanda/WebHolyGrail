# Scaffolding a new site

> One command on GitHub, one on the shell, two on Infisical. ~30 minutes from zero to dev stack running.

## Create the instance repo

```bash
# Option A — GitHub UI: open https://github.com/Vovanda/WebHolyGrail → "Use this template"
# Option B — gh CLI:
gh repo create <owner>/<my-site> --template Vovanda/WebHolyGrail --private --clone
cd <my-site>
```

The repo arrives with the full Holy Grail skeleton at the root — no folder to unpack.

## Local install

```bash
pnpm install
```

Installs `client`, `cms`, `contracts` workspaces.

## Bootstrap secrets via Infisical

Holy Grail uses **Infisical Cloud** for all secrets — no `.env.production` files on the VPS, no committed `.env`. See [`holygrail-infisical` skill](../../.claude/skills/holygrail-infisical/SKILL.md) for the full workflow.

Prerequisites (one-time per machine):
```bash
infisical login                                       # browser flow, token in keychain
```

Bootstrap the project for this site:
```bash
INFISICAL_ORG_ID=<your-org-id> pnpm setup-infisical -- --site <slug>
```

What the script does:
- Creates Infisical project `holygrail-<slug>`.
- Creates 3 environments: `dev`, `staging`, `prod`.
- Seeds empty placeholder secrets (PAYLOAD_SECRET, DATABASE_URI, S3_*, NEXT_PUBLIC_*).
- Writes `.infisical.json` (workspace marker) — commit it.

Then **in the Infisical UI** — one-time manual:
1. Project → Access Control → Machine Identities → Create `<slug>-prod-deploy` (Universal Auth).
2. Bind identity to `prod` environment, read-only.
3. Generate Client ID + Client Secret. Save them — they go on the VPS during first deploy.

## Fill in secrets for dev

```bash
infisical secrets set --env=dev PAYLOAD_SECRET=$(openssl rand -hex 32)
infisical secrets set --env=dev DATABASE_URI=file:./data/site.db
infisical secrets set --env=dev NEXT_PUBLIC_CMS_URL=http://localhost:3001
infisical secrets set --env=dev NEXT_PUBLIC_SITE_URL=http://localhost:3000
# … S3_* if you have one; leave blank for local-disk media
```

Or do it in the Infisical UI — same effect.

## Start the dev stack

```bash
./dev-setup.sh                # first time only — verify CLI, init project link
./dev.sh                      # infisical run --env=dev --recursive -- pnpm dev
```

You should see:
- CMS  → http://localhost:3001 (Payload admin at `/admin`)
- Client → http://localhost:3000

Open `http://localhost:3001/admin`, create the first user, log in.

## Rename the site identity

In `src/cms/package.json` and `src/client/package.json`, keep `"name": "cms"` and `"name": "client"` — those are the workspace handles, they don't change.

The site-specific identity (display name, brand palette) lives in:
- Payload `SiteSettings` global → fill in via admin UI
- `src/client/src/styles/tokens.css` → tweak palette
- `src/client/public/branding/` → drop logo / favicon

There is **no** `site.config.ts` — the things that vary per site sit in the database (SiteSettings) and brand assets.

## Make domain blocks

Site-specific entities (Dogs / Patients / Vehicles / MenuItems / …) go in:
- `src/cms/src/collections/<Domain>.ts` — Payload collection
- `contracts/src/<domain>.ts` — public type
- `src/client/src/blocks/domain/<niche>/` — React blocks
- `src/client/src/app/(site)/<domain-route>/` — if the niche has its own pages

This is the L4 layer (see [`32-structure.md`](32-structure.md)). The template never owns this — your instance does.

## Deploy

See [`Deploy: checklist for first launch on Timeweb VPS`](../infra-journal.md#first-deploy) and `deploy/prod/README.md`.

Quick summary:
- Push instance to GitHub.
- VPS — install Docker + Infisical CLI + `/etc/infisical/{client-id,client-secret}` (chmod 600 deploy:deploy).
- GitHub Actions deploy workflow — already wired in template (`.github/workflows/deploy.yml` if you ship one) or run `deploy/prod/deploy.sh <tag>` manually first time.

## Stay in sync with template

When upstream WHG ships generic improvements (new primitive, Carousel variant, Payload upgrade) — pull them in:

```bash
# In your instance repo:
git checkout -b chore/sync-template-$(date +%Y%m%d)
../WebHolyGrail/scripts/sync-template.sh . --ref main
pnpm install
pnpm -r exec tsc --noEmit
pnpm dev          # runtime smoke
git add -A && git commit -m "chore(sync): pull template main (<sha>)"
git push -u origin chore/sync-template-...
gh pr create
```

`sync-template.sh` only touches the generic whitelist — your `blocks/domain/`, domain collections, migrations, and `site.config`-equivalent stay intact. Full details: [`holygrail-template-sync` skill](../../.claude/skills/holygrail-template-sync/SKILL.md).

## Migrating a pre-template site

If you have a site built on an older Holy Grail layout (e.g. `components/dog/`, `blocks/veo55/`, `lib/dog-profile/`), run the one-shot migration once:

```bash
../WebHolyGrail/scripts/migrate-veo55-to-domain.sh ./<instance-path>
```

It renames legacy `components/` and `blocks/veo55/` into `blocks/domain/<niche>/`, splits Carousel/Separator into directory patterns, moves ContentFrame to `layouts/`, fixes all import paths. After it runs, the regular `sync-template.sh` works as documented above.

This script is **one-time** per migrated instance. New instances created from template don't need it.
