# Scaffolding a new site

> One command on GitHub, one on the shell, two on Infisical. ~30 minutes from zero to dev stack running.

## Project type

Holy Grail supports several project types. The type defines which collections, blocks, routes, and seed data are bootstrapped on top of the generic minimum:

| Type            | Status       | What you get                                                                                                                                                  |
| --------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`       | ✅ available | Generic Pages/Media/Users/FormSubmissions/ReusableBlocks + initial admin user + empty home page. Build the rest in admin or extend `blocks/domain/` yourself. |
| `business-card` | 🔜 roadmap   | + Pages presets (home/about/contacts/services), ContactsBlock, ServicesGrid, working contact form                                                             |
| `blog`          | 🔜 roadmap   | + active Posts/Comments, `/blog` routes, `blocks/domain/blog/` (PostCard/PostList/PostContent), RSS, sample post                                              |
| `portal`        | 🔜 roadmap   | + Customer Users (auth + roles separate from admin), `/login`/`/signup`/`/dashboard` routes, `blocks/domain/portal/`, email integration                       |

Choose type at scaffold time (`--type <name>`). Default — `minimal`.

Codebase is structured to accept the additional types without rewrites:

- `scripts/seeds/<type>/index.ts` — type-specific seed pipeline (idempotent, Payload Local API).
- `migrations/` files prefixed by type (`10000_business-card_*`, `11000_blog_*`, `20000_portal_*`) apply on demand.
- `blocks/domain/<type>/` directories copied conditionally by scaffold.

Existing types you build for an instance live as `blocks/domain/<niche>/` regardless — the project type is just the **starting** configuration. Your real growth happens via domain layer.

## Create the instance repo

```bash
# Option A — GitHub UI: open https://github.com/Vovanda/WebHolyGrail → "Use this template" → Private
# Option B — gh CLI:
gh repo create <owner>/<my-site> --template Vovanda/WebHolyGrail --private --clone
cd <my-site>
```

Holy Grail instances are **always private** by default — they contain client/business logic, infrastructure endpoints, and content that shouldn't be public. Public is an explicit opt-in.

The repo arrives with the full Holy Grail skeleton at the root — no folder to unpack.

## Local install

```bash
pnpm install
```

Installs `client`, `cms`, `contracts` workspaces.

## Bootstrap secrets via Infisical

Holy Grail uses **self-host Infisical** for all secrets — no `.env.production` files on the VPS, no committed `.env`. See [`whg-infisical` skill](../../.claude/skills/whg-infisical/SKILL.md) for the full workflow.

Prerequisites (one-time per Infisical instance, not per site):

1. **Self-host Infisical on VPS** — `deploy/infisical/docker-compose.yml` (Postgres + Redis + infisical-api on `127.0.0.1:8080`), reverse-proxy via nginx on `https://infisical.<canonical>`.
2. **Bootstrap the instance** via CLI on VPS (no UI clicks):
   ```bash
   ssh deploy@<vps> '~/.local/bin/infisical bootstrap \
     --domain=http://localhost:8080 \
     --email=<your-admin@email> \
     --password="<save this>" \
     --organization=<org-name> \
     --output=json' > /tmp/infi-bootstrap.json
   ```
   Output gives you `identity.credentials.token` (admin JWT, TTL ~90d) + admin user email/password. **Save the password** — Infisical has no built-in admin password reset; losing it requires destroy/recreate of the instance.
3. **Put admin JWT in your shell env** for scaffold scripts:
   ```bash
   export INFISICAL_HOST_URL=https://infisical.<canonical>
   export INFISICAL_ADMIN_TOKEN=<JWT from bootstrap>
   export INFISICAL_ADMIN_ORG_ID=<from bootstrap>
   ```

After that, every per-site scaffold is fully automated through REST API — no more UI clicks.

CLI install on VPS (without sudo/apt):

```bash
ssh deploy@<vps> 'mkdir -p ~/.local/bin && cd /tmp && \
  wget -q "https://github.com/Infisical/cli/releases/download/v0.43.98/cli_0.43.98_linux_amd64.tar.gz" -O inf.tgz && \
  tar -xzf inf.tgz infisical && mv infisical ~/.local/bin/ && chmod +x ~/.local/bin/infisical && rm inf.tgz'
```

Bootstrap the project for this site:

```bash
pnpm setup-infisical -- --site <slug> [--type minimal]
```

What the script does (8 steps, fully automated via REST):

1. Log in as the admin identity using the env credentials.
2. Create Infisical project `holygrail-<slug>`.
3. Create 3 environments: `dev`, `staging`, `prod`.
4. Seed empty placeholder secrets (PAYLOAD*SECRET, DATABASE_URI, S3*_, NEXT*PUBLIC*_, VK\_\*).
5. Create service machine identity `<slug>-prod-deploy` (Universal Auth, scoped to prod).
6. Attach Universal Auth config to the service identity.
7. Generate Client Secret for the service identity — printed to console (one-time only, save it!).
8. Write `.infisical.json` (workspace marker, `defaultEnvironment: dev`) — commit it.

**After the script** — promote the new UA identity role from `no-access` to `viewer` (script defaults to no-access; without viewer the deploy will fail with `403 You are not allowed to describeSecret`):

```bash
curl -X PATCH "$INFISICAL_HOST_URL/api/v2/workspace/<projectId>/identity-memberships/<identityId>" \
  -H "Authorization: Bearer $INFISICAL_ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"roles":[{"role":"viewer","isTemporary":false}]}'
```

The printed Client ID, Client Secret, and Project ID are what you put on the production VPS for `deploy/prod/deploy.sh`. See deploy section below.

Migration path from old setup: if your instance was scaffolded before this REST automation existed, the manual UI steps still work (create service identity, get credentials by hand). Both paths land at the same outcome.

## Secrets for dev

`./dev-setup.sh` automatically sets reasonable defaults in your Infisical dev environment if they're empty:

- `PAYLOAD_SECRET` — generated (32 random bytes hex)
- `DATABASE_URI` — `file:./data/site.db` (SQLite)
- `NEXT_PUBLIC_CMS_URL`, `NEXT_PUBLIC_SITE_URL`, `PAYLOAD_PUBLIC_SERVER_URL` — localhost
- **`S3_*` — pointing at the local MinIO container** (bucket `local-media`, `minioadmin/minioadmin`)

You don't have to set them by hand. If you want different values — edit them in the Infisical UI or `infisical secrets set --env=dev KEY=value` overrides them.

## Storage: S3 only, no local-disk fallback

Holy Grail uses **S3-compatible storage from day 1** — dev and prod both. This avoids the painful "we used local-disk and now we need to migrate to S3" path.

- **Dev:** MinIO in Docker (auto-started by `dev-setup.sh`). Bucket `local-media`, exposed on `localhost:9000` (API) and `localhost:9001` (web console).
- **Prod:** any S3-compatible provider — Backblaze B2 (free 10GB), Cloudflare R2 (free 10GB), AWS S3, MinIO Cloud, VK Cloud, Yandex Object Storage.

If `S3_BUCKET` is empty when Payload boots, it **fails loud** with a clear message — no silent local-disk fallback that bites you later.

If you really need to skip Docker / MinIO for a quick local test — set `S3_*` to a free Backblaze B2 or Cloudflare R2 bucket; same env-shape, no code change.

## Start the dev stack

```bash
./dev-setup.sh                # first time only — verify CLI, init project link
./dev.sh                      # infisical run --env=dev --recursive -- pnpm dev
```

You should see:

- CMS → http://localhost:3001 (Payload admin at `/admin`)
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

See `deploy/prod/README.md` for the first-launch checklist.

Quick summary:

- Push instance to GitHub.
- VPS — install Docker + Infisical CLI (user-space binary, see prereqs above) + `/etc/infisical/<slug>/{client-id,client-secret,project-id}` (chmod 600 deploy:deploy). **Three files**, not two — without `project-id`, `infisical run --token=...` fails with `Project ID is required when using machine identity`.
- Before first deploy, ensure all `${VAR:?required}` from `deploy/prod/compose.bluegreen.yml` are **non-empty** in Infisical prod env (Infisical interpolation passes empty strings through, breaking compose). Override defaults from `setup-infisical.ts` seed via UI or REST.
- GitHub Actions deploy workflow — already wired in template (`.github/workflows/deploy.yml` if you ship one) or run `deploy/prod/deploy.sh <tag>` manually first time.

### Troubleshooting / disaster recovery

- **Forgot admin UI password** + SMTP not configured → no recovery path through forgot-password. Workaround: full **destroy/recreate** workflow (backup secrets via REST → `docker compose down` + `docker volume rm` postgres → fresh bootstrap → re-run setup-infisical for each site → restore secrets). Detailed steps: [`whg-infisical` skill — Destroy/recreate workflow](../../.claude/skills/whg-infisical/SKILL.md#destroyrecreate-workflow-когда-нужен-полный-reset).
- **OAuth / SMTP / forgot-password не работают** — Infisical не угадывает endpoints, требуется явная конфигурация. Список env vars: см. SKILL.md секция «UI features требующие env config».

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

`sync-template.sh` only touches the generic whitelist — your `blocks/domain/`, domain collections, migrations, and `site.config`-equivalent stay intact. Full details: [`whg-template-sync` skill](../../.claude/skills/whg-template-sync/SKILL.md).

## Migrating a pre-template site

If you have a site built on an older Holy Grail layout (e.g. `components/dog/`, `blocks/veo55/`, `lib/dog-profile/`), run the one-shot migration once:

```bash
../WebHolyGrail/scripts/migrate-veo55-to-domain.sh ./<instance-path>
```

It renames legacy `components/` and `blocks/veo55/` into `blocks/domain/<niche>/`, splits Carousel/Separator into directory patterns, moves ContentFrame to `layouts/`, fixes all import paths. After it runs, the regular `sync-template.sh` works as documented above.

This script is **one-time** per migrated instance. New instances created from template don't need it.
