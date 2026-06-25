---
name: whg-infisical
description: Workflow секретов в Holy Grail сайтах — self-host Infisical + Universal Auth machine identities, project per site (native RBAC изоляция). Идемпотентный bootstrap через `pnpm setup-infisical --site <slug>` (REST API: upsert project + ensure envs + upsert identity). Admin identity — `infisical bootstrap` на VPS, без UI-кликов. Local dev через `.infisical.json`+`dev.sh` (с fallback на `.env.local` если Infisical недоступен — только локально); prod multi-site через `/etc/infisical/<slug>/{client-id,client-secret}`. Триггерить при создании нового сайта, ротации секрета, debug "secret not found", добавлении новой env-переменной, миграции существующего сайта с .env на Infisical.
---

# Skill: whg-infisical

> Секреты на любом Holy Grail сайте — self-host Infisical + Universal Auth machine identities. Никаких .env.production на диске, никаких legacy service tokens, никакого Terraform для 1-2 сайтов. Прямой REST API + полностью автоматизированный scaffold.

## Канонический путь (наш workflow — источник правды)

1. **One self-host Infisical instance на VPS** (`/opt/infisical/`), shared между всеми сайтами. Не клонировать per-site.
2. **Canonical hostname** — `infisical.<canonical-domain>.tld` (домен infrastructure-команды, не сайта-клиента). Magic links / OAuth редиректят сюда. Задаётся env `INFISICAL_HOST_URL` при scaffold.
3. **Subdomain-aliases на каждый сайт** — `infisical.<site-domain>.tld` для каждого инстанса. Все nginx server-блоки `proxy_pass http://127.0.0.1:8080`, один backend. **НЕ subpath** — Infisical UI hard-coded под root (см. пруф в секции «Reverse proxy» ниже).
4. **Project per site** — `holygrail-<slug>`, авто через `pnpm setup-infisical --site <slug>`. Идемпотентно: reuse existing.
5. **Per-site admin** — приглашённый user видит ТОЛЬКО свой project. Авторизуется через любой alias (даже canonical), но workspace-list фильтруется RBAC.
6. **Per-site machine identity (UA)** для prod deploy — creds в `/etc/infisical/<slug>/{client-id,client-secret}` (chmod 600 deploy:deploy).
7. **Local dev secrets chain** (приоритет): (a) VPS Infisical online → (b) local Infisical контейнер на dev-машине → (c) `.env.local` файлы (offline, без контейнера). `dev.sh` пробует по порядку.
8. **Что хранится** — секреты + env-runtime + feature flags + rate limits. См. `docs/whg/45-data-location.md`.

Если несовпадение этого канона с практикой — править этот раздел + код, не наоборот.

## Когда триггерить

- Создаёшь новый сайт — нужны Infisical project, environments, identity.
- Ротируешь production secret.
- Debug «secret not found» / `process.env.X is undefined` на dev или prod.
- Добавляешь новую env-переменную — где её ввести (dev/staging/prod каждое отдельно).
- Мигрируешь существующий сайт с `.env.production` на VPS → Infisical.
- Передаёшь сайт другому разработчику.

## Архитектура

```
Developer (local)
  │
  │  ./dev.sh
  │     ↓
  │  infisical run --env=dev --recursive --
  │     ↓                              (использует .infisical.json + локальный keychain token)
  │  pnpm dev (cms + client)
  │     ↓
  │  process.env.* заполнен из Infisical dev environment

CI / Prod (VPS)
  │
  │  GH Actions → ssh deploy@vps → bash deploy.sh <slug>
  │     ↓
  │  /etc/infisical/<slug>/{client-id,client-secret}  (chmod 600 deploy:deploy)
  │     ↓
  │  infisical run --token=$(infisical login --method=universal-auth --domain=$INFISICAL_HOST_URL …) --env=prod -- docker compose up -d
  │     ↓
  │  Контейнеры получают env переменные при старте — НЕ записывается в файл

Scaffold (новый сайт)
  │
  │  pnpm setup-infisical -- --site <slug>
  │     ↓
  │  Использует admin identity (INFISICAL_ADMIN_TOKEN или CLIENT_ID/SECRET — env)
  │     ↓
  │  REST API → upsert project + ensure envs + upsert service identity + client secret
  │     ↓
  │  Print Client ID + Secret + .infisical.json (идемпотентно)
```

## Bootstrap admin identity (без UI — self-host)

Self-host edition даёт CLI-команду `infisical bootstrap` — инициализирует пустой instance и **автоматически создаёт** admin user + organization + admin machine identity. UI-кликов нет.

После того как `deploy/infisical/docker-compose.yml` поднят на VPS:

```bash
ssh deploy@<vps> 'docker exec infisical infisical bootstrap \
  --email admin@<your-domain>.tld \
  --password "'$(openssl rand -hex 32)'" \
  --organization "Holy Grail Sites" \
  --output json' > /tmp/infisical-bootstrap.json
```

Output (JSON) содержит:

- `identity.credentials.clientId` — admin UA client ID
- `identity.credentials.clientSecret` — admin UA client secret
- `identity.organization.id` — orgId (нужен для `POST /api/v1/identities`)
- `user.email` / `user.password` — для входа в Web UI браузером, если понадобится

Положить в **personal env** (через `~/.zshrc` / Windows env / personal MCP raw):

```
INFISICAL_HOST_URL=https://infisical.<your-domain>.tld
INFISICAL_ADMIN_CLIENT_ID=<clientId из bootstrap>
INFISICAL_ADMIN_CLIENT_SECRET=<clientSecret из bootstrap>
INFISICAL_ADMIN_ORG_ID=<orgId из bootstrap>
```

После этого **все scaffold-операции автоматизированы** через REST. Никаких ручных шагов в UI ни сейчас, ни в будущем. UI остаётся для визуального осмотра / ручной правки секретов content-менеджером.

## Автоматизированный bootstrap (pnpm setup-infisical)

`scripts/setup-infisical.ts` через REST API:

### Шаг 1 — auth

Две формы аутентификации:

**A) Pre-issued admin token (`infisical bootstrap` output)** — bypass login:

```
Authorization: Bearer $INFISICAL_ADMIN_TOKEN
```

Это путь который сейчас используется (bootstrap даёт identity access token JWT напрямую, TTL ~90 дней).

**B) Universal Auth login** (если есть отдельный admin UA identity):

```
POST $INFISICAL_HOST_URL/api/v1/auth/universal-auth/login
{ "clientId": "...", "clientSecret": "..." }
→ { "accessToken": "<JWT>" }
```

Все следующие запросы — с заголовком `Authorization: Bearer <token>`.

### Шаг 2 — create project

```
POST /api/v2/workspace
{ "projectName": "holygrail-<slug>", "type": "secret-manager", "slug": "holygrail-<slug>" }
→ { "project": { "id": "<projectId>", ... } }
```

### Шаг 3 — ensure environments dev / staging / prod

**Важно:** Infisical (новые версии) **авто-создаёт** default `dev/staging/prod` при создании проекта. Поэтому скрипт сначала делает GET и создаёт только отсутствующие.

```
GET /api/v1/workspace/{projectId}
→ { workspace: { environments: [{ slug: "dev", ... }, ...] } }

# Для отсутствующих:
POST /api/v1/workspace/{projectId}/environments
{ "name": "Staging", "slug": "staging", "position": 2 }
```

### Шаг 4 — seed placeholder secrets

Для каждого env (dev/staging/prod) × каждого STANDARD*SECRET (PAYLOAD_SECRET / DATABASE_URI / S3*_ / NEXT*PUBLIC*_ / VK\_\*):

```
POST /api/v3/secrets/raw/<KEY>
{ "workspaceId": projectId, "environment": "dev", "secretValue": "", "secretComment": "Заполни через UI или infisical secrets set" }
```

### Шаг 5 — create service identity для prod-деплоя

```
POST /api/v1/identities
{ "name": "<slug>-prod-deploy", "organizationId": <orgId>, "role": "no-access" }
→ { "identity": { "id": "<identityId>", "orgId": "<orgId>" } }
```

Attach Universal Auth:

```
POST /api/v1/auth/universal-auth/identities/<identityId>
{ "accessTokenTTL": 2592000, "accessTokenMaxTTL": 2592000, ... }
→ { "identityUniversalAuth": { "clientId": "<clientId>", ... } }
```

Create client secret:

```
POST /api/v1/auth/universal-auth/identities/<identityId>/client-secrets
{ "description": "<slug> prod-deploy", "ttl": 0 }
→ { "clientSecret": "<clientSecret>", "clientSecretData": { ... } }
```

### Шаг 6 — add identity to project with prod-env scope

**TODO/verify:** точный endpoint для add identity to project membership ещё не зафиксирован. При первом scaffold пробую `POST /api/v2/workspace/{projectId}/identity-memberships/{identityId}` с body `{ role: "read", environment: "prod" }`. Если 404 — fallback на UI на этом единственном шаге. Скилл обновлю после первого реального scaffold.

### Шаг 6.5 — invite per-site admin user (RBAC)

Чтобы у каждого сайта был свой «человеческий» админ (отдельно от Володи-root и от prod-deploy machine identity), приглашаем user в project с правами `admin` только на этот workspace.

```
POST /api/v3/users/signup-invite
{ "email": "<admin-email>", "organizationId": "<orgId>" }
→ { "completeInviteLink": "$INFISICAL_HOST_URL/signupinvite?token=..." }

POST /api/v2/workspace/{projectId}/memberships
{ "emails": ["<admin-email>"], "roles": ["admin"] }
```

Invited user логинится через любой `infisical.<site>.tld` alias → видит ТОЛЬКО `holygrail-<slug>` (если ему дан membership ровно к одному project). Изоляция через native Infisical project membership filter. `completeInviteLink` высылается приглашённому, он завершает signup → password reset → login.

Когда не нужно — пропустить (для test/internal сайтов).

### Шаг 7 — write `.infisical.json`

```json
{ "workspaceId": "<projectId>", "defaultEnvironment": "dev" }
```

### Шаг 8 — print credentials для VPS (multi-site структура)

```
PROD MACHINE IDENTITY CREATED:
  Client ID:     <clientId>
  Client Secret: <clientSecret>  (показывается ОДИН раз — сохрани сейчас!)

  Положи на VPS (per-site, чтобы несколько сайтов на одной VPS не конфликтовали):
    sudo install -d -m 700 -o deploy -g deploy /etc/infisical/<slug>
    echo "<clientId>"     | sudo tee /etc/infisical/<slug>/client-id     > /dev/null
    echo "<clientSecret>" | sudo tee /etc/infisical/<slug>/client-secret > /dev/null
    sudo chmod 600 /etc/infisical/<slug>/*
    sudo chown deploy:deploy /etc/infisical/<slug>/*
```

**Идемпотентность:** при повторном запуске скрипта identity reused, client-secret НЕ пересоздаётся (показывается один раз, не повторяется). Если потерян — удалить identity через `DELETE /api/v1/identities/{id}` и перезапустить scaffold.

## Local dev

После setup-infisical:

```bash
./dev-setup.sh    # поднимает MinIO + сетит дефолты в Infisical dev env
./dev.sh          # infisical run --env=dev --recursive -- pnpm dev
```

`--recursive` важен для monorepo — без него child workspaces не получают env.

## Prod deploy

`deploy/prod/deploy.sh` ожидает (per-site multi-tenant):

- `/etc/infisical/<slug>/client-id` (chmod 600 deploy:deploy)
- `/etc/infisical/<slug>/client-secret`
- env `INFISICAL_ENV=prod` (default), `INFISICAL_HOST_URL`

Каждый `docker compose` обёрнут:

```bash
TOKEN=$(infisical login --method=universal-auth \
  --client-id=$(cat /etc/infisical/$SITE_SLUG/client-id) \
  --client-secret=$(cat /etc/infisical/$SITE_SLUG/client-secret) \
  --domain=$INFISICAL_HOST_URL \
  --plain --silent)
infisical run --token=$TOKEN --env=prod -- docker compose -f compose.bluegreen.yml up -d
```

**TODO:** deploy/prod/deploy.sh ещё использует legacy `/etc/infisical/token` подход (single-site), нужно обновить под multi-site UA flow.

## Reverse proxy для UI — per-subdomain, не subpath

**Канон:** на каждом Holy Grail сайте создаём отдельный subdomain `infisical.<site>.tld`, который проксирует на shared `localhost:8080`. Всех сайтов VPS-shared один Infisical instance — изоляция через project RBAC, не network.

### Почему НЕ subpath (`site.tld/infisical/`) — пруф 2026-06-25

Пробовали subpath через `location /infisical/ { proxy_pass http://127.0.0.1:8080/; X-Forwarded-Prefix: /infisical; }`. Сломалось:

```
$ curl -sI https://veo55.ru/infisical/
HTTP/2 308
location: /infisical          # ← Infisical Next.js редирект на /infisical БЕЗ slash

$ curl -sI https://veo55.ru/infisical
HTTP/1.1 404 Not Found        # ← без slash не матчит location /infisical/, ловит catch-all `/`,
                              #   попадает в veo55 client который 404 на /infisical
```

При запросе `/infisical/login` UI Infisical отдаёт HTML с абсолютными `<script src="/_next/...">`, `<link href="/static/...">`, `fetch('/api/...')`. Эти пути промахиваются мимо `location /infisical/`, ловят `/` → veo55 client → 404.

Root cause: Infisical UI = Next.js, hard-coded под root URL. Нет env-флага `BASE_PATH`/`PATH_PREFIX`. Нет официальной поддержки subpath.

Костыль через nginx `sub_filter` (response body rewrite `/static/` → `/infisical/static/`) теоретически возможен, но:

- ломается на gzip / brotli
- ломается при апгрейде Infisical (новые пути в UI)
- не покрывает WebSocket subscription paths
- не покрывает JSON API responses с absolute URLs

### Канонический nginx server-block

`/opt/proxy/nginx/conf.d/infisical.<site>.tld.conf` (через `certbot --nginx -d infisical.<site>.tld` авто-генерируется):

```nginx
server {
  listen 80;
  server_name infisical.<site>.tld;
  location /.well-known/acme-challenge/ { root /var/www/certbot; try_files $uri =404; }
  location / { return 301 https://$host$request_uri; }
}

server {
  listen 443 ssl http2;
  server_name infisical.<site>.tld;

  ssl_certificate     /etc/letsencrypt/live/infisical.<site>.tld/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/infisical.<site>.tld/privkey.pem;
  include /etc/nginx/snippets/ssl-modern.conf;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

DNS: `infisical.<site>.tld A 83.217.200.27` (через регистратора сайта).

Infisical `SITE_URL` env — один canonical (например `https://infisical.veo55.ru` если основной admin сайт). Другие subdomain доступны как proxy-аliases — magic links/OAuth редиректят на canonical, но т.к. UI используется редко (только админ), это не блокер.

## Ротация секрета

```bash
infisical secrets set --env=prod KEY=newvalue
# или через UI

# Прод подхватит на следующем deploy / restart контейнера
ssh deploy@vps "cd /opt/sites/<site> && bash deploy/prod/deploy.sh <sha>"
```

## Triple path (UI / AI / Shell)

Согласно `feedback_triple_path_no_ai_lockin.md`:

### UI path (для человека через браузер)

1. `https://infisical.<site>.tld/` (per-site subdomain, см. секцию выше) → Create Project → Add Environments → Add Secrets → Add Machine Identity → Get Client Secret → Add to Project → Copy credentials.
2. Документация: см. README + `docs/whg/37-scaffolding.md`.
3. Время: 5-10 минут.

### AI path (Claude автономно через эту сессию)

1. `pnpm setup-infisical -- --site <slug>` — делает всё через REST.
2. Skill использует `INFISICAL_ADMIN_CLIENT_ID/SECRET` из env (один раз настроены).
3. Время: 30 секунд.

### Shell path (CI / cron / debug)

1. Те же REST endpoints через `curl` либо `setup-infisical.ts` через `tsx scripts/...`.
2. В CI: `INFISICAL_ADMIN_CLIENT_ID/SECRET` через `gh secret` или подобное.
3. Время: 30 секунд.

Все три пути дают идентичный результат — Infisical project готов, credentials выданы.

## Подводные камни

- **`.infisical.json` коммитится.** Внутри `workspaceId` (UUID) + `defaultEnvironment`. Секретов нет.
- **`--recursive` обязателен** для monorepo. Без него child pnpm filter'ы не получают env.
- **Universal Auth vs Service Token.** UA — современный (token обновляется, scope per-env, audit). Service tokens — deprecated.
- **Rotation client-secret** — если admin client-secret утёк → пересоздать в UI, обновить env. Service identity client-secret rotation — пересоздать через REST (`DELETE /api/v1/auth/universal-auth/identities/{id}/client-secrets/{secretId}` + `POST .../client-secrets`).
- **Org context** — все REST admin вызовы используют orgId из JWT (admin identity scope'нут к org). Не нужно явно передавать `--org-id`.
- **Drift dev vs prod** — Infisical UI показывает diff между environments. Перед prod-deploy полезно сверить.
- **Add identity to project endpoint** — точный URL ещё не зафиксирован в моих заметках. При первом scaffold нужно verify через trial-error или Infisical Discord. После — обновить skill.

## Stop-conditions (зову Володю)

- **Утёк admin client-secret** — destructive rotation: rerun `infisical bootstrap` нельзя (он только для пустого instance). Создать новую admin identity через REST через старый client-secret пока работает; если уже revoked — через Web UI вручную (стандартный fallback).
- **Невозможно залогиниться через `INFISICAL_ADMIN_CLIENT_ID/SECRET`** — admin identity revoked или permission lost. Не «починить наугад» — посмотреть в UI.
- **REST endpoint падает 401/403** на identity create — admin identity не имеет role `admin` в org. Поднять role через REST (или UI как fallback).
- **REST endpoint падает 404** на identity-project-membership — endpoint URL устарел / изменён. Verify через docs или Discord, обновить skill.

## Ссылки

- [Infisical REST: create identity](https://infisical.com/docs/api-reference/endpoints/identities/create)
- [Infisical REST: attach universal auth](https://infisical.com/docs/api-reference/endpoints/universal-auth/attach)
- [Infisical REST: create client secret](https://infisical.com/docs/api-reference/endpoints/universal-auth/create-client-secret)
- [Infisical: Machine Identities guide](https://infisical.com/blog/introducing-machine-identities)
- [Infisical CLI login](https://infisical.com/docs/cli/commands/login)

## Human-readable версия

[`docs/whg/37-scaffolding.md`](../../../docs/whg/37-scaffolding.md) — то же самое для пользователя без агента. Source of truth — там; этот skill = его проекция для агента.

При апдейте: правь оба синхронно.
