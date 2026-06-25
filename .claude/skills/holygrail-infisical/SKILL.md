---
name: holygrail-infisical
description: Workflow секретов в Holy Grail сайтах — Infisical Cloud + Universal Auth machine identity. Bootstrap нового проекта (`pnpm setup-infisical --site <slug>`), local dev через `.infisical.json`+`dev.sh`, prod через `/etc/infisical/client-id`+`client-secret` и `deploy.sh` обёрнутый в `infisical run --token=...`. Никаких legacy service tokens, никаких .env.production. Триггерить при создании нового сайта, ротации секрета, debug "secret not found", добавлении нового env-переменной, миграции существующего сайта с .env на Infisical.
---

# Skill: holygrail-infisical

> Секреты на любом Holy Grail сайте — через Infisical Cloud + Universal Auth machine identities. Никаких легаси service tokens, никаких .env.production на диске.

## Когда триггерить

- Создаёшь новый сайт (`pnpm holygrail new <site>` или клонируешь template) — нужно завести Infisical project, environments, identities.
- Ротируешь production secret (PAYLOAD_SECRET, S3_*, VK_ACCESS_TOKEN, и т.д.).
- Debug «secret not found» / `process.env.X is undefined` на dev или prod.
- Добавляешь новую env-переменную — где её ввести (dev/staging/prod каждое отдельно).
- Мигрируешь существующий сайт с `.env.production` на VPS → Infisical.
- Передаёшь сайт другому разработчику (как ему дать доступ к секретам не пересылая файлы).

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
  │  /etc/infisical/client-id, /etc/infisical/client-secret  (chmod 600 deploy:deploy)
  │     ↓
  │  infisical login --method=universal-auth --client-id=... --client-secret=...
  │     ↓
  │  infisical run --env=prod -- docker compose up -d
  │     ↓
  │  Контейнеры получают env переменные при старте — НЕ записывается в файл
```

## Bootstrap нового сайта

```bash
# Один раз глобально:
infisical login    # браузерный flow, токен в keychain

# Запуск scaffold-скрипта (в корне нового сайта):
INFISICAL_ORG_ID=<your-org-id> pnpm setup-infisical -- --site <slug>
```

Что делает скрипт (`scripts/setup-infisical.ts`):
1. Auth через `INFISICAL_TOKEN` (keychain) или universal-auth (CI: `INFISICAL_CLIENT_ID/SECRET`).
2. `client.projects().create({ projectName: "holygrail-<slug>", type: "secret-manager" })`.
3. `client.environments().create()` × 3 — `dev`, `staging`, `prod`.
4. `client.secrets().createSecret()` для каждого из STANDARD_SECRETS (PAYLOAD_SECRET, DATABASE_URI, S3_*, NEXT_PUBLIC_*, VK_*) — пустые placeholders.
5. Пишет `.infisical.json` (workspaceId + defaultEnvironment) — линкует репо к проекту. **`.infisical.json` коммитится** (там только id, не секреты).
6. Печатает hint про создание machine identity вручную через UI (SDK в текущей версии не умеет `createIdentity` напрямую — рекомендация Infisical через UI или Terraform-провайдер).

## Local dev

После `setup-infisical`:

```bash
./dev-setup.sh    # проверка CLI, login если надо, init если .infisical.json нет
./dev.sh          # infisical run --env=dev --recursive -- pnpm dev
```

`--recursive` важен — без него env-переменные не пропустятся в child workspaces (cms + client). `dev.sh` в WHG-template уже обёрнут.

## Prod deploy

`deploy.sh` (deploy/prod/) ожидает:
- `/etc/infisical/client-id` (chmod 600 deploy:deploy)
- `/etc/infisical/client-secret` (chmod 600 deploy:deploy)
- `INFISICAL_ENV=prod` (default)

Каждый `docker compose pull/up/down` в `deploy.sh` обёрнут в:

```bash
INFISICAL_RUN=(infisical run --token="$INFISICAL_TOKEN" --env="$INFISICAL_ENV" --)
"${INFISICAL_RUN[@]}" docker compose -f compose.bluegreen.yml up -d
```

Контейнеры получают env через injection, ничего на диск не пишется.

## Ротация секрета

```bash
# Локально:
infisical secrets set --env=prod KEY=newvalue
# или через UI: https://app.infisical.com/project/<id>/secrets/prod

# Деплой: следующий `deploy.sh` подхватит при старте. Работающие контейнеры не пересоздаются автоматически — нужен ребилд или restart:
ssh deploy@vps "cd /opt/sites/<site> && bash deploy/prod/deploy.sh <sha>"
# Или просто `docker compose restart` для уже задеплоенного цвета — но env читается только при старте процесса.
```

## Добавление нового env-переменной

1. UI → Project → нужный env → Add Secret. Повторить для всех env (dev/staging/prod) с правильными значениями.
2. Локально перезапустить `./dev.sh` (контейнеры подхватят при старте).
3. Прод — следующий деплой.

В код добавляй чтение через `process.env.X ?? defaultValue` (всегда fallback на случай старой версии прода во время deploy lag).

## Подводные камни

- **`.infisical.json` коммитится.** Внутри только `workspaceId` (UUID) + `defaultEnvironment`. Секретов там нет — это **линк** репо↔проект. Без него `infisical run` не знает куда смотреть.
- **`--recursive` обязателен** для monorepo. Без него child pnpm filter'ы не получают env (pnpm workspace = свой Node-процесс, env не наследуется автоматом).
- **Machine identity vs Service token.** Universal Auth machine identities — современный API (token обновляется, scope per-environment, audit log). Legacy service tokens — deprecated, не использовать.
- **Rotation client-secret** — если client-secret машины утёк → в UI пересоздать identity (или revoke + сгенерировать новый секрет), обновить `/etc/infisical/client-secret` на VPS. Старый client-id остаётся валидным.
- **Drift dev vs prod** — Infisical UI показывает diff между environments. Перед prod-deploy полезно сверить что нет «случайно забытых» секретов в одном из.

## Stop-conditions (зову Володю)

- **Утёк client-secret прод** — destructive rotation, обсудить с Володей блокировку identity и пересоздание.
- **Невозможно залогиниться через `infisical login`** дольше 5 минут — может быть Org-permission проблема или Cloudflare-блокировка.
- **`infisical run` падает «no secrets found»** при существующем `.infisical.json` — workspaceId мог измениться (project пересоздан) или identity потеряло доступ. Не «починить наугад» — посмотреть в UI что с правами.

## Ссылки

- [Infisical Bootstrap CLI](https://infisical.com/docs/cli/commands/bootstrap)
- [Machine Identities](https://infisical.com/blog/introducing-machine-identities)
- [Node SDK](https://github.com/Infisical/infisical-node)
- [Terraform Provider](https://github.com/Infisical/terraform-provider-infisical) — для declarative управления projects/environments/identities (рассмотреть после 3+ сайтов).
