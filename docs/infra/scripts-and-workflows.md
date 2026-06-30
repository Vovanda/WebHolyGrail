# Infra-скрипты и GH-workflow'ы — что есть и как пользоваться

Все компоненты infra-пайплайна Holy Grail. Документ для оператора: какой скрипт за что отвечает, в каком порядке запускать, что во что вызывает.

## Visual: что во что вызывает

```
┌──────────────────────────┐
│ Локальная машина / SSH   │
│                          │
│ scripts/                 │
│  bootstrap-site-on-vps.sh│ ── один-shot per site ──┐
└──────────────────────────┘                         │
                                                     │
┌──────────────────────────┐                         ▼
│ GitHub Actions           │                ┌──────────────────┐
│                          │                │ VPS              │
│ .github/workflows/       │                │                  │
│  ci.yml          ───────►│ typecheck/test │ /opt/sites/<slug>│
│  deploy.yml      ───SSH─►│ build → GHCR   │  ↓ pulled        │
│  template-cleanup.yml    │ → SSH → deploy │ deploy/prod/     │
└──────────────────────────┘                │  deploy.sh ──────│┐
                                            └──────────────────┘│
                                                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ VPS shared infra (один экземпляр на весь VPS)                    │
│                                                                  │
│ /opt/proxy/      holygrail-nginx + certbot/certbot (per-domain LE)│
│ /opt/infisical/  self-host Infisical (api + postgres + redis)    │
│ /opt/minio/      MinIO (bucket per site: <slug>-media)           │
│                                                                  │
│ Per-site (создаётся bootstrap-site-on-vps.sh):                   │
│ /opt/sites/<slug>/         git clone <repo>                      │
│ /etc/infisical/<slug>/     {client-id, client-secret} chmod 600  │
└──────────────────────────────────────────────────────────────────┘
```

## GitHub Actions workflows (`.github/workflows/`)

### `ci.yml` — typecheck + test on PR

Запускается на push в main и pull_request. Бежит `pnpm -r lint` (= `tsc --noEmit`) и `pnpm -r test` (vitest with `--passWithNoTests`). Не трогает VPS. Цель — поймать TS-ошибки до merge.

### `deploy.yml` — build + blue-green deploy

**Универсальный** (один для template repo и для downstream-инстансов). Триггерится на push в main и `workflow_dispatch`. Конкретику задают GH vars/secrets (см. ниже).

**Build job:**

1. Checkout
2. Login GHCR (через `GITHUB_TOKEN`)
3. `docker build` cms + client из `src/{cms,client}/Dockerfile`
4. Push в `ghcr.io/<owner>/<image-prefix>-{cms,client}:<sha>` + `:latest`

**Deploy job (depends on build):**

1. SSH agent с приватным ключом из `secrets.VPS_SSH_KEY`
2. На VPS: `cd $VPS_PATH && git fetch + reset --hard origin/main`
3. На VPS: вызов `$VPS_PATH/deploy/prod/deploy.sh <sha>` с env (`GHCR_OWNER`, `PRIMARY_DOMAIN`, `INFISICAL_HOST_URL`, `PORT_BASE`)
4. Verify: `curl $PUBLIC_URL/api/health` → проверка что отдаваемый SHA совпадает с задеплоенным

**Required GH vars/secrets** (Settings → Secrets and variables → Actions):

| Тип    | Имя                  | Назначение                                                               |
| ------ | -------------------- | ------------------------------------------------------------------------ |
| secret | `VPS_HOST`           | IP VPS                                                                   |
| secret | `VPS_SSH_KEY`        | SSH private key для deploy user (dedicated per repo, не личный)          |
| var    | `VPS_USER`           | `deploy` (optional, default)                                             |
| var    | `VPS_PATH`           | `/opt/sites/<slug>`                                                      |
| var    | `PUBLIC_URL`         | `https://<your-domain>`                                                  |
| var    | `PRIMARY_DOMAIN`     | `<your-domain>` — для pre-flight в deploy.sh (nginx-conf + LE-cert)      |
| var    | `INFISICAL_HOST_URL` | `https://infisical.<your-host>` — shared self-host instance              |
| var    | `IMAGE_NAME_PREFIX`  | optional — override базы имени образов (например `whg` вместо repo-name) |
| var    | `PORT_BASE`          | optional, default 3000. Per-site: 3000 / 3020 / 3040 / …                 |
| var    | `GHCR_OWNER`         | optional, default `github.repository_owner`                              |

### `template-cleanup.yml` — only for downstream

Активируется когда репо склонирован через "Use this template" из `Vovanda/WebHolyGrail`. Если первая строка README — `# Web Holy Grail`, переписывает на минимальный шаблон с именем нового репо. Удаляет сам себя. В upstream WHG `if: github.repository != 'Vovanda/WebHolyGrail'` — никогда не запускается.

## Scripts (`scripts/`)

### `bootstrap-site-on-vps.sh` — один-shot setup нового сайта

Идемпотентный bootstrap. Запускается через SSH под `deploy` user, **до** первого `git push` инстанса.

Делает:

1. `/opt/sites/<slug>`: создаёт dir + `git init` + remote add + `git fetch --depth 50` + `reset --hard origin/main`
2. Infisical: создаёт project `holygrail-<slug>` через self-host REST (через admin JWT)
3. Infisical: создаёт UA machine identity `<slug>-deploy`, attaches к project (role `member`), генерирует Universal Auth method + client-secret
4. `/etc/infisical/<slug>/{client-id,client-secret}`: chmod 600 deploy:deploy

После него — заполнить prod-секреты в Infisical project через Web UI или CLI, потом `git push` → workflow `deploy.yml` всё доделывает сам.

**Запуск:**

```bash
scp scripts/bootstrap-site-on-vps.sh deploy@<vps>:/tmp/
ssh deploy@<vps> "SLUG=<slug> \
  REPO=https://github.com/<owner>/<repo>.git \
  INFISICAL_HOST_URL=https://infisical.<your-host> \
  INFISICAL_ADMIN_TOKEN=<JWT из /opt/infisical/.bootstrap.json> \
  INFISICAL_ADMIN_ORG_ID=<org uuid> \
  /tmp/bootstrap-site-on-vps.sh"
```

### `deploy/prod/deploy.sh` — blue-green deploy

Запускается на VPS **только из** `deploy.yml` workflow (вручную дёргать не нужно).

Шаги:

1. **Infisical login** через UA creds из `/etc/infisical/<slug>/` → JWT
2. **Idempotency check** — если запрошенный SHA уже на active color, skip
3. **Pre-flight ensure-site-infra** (идемпотентно):
   - MinIO bucket `<slug>-media`
   - nginx upstream snippets `<slug>-upstream-{blue,green}.conf` (с per-color portами из `PORT_BASE`)
   - nginx site vhost `${PRIMARY_DOMAIN}.conf` из `deploy/proxy-stack/.../site.conf.template`
   - LE-cert через `certbot/certbot:latest certonly --webroot` (если ещё нет)
4. **Pull** images для inactive color
5. **Up** inactive color через `compose.bluegreen.yml`
6. **Healthcheck loop** 60s (cms + client)
7. **Apply migrations** через `docker exec ... pnpm migrate`
8. **Switch nginx upstream** symlink → inactive → reload
9. **Save** active color в `ACTIVE_COLOR` файл
10. **Stop** old color (5s grace)
11. **Cleanup** unused images / containers / buildx cache

Per-color порты:

- blue: `PORT_BASE` (client), `PORT_BASE+1` (cms)
- green: `PORT_BASE+100` (client), `PORT_BASE+101` (cms)

Per-site offset 20: site-1 `PORT_BASE=3000`, site-2 `=3020`, site-3 `=3040`, …

### `scripts/setup-infisical.ts` — Infisical project setup от dev-machine

Альтернатива `bootstrap-site-on-vps.sh` для шага Infisical project + UA — но запускается **с локальной dev машины**, не на VPS. Используется когда удобнее настроить Infisical отдельно (например, project уже есть, нужно только новую UA identity).

**Запуск:**

```bash
pnpm setup-infisical -- --site <slug> --type <minimal|business-card|blog|portal>
```

Env:

- `INFISICAL_HOST_URL`
- `INFISICAL_ADMIN_TOKEN` (или `INFISICAL_ADMIN_CLIENT_ID` + `INFISICAL_ADMIN_CLIENT_SECRET`)
- `INFISICAL_ADMIN_ORG_ID`

## nginx templates (`deploy/proxy-stack/nginx/`)

### `conf.d/site.conf.template`

Generic per-domain vhost. Плейсхолдеры:

- `<PRIMARY_DOMAIN>` → основной домен (`whg.sawking.tech`)
- `<SITE_SLUG>` → slug сайта (`whg`)

Содержит:

- HTTP (80) → ACME challenge + 301 на HTTPS
- HTTPS (443) www → apex redirect
- HTTPS (443) основной vhost: `/admin`/`/api`/`/_payload` → cms upstream, `/media/` → MinIO bucket `<SITE_SLUG>-media` через host loopback (`127.0.0.1:9100`), `/_next/` смарт-routing (Referer-based) к cms-или-client, `/` → client upstream

deploy.sh `sed`-замещает плейсхолдеры при первом запуске и кладёт в `/opt/proxy/nginx/conf.d/${PRIMARY_DOMAIN}.conf`.

### `snippets/site-upstream-{blue,green}.conf.template`

Per-color upstream definitions. Плейсхолдеры:

- `<SITE_SLUG>` → slug
- `<CMS_PORT>` / `<CLIENT_PORT>` → подставляются из `PORT_BASE` per-color

deploy.sh генерирует два файла (`<slug>-upstream-blue.conf`, `<slug>-upstream-green.conf`) + symlink `<slug>-upstream-active.conf` → активный color. Switch = `ln -sf` + nginx reload.

### `snippets/{ssl-modern,security-headers,proxy-upstream}.conf`

Готовые блоки настроек, инклудятся в `site.conf.template`. Без плейсхолдеров — generic для всех сайтов.

## Compose-файлы

### `deploy/prod/compose.bluegreen.yml`

Per-color стек: cms (Payload + Next admin) + client (Next public). Запускается через `deploy.sh` с env: `SITE_SLUG`, `COLOR`, `CMS_PORT`, `CLIENT_PORT`, `TAG`. Images из GHCR (`${IMAGE_REGISTRY}/${IMAGE_OWNER}/${IMAGE_NAME_PREFIX}-{cms,client}:${TAG}`).

Volumes:

- `../../src/cms/data:/data` — SQLite bind-mount (общий между blue/green)
- nginx upstream symlink на host управляет которым color виден извне

### `deploy/infisical/docker-compose.yml`

Self-host Infisical stack: `infisical/infisical:v0.161.x` + `postgres:16` + `redis:7`. Один на весь VPS. Поднимается один раз вручную:

```bash
cd /opt/infisical && docker compose up -d
docker exec -it infisical-api node /app/dist/scripts/bootstrap-instance.mjs
```

Bootstrap создаёт первого superadmin user + admin identity. Token сохраняется в `/opt/infisical/.bootstrap.json`.

### `deploy/proxy-stack/docker-compose.yml`

Shared host-nginx (`holygrail-nginx`) для всех сайтов на VPS. Host-network mode (видит `127.0.0.1:<port>` контейнеров сайтов). Bind-mounts:

- `/opt/proxy/nginx/conf.d` → `/etc/nginx/conf.d`
- `/opt/proxy/nginx/snippets` → `/etc/nginx/snippets`
- `/opt/proxy/nginx/webroot` → `/var/www/certbot` (ACME challenge)
- `/opt/proxy/certs` → `/etc/letsencrypt` (LE certs)

## Когда что запускать

### Сценарий A: Новый Holy Grail инстанс с нуля

1. `gh repo create <owner>/<repo> --template Vovanda/WebHolyGrail --private --clone`
2. Локально: `cd <repo>` → переписать README / поднастроить под свой проект → `git push`
3. **`template-cleanup.yml`** на первом push'е автоматом причешет README
4. DNS A record `<your-domain> → VPS IP` (у регистратора)
5. SSH bootstrap (см. README раздел "Per-site setup")
6. Заполнить prod-секреты в Infisical project
7. Настроить GH vars/secrets для repo (`PRIMARY_DOMAIN`, `PORT_BASE`, etc — см. `deploy.yml` шапку)
8. `git push origin main` → `deploy.yml` сам всё доделает

### Сценарий B: Обычный регулярный деплой

```bash
git push origin main
```

Всё. `ci.yml` гоняет typecheck/test, `deploy.yml` гоняет build → GHCR → SSH → deploy.sh → blue-green switch. Pre-flight шаги в deploy.sh идемпотентны: bucket/conf/cert уже есть → skip.

### Сценарий C: Rollback к предыдущему SHA

```bash
gh workflow run deploy.yml -f tag=<previous-sha>
```

Или ручной:

```bash
ssh deploy@<vps> "TAG=<previous-sha> GHCR_OWNER=<owner> \
  /opt/sites/<slug>/deploy/prod/deploy.sh <previous-sha>"
```

deploy.sh подтянет старые images из GHCR + переключит nginx обратно. Миграции назад **не катит** (forward-only) — для downgrade нужен custom rollback path (см. `whg-payload-migration` skill).

## Troubleshooting

| Симптом                                            | Причина                                                 | Что делать                                                                                |
| -------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| GH workflow падает на `Sync site directory` step   | `/opt/sites/<slug>` не git-репо или mismatch remote     | `ssh deploy@<vps> "cd /opt/sites/<slug> && git remote -v"` или запустить bootstrap script |
| `pre-flight ... ERROR: PRIMARY_DOMAIN env not set` | GH variable не задана                                   | Settings → variables → `PRIMARY_DOMAIN=<your-domain>`                                     |
| `infisical login returned empty token`             | UA creds в `/etc/infisical/<slug>/` отсутствуют         | Запустить `bootstrap-site-on-vps.sh` для этого сайта                                      |
| Картинки 404 на `/media/...`                       | Bucket пуст или nginx-conf без `/media/` location       | `docker exec minio mc ls local/<slug>-media`, перепроверь `${PRIMARY_DOMAIN}.conf`        |
| cms healthcheck failed                             | Миграции не накатились или env-переменные не подцеплены | `docker logs <slug>-cms-<color>` + `infisical secrets list --env=prod --domain=$HOST_URL` |
| Port conflict (Bind for 127.0.0.1:30XX failed)     | Два сайта с одинаковым `PORT_BASE`                      | Установить разные `PORT_BASE` (3000 / 3020 / 3040)                                        |
| nginx test fails after cert renewal                | LE renew успел до того как deploy.sh кладёт vhost       | `docker exec holygrail-nginx nginx -t` и читать конкретную ошибку; обычно про missing key |

## Дальше

- `deploy/prod/README.md` — короткий quickstart для разработчика (минимум деталей)
- `docs/whg/37-scaffolding.md` — пользовательский гайд по созданию нового инстанса
- `.claude/skills/whg-infisical/` — workflow секретов
- `.claude/skills/whg-payload-migration/` — blue-green safety для миграций
