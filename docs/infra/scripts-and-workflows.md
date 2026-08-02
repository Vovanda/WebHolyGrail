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
│ /etc/infisical/<slug>/  {client-id,client-secret,project-id} 600 │
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
| var    | `EXTRA_DOMAINS`      | optional — доп. домены сайта через запятую (см. ниже)                    |
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
4. `/etc/infisical/<slug>/{client-id,client-secret,project-id}`: chmod 600 deploy:deploy.
   Файла именно три — без `project-id` UA-логин в deploy.sh падает с
   «Project ID is required when using machine identity»

После него — залить значения секретов (`setup-infisical --from-env`) и завести переменные репозитория (Сценарий A шаг 5), потом `git push`.

**Запуск:**

```bash
scp scripts/bootstrap-site-on-vps.sh deploy@<vps>:/tmp/
ssh deploy@<vps> "SLUG=<slug> \
  REPO=github-<slug>:<owner>/<repo>.git \
  INFISICAL_HOST_URL=https://infisical.<your-host> \
  INFISICAL_ADMIN_TOKEN=<JWT: bootstrap-output или UA-логин админской identity> \
  INFISICAL_ADMIN_ORG_ID=<org uuid> \
  /tmp/bootstrap-site-on-vps.sh"
```

### `deploy/prod/deploy.sh` — blue-green deploy

Запускается на VPS **только из** `deploy.yml` workflow (вручную дёргать не нужно).

Шаги:

1. **Infisical login** через UA creds из `/etc/infisical/<slug>/` → JWT
2. **Idempotency check** — если запрошенный SHA уже на active color, skip
3. **Pre-flight ensure-site-infra** (идемпотентно):
   - проверка, что порты `PORT_BASE`/`PORT_BASE+1` не заняты контейнером другого сайта
   - MinIO bucket `<slug>-media`
   - nginx upstream snippets `<slug>-upstream-{blue,green}.conf` (с per-color portами из `PORT_BASE`)
   - nginx site vhost `${SITE_SLUG}.conf` из `deploy/proxy-stack/.../site.conf.template`
     (сайты, заведённые раньше, остаются на своём файле `${PRIMARY_DOMAIN}.conf`)
   - LE-cert через `certbot/certbot:latest certonly --webroot` — только на резолвящиеся домены
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
Свободную базу выбирает тот, кто ставит сайт — deploy.sh только предупреждает о занятом порте,
чтобы вместо `bind: address already in use` из недр compose было видно имя чужого контейнера.

#### Несколько доменов на сайт

Штатный сценарий: сайт нужно запустить **до** того, как доедет DNS основного домена (покупка,
смена NS, пропагация). Тогда основным сразу ставится целевой домен, а рабочим — временный:

```
PRIMARY_DOMAIN=example.com          # canonical, на него смотрит PUBLIC_URL
EXTRA_DOMAINS=site.temp-host.tld    # через запятую, если их несколько
```

Что делает deploy.sh:

- слушает **все** домены сразу (`server_name` = primary + extra);
- выпускает серт только на те, что уже резолвятся; остальные пропускает с предупреждением
  и добирает на следующем деплое через `--expand` — без ручных шагов;
- если не резолвится ни один — сайт поднимается по `http://`, деплой не падает;
- HTTP→HTTPS редиректит на тот же host, а не на primary, иначе временный домен уводил бы
  на ещё-не-работающий основной;
- lineage серта называется по слагу сайта (`--cert-name <slug>`), поэтому смена основного
  домена не рвёт пути внутри vhost.

Verify-шаг в `deploy.yml` тоже перебирает домены: если основной ещё не резолвится, проверка
SHA идёт по временному, и успешный деплой не красится в fail.

### `scripts/setup-infisical.ts` — Infisical project setup от dev-machine

Альтернатива `bootstrap-site-on-vps.sh` для шага Infisical project + UA — но запускается **с локальной dev машины**, не на VPS. Используется когда удобнее настроить Infisical отдельно (например, project уже есть, нужно только новую UA identity).

**Запуск:**

```bash
# структура: project + envs + UA identity + пустые placeholder-секреты
pnpm setup-infisical -- --site <slug> --type <minimal|business-card|blog|portal>

# значения секретов в конкретный env (идемпотентно, повторный прогон безопасен)
pnpm setup-infisical -- --site <slug> --from-env .env.production --env prod
```

`--from-env` читает `KEY=VALUE` как `docker compose --env-file`: без подстановок и multiline, кавычки снимаются. Пустые значения пропускаются. В конце печатает ключи, оставшиеся пустыми.

Заполнять через Web UI не рассчитывай: на свежем self-host пароль superadmin есть только в bootstrap-выводе.

Env:

- `INFISICAL_HOST_URL`
- `INFISICAL_ADMIN_TOKEN` (или `INFISICAL_ADMIN_CLIENT_ID` + `INFISICAL_ADMIN_CLIENT_SECRET`)
- `INFISICAL_ADMIN_ORG_ID`

Предпочитать UA-пару `CLIENT_ID`/`CLIENT_SECRET`: токен из `infisical bootstrap` живёт ~90 дней и умирает при пересоздании identity (`401 Cannot renew revoked or unknown access token`).

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

Порядок важен: первый `git push` запускает `deploy.yml`, поэтому VPS и переменные репозитория
должны быть готовы **до** него. Иначе первый запуск гарантированно красный.

1. `gh repo create <owner>/<repo> --template Vovanda/WebHolyGrail --private --clone`
   (`template-cleanup.yml` сам причешет README и удалит себя — отдельный коммит для этого не нужен)
2. DNS A record `<your-domain> → VPS IP` (у регистратора). Домен ещё не доехал — не ждём,
   см. [несколько доменов на сайт](#несколько-доменов-на-сайт)
3. **Deploy key, если репозиторий приватный** — иначе VPS не сможет его склонировать:

   ```bash
   # на VPS: ключ + SSH-alias
   ssh <vps> 'ssh-keygen -t ed25519 -f ~/.ssh/<slug>_deploy -N "" -q
     printf "\nHost github-<slug>\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/<slug>_deploy\n  IdentitiesOnly yes\n  StrictHostKeyChecking accept-new\n" >> ~/.ssh/config
     cat ~/.ssh/<slug>_deploy.pub'

   # локально: отдать публичный ключ репозиторию (read-only достаточно)
   gh repo deploy-key add <pubkey-file> --repo <owner>/<repo> --title vps-deploy
   ```

   Дальше `REPO=github-<slug>:<owner>/<repo>.git` — именно в таком виде его ждёт bootstrap.

4. VPS-часть — `scripts/bootstrap-site-on-vps.sh`: клон в `/opt/sites/<slug>`, Infisical project, UA identity, три файла кредов в `/etc/infisical/<slug>/`
5. Секреты, CI-ключ и переменные репозитория — один прогон:

   ```bash
   pnpm setup-infisical -- --site <slug> \
     --from-env .env.production --env prod \
     --github --vps-host <vps-ip> --domain <your-domain> --port-base 3020
   ```

   Делает: значения секретов в prod, ключ `~/.ssh/ci-<slug>` и его авторизацию на VPS, secrets `VPS_HOST`/`VPS_SSH_KEY`, variables `VPS_USER`/`VPS_PATH`/`PUBLIC_URL`/`PRIMARY_DOMAIN`/`INFISICAL_HOST_URL`/`PORT_BASE`. Идемпотентно.

   Обязательные для compose секреты: `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_SITE_URL`, `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD` — скрипт в конце печатает те, что остались пустыми.

   Проверка: `gh variable list && gh secret list`.

6. `git push origin main` → `deploy.yml` сам всё доделает

> **Пересоздаёшь инстанс?** Удаление репозитория **не удаляет** его пакеты в GHCR — они
> остаются осиротевшими (`repository: null`), и новый репозиторий с тем же именем получает
> на них `403 Forbidden` при каждом `docker push`. Выглядит как проблема прав workflow, но
> права тут ни при чём. Перед пересозданием:
>
> ```bash
> gh api -X DELETE user/packages/container/<repo>-cms
> gh api -X DELETE user/packages/container/<repo>-client   # нужен scope delete:packages
> ```

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

| Симптом                                                            | Причина                                                                                         | Что делать                                                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `The ssh-private-key argument is empty`                            | vars/secrets репозитория не заведены                                                            | Сценарий A шаг 5, проверить `gh variable list && gh secret list`                                               |
| `deploy.sh exited with 126`                                        | режим `deploy.sh` 100644 вместо 100755                                                          | `git update-index --chmod=+x deploy/prod/deploy.sh` + коммит; синк восстанавливает сам                         |
| `S3_BUCKET is missing a value`                                     | секреты в Infisical пустые                                                                      | Сценарий A шаг 5                                                                                               |
| `another deploy for ... is already running`                        | предыдущий деплой ещё идёт (flock)                                                              | дождаться; параллельный blue-green небезопасен                                                                 |
| GH workflow падает на `Sync site directory` step                   | `/opt/sites/<slug>` не git-репо или mismatch remote                                             | `ssh deploy@<vps> "cd /opt/sites/<slug> && git remote -v"` или запустить bootstrap script                      |
| `pre-flight ... ERROR: PRIMARY_DOMAIN env not set`                 | GH variable не задана                                                                           | Settings → variables → `PRIMARY_DOMAIN=<your-domain>`                                                          |
| `infisical login returned empty token`                             | UA creds в `/etc/infisical/<slug>/` отсутствуют                                                 | Запустить `bootstrap-site-on-vps.sh` для этого сайта                                                           |
| Картинки 404 на `/media/...`                                       | Bucket пуст или nginx-conf без `/media/` location                                               | `docker exec minio mc ls local/<slug>-media`, перепроверь `${PRIMARY_DOMAIN}.conf`                             |
| cms healthcheck failed                                             | Миграции не накатились или env-переменные не подцеплены                                         | `docker logs <slug>-cms-<color>` + `infisical secrets list --env=prod --domain=$HOST_URL`                      |
| Port conflict (Bind for 127.0.0.1:30XX failed)                     | Два сайта с одинаковым `PORT_BASE`                                                              | Установить разные `PORT_BASE` (3000 / 3020 / 3040)                                                             |
| nginx test fails after cert renewal                                | LE renew успел до того как deploy.sh кладёт vhost                                               | `docker exec holygrail-nginx nginx -t` и читать конкретную ошибку; обычно про missing key                      |
| `403 Forbidden` при `docker push` в GHCR                           | пакет остался от удалённого репозитория (`repository: null`)                                    | `gh api -X DELETE user/packages/container/<repo>-{cms,client}` и передеплоить. Права workflow ни при чём       |
| Домен отдаёт сертификат **другого** сайта, деплой при этом зелёный | vhost остался http-only: для 443 с этим именем server-блока нет, nginx отдаёт первый попавшийся | `sudo grep -c ssl_certificate /opt/proxy/nginx/conf.d/<slug>.conf` — если 0, смотреть pre-flight в логе деплоя |
| VPS не может склонировать репозиторий                              | приватный репо без deploy key                                                                   | Сценарий A шаг 3                                                                                               |

## Дальше

- `deploy/prod/README.md` — короткий quickstart для разработчика (минимум деталей)
- `docs/whg/37-scaffolding.md` — пользовательский гайд по созданию нового инстанса
- `.claude/skills/whg-infisical/` — workflow секретов
- `.claude/skills/whg-payload-migration/` — blue-green safety для миграций
