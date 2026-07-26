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

## Secrets for prod

Unlike dev, **nothing fills prod for you**. The scaffold seeds empty placeholders, and an empty value is not a missing key — `deploy.sh` fetches all of them and then `compose` stops at the first required one (`S3_BUCKET is missing a value`). Fill them in one run:

```bash
pnpm setup-infisical -- --site <slug> --from-env .env.production --env prod
```

The script upserts every non-empty `KEY=VALUE` from the file and prints which keys are still empty. Required by `compose.bluegreen.yml` (declared with `:?`, so the stack refuses to start without them):

| Key                         | Note                                                           |
| --------------------------- | -------------------------------------------------------------- |
| `PAYLOAD_SECRET`            | 32 random bytes hex; changing it invalidates existing sessions |
| `PAYLOAD_PUBLIC_SERVER_URL` | `https://<your-domain>`                                        |
| `NEXT_PUBLIC_SITE_URL`      | `https://<your-domain>`                                        |
| `ADMIN_INITIAL_EMAIL`       | first admin login                                              |
| `ADMIN_INITIAL_PASSWORD`    | first admin login                                              |

The rest (`DATABASE_URI`, `S3_*`, `SITE_NAME`, `NEXT_PUBLIC_CMS_URL`) is not gated by compose but the app needs it. `NEXT_PUBLIC_YM_ID` is optional — leaving it empty is fine.

Don't rely on filling these through the Web UI: on a fresh self-host the superadmin password exists only in the bootstrap output, and Infisical has no built-in reset.

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
- Fill prod secrets — see [Secrets for prod](#secrets-for-prod) above. Empty is not missing: Infisical passes empty strings through and compose dies on the first `${VAR:?required}`.
- **Repository vars and secrets — the step everyone misses.** `deploy.yml` ships with the template, but GitHub does not copy environment variables of a template repo. A fresh instance has none, so the workflow dies in ~4 seconds on `The ssh-private-key argument is empty` — after a green build, which makes it look like a deploy problem rather than a config one.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/ci-<slug> -N "" -C "gh-actions@<slug>"
ssh-copy-id -f -i ~/.ssh/ci-<slug>.pub deploy@<vps-host>   # -f is required, see note below

gh secret   set VPS_HOST           --body "<vps-ip>"
gh secret   set VPS_SSH_KEY        < ~/.ssh/ci-<slug>
gh variable set VPS_USER           --body "deploy"
gh variable set VPS_PATH           --body "/opt/sites/<slug>"
gh variable set PUBLIC_URL         --body "https://<your-domain>"
gh variable set PRIMARY_DOMAIN     --body "<your-domain>"
gh variable set INFISICAL_HOST_URL --body "https://infisical.<your-host>"
gh variable set PORT_BASE          --body "3020"    # 3000 / 3020 / 3040 — one slot per site

gh variable list && gh secret list   # both must be non-empty
```

Use a per-site CI key, not your personal one. `ssh-copy-id` needs `-f`: without it, it verifies by logging in with whatever key your `~/.ssh/config` offers, succeeds with the wrong one, and reports the new key as already installed.

- Scripts must stay executable. `deploy/prod/deploy.sh` is `100755` in the template; if it lands as `100644` (which is what git records on Windows), the deploy reaches the last step and fails with `exit 126 — found but not executable`. Fix: `git update-index --chmod=+x deploy/prod/deploy.sh`. Syncing from template ≥ 2026-07-26 restores the bit automatically.

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
