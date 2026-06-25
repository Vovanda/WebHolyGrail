# Production deployment

Stack: Payload CMS (3001) + Next 15 client (3000) + host nginx reverse-proxy + certbot.
DB: SQLite (named volume) by default, swap to Postgres when needed.
Media: S3-compatible storage (any provider — AWS S3, Backblaze B2, Cloudflare R2, MinIO, etc.).

## First deploy

### 0. Prepare the VPS

```bash
# Any Ubuntu 22.04+ / Debian 12 with at least 2 GB RAM, 20 GB SSD.
apt update && apt install -y curl ca-certificates rsync

# Docker + compose plugin
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Infisical CLI (for secrets)
curl -fsSL https://artifacts-cli.infisical.com/install.sh | sh

# DNS: A record @ and www → VPS IP (wait for provider TTL, 5–60 min)
dig +short <your-domain>
```

### 1. Initial sync

From the local machine:

```bash
# rsync the code (no node_modules, no data)
VPS_HOST=root@<your-domain> ./deploy/prod/deploy.sh
```

### 2. Setup Infisical (on the server)

```bash
ssh root@<your-domain>
cd /srv/<site-slug>

# Log in to Infisical Cloud (opens a browser on the dev machine)
infisical login

# Link to the project
infisical init   # select your workspace

# Fill secrets (one-time)
infisical secrets set PAYLOAD_SECRET=$(openssl rand -hex 32) --env=prod
infisical secrets set S3_ACCESS_KEY_ID=... --env=prod
# … the rest
```

**Alternative** — without Infisical, via `.env.production`:

```bash
cp deploy/prod/.env.production.example \
   deploy/prod/.env.production
nano deploy/prod/.env.production   # fill all values
```

### 3. Obtain TLS certificates (certbot)

TLS termination is handled by the host nginx in `deploy/proxy-stack/`. See that directory's docs for the certbot webroot flow. Per-site vhost goes into `deploy/proxy-stack/nginx/conf.d/<your-domain>.conf` (use `site.conf.template` as a starting point).

### 4. Start the full stack

```bash
# Option A — via Infisical (recommended):
cd /srv/<site-slug>
infisical run --env=prod -- docker compose \
  -f deploy/prod/docker-compose.yml up -d --build

# Option B — via .env.production file:
docker compose --env-file deploy/prod/.env.production \
  -f deploy/prod/docker-compose.yml up -d --build

# Apply DB migrations
docker exec ${SITE_SLUG}-cms pnpm --filter cms migrate

# Smoke
curl -I https://<your-domain>/
curl -I https://<your-domain>/admin
```

### 5. Bootstrap admin user

On first start Payload creates the first admin user if the `users` collection is empty — using `ADMIN_INITIAL_EMAIL` and `ADMIN_INITIAL_PASSWORD` from env. Change the password in `/admin/account` after the first login.

## Regular deploys

Use blue-green: see `compose.bluegreen.yml` and `deploy.sh`. The script:

1. `rsync` fresh code
2. `docker compose up -d --build` (new images)
3. `pnpm migrate` (apply new migrations)
4. Smoke check `/`, `/admin`, `/api/health`
5. Swap nginx upstream from old colour to new

## Rollback

```bash
ssh root@<your-domain>
cd /srv/<site-slug>

# Content lives in DB and S3, untouched by rsync.
# Code — git history.
git log --oneline -5
git checkout <commit-sha>

# Re-apply migrations if needed
docker compose -f deploy/prod/docker-compose.yml restart cms
docker exec ${SITE_SLUG}-cms pnpm --filter cms migrate
```

## Backup DB and Media

```bash
# SQLite — a single file
ssh root@<your-domain> "docker run --rm -v ${SITE_SLUG}_db:/data alpine \
  tar czf - /data" > backup-$(date +%Y%m%d).tar.gz

# Media is in S3 — your provider handles redundancy; for extra safety:
# rclone sync s3://<bucket> ./backup/media/
```

## Troubleshooting

| Symptom                                       | Cause                      | Fix                                                                     |
| --------------------------------------------- | -------------------------- | ----------------------------------------------------------------------- |
| `502 Bad Gateway` from nginx                  | client / cms did not start | `docker compose logs cms client`                                        |
| `cms` crashes on start — `no such table: ...` | migrations not applied     | `docker exec ${SITE_SLUG}-cms pnpm --filter cms migrate`                |
| Certificate expired                           | certbot did not renew      | check `docker logs certbot`, manual `docker exec certbot certbot renew` |

## TODO before fully prod-ready

- [ ] Swap SQLite → Postgres when traffic grows
- [ ] Off-site backup (rclone / object-storage replication)
- [ ] Monitoring (Prometheus + Grafana or Uptime Kuma at minimum)
- [ ] Logs shipping (Loki / Datadog)
- [ ] CI/CD GitHub Actions: build → push registry → SSH deploy (instead of local rsync + build)
