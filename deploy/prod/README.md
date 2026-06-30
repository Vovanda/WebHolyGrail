# Production deployment — blue-green via GH Actions

Один путь: **push → GH Actions → build images → GHCR → SSH deploy.sh → blue-green switch**. Никаких локальных билдов, никакого rsync с dev-машины, никаких ручных nginx-конфигов после первого scaffold.

Stack: Payload CMS + Next 15 client, blue-green за shared host-nginx (`/opt/proxy`), self-host Infisical для секретов, MinIO для media (same-origin `/media/` proxy).

## Что есть в этой папке

| Файл                    | Зачем                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `compose.bluegreen.yml` | Per-color compose (blue=3000/3001, green=3010/3011). Запускается через `deploy.sh`, напрямую не дёргать. |
| `deploy.sh`             | Скрипт деплоя на VPS. Вызывается через SSH из GH Actions с `TAG=<sha>`. Идемпотентный pre-flight внутри. |
| `README.md`             | Этот файл.                                                                                               |

## VPS prerequisites (один раз)

1. **Шаред-инфра уже работает** — `holygrail-nginx` контейнер на host-network, certbot via `certbot/certbot:latest`, MinIO на `127.0.0.1:9100`, self-host Infisical. См. `deploy/proxy-stack/` и `deploy/infisical/`.

2. **Per-site setup** — один-shot bootstrap скрипт через SSH (идемпотентный):

   ```bash
   # Локально:
   scp scripts/bootstrap-site-on-vps.sh deploy@<vps>:/tmp/

   ssh deploy@<vps> "SLUG=<slug> \
     REPO=https://github.com/<owner>/<repo>.git \
     INFISICAL_HOST_URL=https://infisical.<your-host> \
     INFISICAL_ADMIN_TOKEN=<admin JWT> \
     INFISICAL_ADMIN_ORG_ID=<org uuid> \
     /tmp/bootstrap-site-on-vps.sh"
   ```

   Скрипт делает: git clone в `/opt/sites/<slug>`, создаёт Infisical project `holygrail-<slug>` + UA machine identity, кладёт client-id/secret в `/etc/infisical/<slug>/`. Идемпотентный — повторный запуск ничего не ломает.

   После него:
   - **DNS A record** `<your-domain> → VPS IP` (у регистратора, вне репо)
   - **Заполнить prod-секреты** в Infisical project через Web UI / CLI (PAYLOAD*SECRET, DATABASE_URI, S3*\*, NEXT_PUBLIC_SITE_URL, …)

3. **GitHub Actions config** — Settings → Secrets and variables → Actions:

   | Тип    | Имя                  | Значение                                                                      |
   | ------ | -------------------- | ----------------------------------------------------------------------------- |
   | secret | `VPS_HOST`           | IP VPS                                                                        |
   | secret | `VPS_SSH_KEY`        | private key для deploy user (хранится в Infisical; см. `whg-infisical` skill) |
   | var    | `VPS_USER`           | `deploy` (optional, default)                                                  |
   | var    | `VPS_PATH`           | `/opt/sites/<slug>`                                                           |
   | var    | `PUBLIC_URL`         | `https://<your-domain>`                                                       |
   | var    | `PRIMARY_DOMAIN`     | `<your-domain>` — для pre-flight (nginx-conf + LE-cert на первом деплое)      |
   | var    | `IMAGE_NAME_PREFIX`  | optional — override базы имени образов (например `whg` для template repo).    |
   |        |                      | Default = repo name lowercased.                                               |
   | var    | `INFISICAL_HOST_URL` | `https://infisical.<your-host>` — shared self-host instance для всех сайтов   |
   | var    | `PORT_BASE`          | optional, default 3000. Per-site: site-1 3000, site-2 3020, site-3 3040, …    |
   |        |                      | Blue = `PORT_BASE`/+1, green = `PORT_BASE`+100/+101.                          |
   | var    | `GHCR_OWNER`         | optional, default `github.repository_owner`                                   |

4. `.github/workflows/deploy.yml` уже active в template — никаких rename'ов не нужно. Downstream получит его как есть.

## Первый деплой

```bash
git push origin main
```

Всё. Дальше:

1. GH Actions билдит cms+client images → push в `ghcr.io/<owner>/<repo>-{cms,client}:<sha>`.
2. SSH на VPS вызывает `deploy.sh <sha>` с env'ом.
3. `deploy.sh` pre-flight: создаёт MinIO bucket `<slug>-media`, генерирует nginx-conf из template (с `/media/` location), выпускает LE-cert через certbot, поднимает inactive color, гоняет healthcheck, прогоняет миграции, переключает nginx upstream symlink.
4. Verify шаг проверяет `$PUBLIC_URL/api/health` отдаёт ожидаемый SHA.

## Regular deploys

То же самое — `git push`. Pre-flight шаги pre-flight идемпотентны (bucket уже есть, nginx-conf уже есть, cert валиден → skip).

## Rollback

```bash
# Re-deploy предыдущий SHA через workflow_dispatch с input tag:
gh workflow run deploy.yml -f tag=<previous-sha>
```

Или ручной:

```bash
ssh deploy@<vps> "TAG=<previous-sha> GHCR_OWNER=<owner> /opt/sites/<slug>/deploy/prod/deploy.sh <previous-sha>"
```

## Backup

- **DB (SQLite)** — bind-mount `/opt/sites/<slug>/src/cms/data`. Backup через `cp` или `sqlite3 .backup`.
- **Media** — в MinIO bucket `<slug>-media`. Через `mc mirror local/<slug>-media s3://offsite-backup/` (offsite TODO).
- **Secrets** — в Infisical, project per site. Export через `infisical secrets export`.

## Troubleshooting

| Symptom                                            | Причина                                                 | Fix                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| GH Actions падает на `Sync site directory` step    | На VPS `/opt/sites/<slug>` не clone'ан или mismatch     | `ssh deploy@<vps> "cd /opt/sites/<slug> && git remote -v"` — проверить                    |
| `pre-flight ... ERROR: PRIMARY_DOMAIN env not set` | GH variable не задана                                   | Settings → variables → `PRIMARY_DOMAIN=<your-domain>`                                     |
| Картинки 404 на `/media/...`                       | Bucket пуст или nginx-conf без `/media/` location       | `docker exec minio mc ls local/<slug>-media`, перепроверь `site.conf.template`            |
| `cms healthcheck failed`                           | Миграции не накатились или env-переменные не подцеплены | `docker logs <slug>-cms-<color>` + `infisical secrets list --env=prod --domain=$HOST_URL` |

## TODO (post-v0.1.0)

- [ ] Off-site backup (rclone S3-mirror)
- [ ] Monitoring (Uptime Kuma minimum)
- [ ] SQLite → Postgres swap path
- [ ] Multi-stage GH workflow (preview env на PR)
