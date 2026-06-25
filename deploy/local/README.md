# Local stack — Docker Compose

`docker-compose.yml` brings up **client** (Next 15 on 3000) and **cms** (Payload on 3001) in one network, with a volume for SQLite and Media.

## Run

```bash
# From the monorepo root
pnpm compose:up
# equivalent to:
infisical run --env=dev -- docker compose -f deploy/local/docker-compose.yml up -d
```

Stop:

```bash
pnpm compose:down
```

Logs:

```bash
pnpm compose:logs
```

## What is inside

| Service  | Port | Image from              | Volume                                        |
| -------- | ---- | ----------------------- | --------------------------------------------- |
| `cms`    | 3001 | `src/cms/Dockerfile`    | `cms_db` (SQLite). Media → S3, no local copy. |
| `client` | 3000 | `src/client/Dockerfile` | —                                             |

Network is a bridge. Client reaches cms by Docker DNS name `cms:3001`, not via `localhost`.

## Healthchecks

- **cms:** `GET /api/access` every 30s (after a 60s `start_period` for the first Next compile).
- **client:** `GET /` every 30s. Depends on `cms: service_healthy` — it will not start until cms is ready.

## Volumes

- `cms_db` — `/data` inside the cms container, holds the SQLite file.
- **Media is not mounted.** The `s3Storage` plugin in `payload.config.ts` sets `disableLocalStorage:true` — uploads go directly to S3 and are served via the CDN domain configured in env. No local copy on the host.

**Backup:** `docker run --rm -v cms_db:/data -v $(pwd):/backup alpine tar czf /backup/cms-db-$(date +%F).tar.gz -C /data .`

**Reset DB** (destructive — wipes all content!):

```bash
pnpm compose:down
docker volume rm cms_db
pnpm compose:up
```

## ENV

Compose expects Infisical to inject:

- `PAYLOAD_SECRET` — required, otherwise compose refuses to start (`:?must be injected via infisical run`)
- `PAYLOAD_PUBLIC_SERVER_URL` (default `http://localhost:3001`)
- `NEXT_PUBLIC_SITE_URL` (default `http://localhost:3000`)
- `DATABASE_URI` is fixed by compose to `file:/data/site.db` (internal path in the volume)
- `NEXT_PUBLIC_CMS_URL` for client is fixed to `http://cms:3001` (Docker DNS)

## Prod variant

See `deploy/prod/` — blue-green deploy with host nginx reverse-proxy and TLS termination, see `deploy/proxy-stack/`.
