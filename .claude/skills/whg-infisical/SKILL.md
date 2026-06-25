---
name: whg-infisical
description: Workflow секретов в Holy Grail сайтах — self-host Infisical + Universal Auth machine identities. Полностью автономный bootstrap (создание project + environments + service identity + client secret через REST API) через `pnpm setup-infisical --site <slug>`. Admin identity создаётся CLI-командой `infisical bootstrap` на VPS — UI-шагов вообще нет. Local dev через `.infisical.json`+`dev.sh`, prod через `/etc/infisical/{client-id,client-secret}`. Триггерить при создании нового сайта, ротации секрета, debug "secret not found", добавлении новой env-переменной, миграции существующего сайта с .env на Infisical.
---

# Skill: whg-infisical

> Секреты на любом Holy Grail сайте — Infisical Cloud + Universal Auth machine identities. Никаких .env.production на диске, никаких legacy service tokens, никакого Terraform для 1-2 сайтов. Прямой REST API.

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
  │  GH Actions → ssh deploy@vps → bash deploy.sh
  │     ↓
  │  /etc/infisical/{client-id,client-secret}  (chmod 600 deploy:deploy)
  │     ↓
  │  infisical run --token=$(infisical login --method=universal-auth …) --env=prod -- docker compose up -d
  │     ↓
  │  Контейнеры получают env переменные при старте — НЕ записывается в файл

Scaffold (новый сайт)
  │
  │  pnpm setup-infisical -- --site <slug>
  │     ↓
  │  Использует ADMIN identity Володи (INFISICAL_ADMIN_CLIENT_ID/SECRET в env или MCP)
  │     ↓
  │  REST API → create project + environments + service identity + client secret
  │     ↓
  │  Print Client ID + Secret + .infisical.json
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

Логинимся через admin identity:

```
POST https://app.infisical.com/api/v1/auth/universal-auth/login
{
  "clientId": process.env.INFISICAL_ADMIN_CLIENT_ID,
  "clientSecret": process.env.INFISICAL_ADMIN_CLIENT_SECRET
}
→ { "accessToken": "<JWT>" }
```

Все следующие запросы — с заголовком `Authorization: Bearer <accessToken>`.

### Шаг 2 — create project

```
POST /api/v2/workspace
{ "projectName": "holygrail-<slug>", "type": "secret-manager", "slug": "holygrail-<slug>" }
→ { "project": { "id": "<projectId>", ... } }
```

### Шаг 3 — create environments dev / staging / prod

```
POST /api/v1/workspace/{projectId}/environments
{ "name": "Development", "slug": "dev", "position": 1 }
```

Повторить для staging (slug `staging`) и prod (slug `prod`).

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

### Шаг 7 — write `.infisical.json`

```json
{ "workspaceId": "<projectId>", "defaultEnvironment": "dev" }
```

### Шаг 8 — print credentials для VPS

```
PROD MACHINE IDENTITY CREATED:
  Client ID:     <clientId>
  Client Secret: <clientSecret>  (показывается ОДИН раз — сохрани сейчас!)

  Положи на VPS:
    sudo install -d -m 700 -o deploy -g deploy /etc/infisical
    echo "<clientId>" | sudo tee /etc/infisical/client-id > /dev/null
    echo "<clientSecret>" | sudo tee /etc/infisical/client-secret > /dev/null
    sudo chmod 600 /etc/infisical/*
    sudo chown deploy:deploy /etc/infisical/*
```

## Local dev

После setup-infisical:

```bash
./dev-setup.sh    # поднимает MinIO + сетит дефолты в Infisical dev env
./dev.sh          # infisical run --env=dev --recursive -- pnpm dev
```

`--recursive` важен для monorepo — без него child workspaces не получают env.

## Prod deploy

`deploy/prod/deploy.sh` ожидает:

- `/etc/infisical/client-id` (chmod 600 deploy:deploy)
- `/etc/infisical/client-secret`
- env `INFISICAL_ENV=prod` (default)

Каждый `docker compose` обёрнут:

```bash
TOKEN=$(infisical login --method=universal-auth \
  --client-id=$(cat /etc/infisical/client-id) \
  --client-secret=$(cat /etc/infisical/client-secret) \
  --plain --silent)
infisical run --token=$TOKEN --env=prod -- docker compose -f compose.bluegreen.yml up -d
```

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

1. `https://infisical.<your-domain>.tld/` (self-host) → Create Project → Add Environments → Add Secrets → Add Machine Identity → Get Client Secret → Add to Project → Copy credentials.
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
