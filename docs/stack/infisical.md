# Infisical

> Env-aware versioned key-value config storage. **Self-host single instance** на VPS Володи — тот же web UI / API / SDK что у Cloud (OSS = open-source версия cloud edition). Каждый Holy Grail сайт = отдельный **project** в этом instance (native Infisical RBAC изоляция). Cloud SaaS не используем — vendor lock-in недопустим.
>
> В Holy Grail используется как **general-purpose config store** — секреты + env-dependent runtime + feature flags + rate limits. Не только для секретов. Подробнее — [`45-data-location.md`](../whg/45-data-location.md).

## Архитектура

```
VPS (под Holy Grail инстансы)
└── docker контейнер: infisical-server (+ Postgres) — один на всю VPS
    ├── project "holygrail-sawking-tech"
    │   ├── env=dev, env=staging, env=prod
    │   ├── secrets, service identities, audit log
    │   └── RBAC: только members с scope этого project
    ├── project "holygrail-cafe-zerno"
    │   └── (тот же шаблон, изолирован)
    └── project "holygrail-<next-site>"
        └── ...
```

**Изоляция между проектами** — native Infisical project-level RBAC:
- Member со scope=`project-X` не видит `project-Y`
- Audit log per project
- Сompromised member одного project'а не утекает другие
- **Instance admin** (root) видит всё — но это namespace-level admin для апгрейдов / бэкапов, не для прод-деплоев. Для деплоев — отдельные service identities (UA) per project, scope=`prod env` of `project-X`.

**Когда хватит одного instance:** до десятков проектов один Infisical справляется. Free / OSS edition покрывает наш use case.

## Текущие версии

| Компонент | Версия | Проверка |
|---|---|---|
| Infisical server | latest stable (OSS) | в docker compose tag |
| CLI | latest stable | `infisical --version` |
| Node SDK `@infisical/sdk` | `^3.0.0` | в `package.json` |
| MCP server `@infisical/mcp` | latest | `npx @infisical/mcp --version` |

Релизы tracking:
- [Main server releases](https://github.com/Infisical/infisical/releases) — для self-host docker image
- [CLI releases](https://github.com/Infisical/cli/releases)
- [SDK releases](https://github.com/Infisical/node-sdk-v2/releases)
- [MCP server releases](https://github.com/Infisical/infisical-mcp-server/releases)

## Что мы используем

- **Self-host** (один instance на VPS, OSS edition) — текущий выбор. Без vendor lock-in.
- **Cloud** (`app.infisical.com`) — **не используем**. Бесплатный для эксперимента, но создаёт зависимость.
- **Auth method** — **Universal Auth** machine identities (legacy service tokens deprecated).
- **Isolation pattern** — **project per site**, не folder per site. Используем native RBAC.
- **Local dev** — может подключаться к **тому же self-host instance** на VPS (через VPN / SSH tunnel), либо к отдельной локальной инсталляции для completely offline dev.
- **Prod** — `deploy/prod/deploy.sh` обёрнут `infisical run --env=prod`, контейнеры получают env при старте через UA service identity того project.

## Deployment self-host instance

### Setup на VPS (один раз навсегда)

`platform/infisical/docker-compose.yml` (поднимется в Holy Grail roadmap):

```yaml
services:
  infisical-db:
    image: postgres:14
    environment:
      POSTGRES_USER: infisical
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: infisical
    volumes:
      - infisical_db:/var/lib/postgresql/data
    restart: unless-stopped

  infisical:
    image: infisical/infisical:latest
    depends_on: [infisical-db]
    environment:
      DB_CONNECTION_URI: postgres://infisical:${POSTGRES_PASSWORD}@infisical-db/infisical
      ENCRYPTION_KEY: ${INFISICAL_ENCRYPTION_KEY}  # 32-byte hex
      AUTH_SECRET: ${INFISICAL_AUTH_SECRET}        # 32-byte hex
      SITE_URL: https://infisical.<your-domain>.tld
    ports:
      - "8080:8080"
    restart: unless-stopped

volumes:
  infisical_db:
```

После старта — `infisical bootstrap` команда создаёт admin user + org + admin machine identity автоматически:

```bash
docker exec infisical infisical bootstrap \
  --email admin@example.com \
  --password <strong-pass> \
  --organization "Holy Grail Sites" \
  --output k8-secret  # или просто текст в stdout
```

Возвращает Client ID + Client Secret для root admin identity. Сохраняешь в env Володи + в любое безопасное хранилище.

### Backup стратегия

Один Postgres → один pg_dump per день в `/backups/infisical/`. Не забывать ENCRYPTION_KEY (без него БД нечитаема даже с дампом).

### TLS

Через `deploy/proxy-stack/nginx` (тот же что для сайтов): reverse-proxy на `localhost:8080` с Let's Encrypt сертом для `infisical.<domain>`.

## Scaffold нового сайта на self-host

После того как Infisical instance работает на VPS:

1. `pnpm setup-infisical -- --site <slug>` — скрипт:
   - Логинится через admin UA credentials (`INFISICAL_ADMIN_CLIENT_ID/SECRET` env)
   - Создаёт **project** `holygrail-<slug>` (REST `POST /api/v2/workspace`)
   - Создаёт environments dev/staging/prod
   - Seed placeholders для STANDARD_SECRETS
   - Создаёт service identity `<slug>-prod-deploy` (UA) с scope=`prod env` of этого project
   - Пишет `.infisical.json` (`workspaceId` + `defaultEnvironment: dev`)
2. Service Client Secret выводится в console — кладёшь на VPS в `/etc/infisical/<slug>/client-secret` (chmod 600 deploy:deploy)
3. `./dev-setup.sh` — local dev подключается к self-host через `INFISICAL_HOST_URL=https://infisical.<your-domain>.tld`

## Установка CLI (одноразово per машина)

| OS | Команда |
|---|---|
| macOS | `brew install infisical/get-cli/infisical` |
| Windows | `winget install Infisical.CLI` |
| Linux | `curl -1sLf 'https://artifacts-cli.infisical.com/install.sh' \| sh` |

Для self-host: `infisical login --domain https://infisical.<your-domain>.tld` (browser-flow на свой instance, не Cloud).

## MCP server (для меня — Claude в этом репо)

Официальный `@infisical/mcp` экспонирует Infisical API как MCP tools.

### Установка в Claude Code

```bash
claude mcp add infisical -- npx -y @infisical/mcp
```

В `~/.claude/mcp.json` / `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "infisical": {
      "command": "npx",
      "args": ["-y", "@infisical/mcp"],
      "env": {
        "INFISICAL_UNIVERSAL_AUTH_CLIENT_ID": "<UA-client-id>",
        "INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET": "<UA-client-secret>",
        "INFISICAL_HOST_URL": "https://infisical.<your-domain>.tld"
      }
    }
  }
}
```

`INFISICAL_HOST_URL` обязателен для self-host (default app.infisical.com = Cloud).

### Tools которые MCP даёт

- `create-secret`, `update-secret`, `delete-secret`, `list-secrets`, `get-secret`
- `create-project`, `list-projects`
- `create-environment`
- `create-folder`
- `invite-members-to-project`

### Tools что MCP **не** даёт (важно)

- ❌ `create-identity`, `attach-universal-auth`, `create-client-secret`, `add-identity-to-project`

Для них — прямой REST (admin Bearer token от admin UA identity).

## AI Skills repo

`Infisical/ai-skills` — 6 официальных skills:

| Skill | Что покрывает |
|---|---|
| `infisical-setup` | Setup-гайд: CLI, SDK, Docker, K8s, 12 методов auth |
| `infisical-secret-syncs` | Sync секретов в 38+ внешних сервисов |
| `infisical-dynamic-secrets` | Короткоживущие creds (DB, IAM, SSH) |
| `infisical-agent` | Daemon agent — YAML config, auth, deploy |
| `infisical-terraform` | Terraform Provider |
| `infisical-api` | REST API reference |

Установка:
```bash
npx skills add Infisical/ai-skills
# или
/plugin marketplace add Infisical/ai-skills
```

## Self-host обходит chicken-egg

`infisical bootstrap` команда создаёт admin user + org + admin machine identity автоматически при первой инициализации — **обходит UI clicks для первичного setup'а**:

```bash
TOKEN=$(docker exec infisical infisical bootstrap \
  --email admin@example.com \
  --password $(openssl rand -hex 32) \
  --organization "Holy Grail Sites" \
  | jq -r '.identity.credentials.token')
```

После bootstrap у нас:
- Admin user + пароль (для входа в web UI через браузер)
- Admin machine identity + Client ID + Client Secret (для programmatic admin REST)

## Web UI — есть, полноценный

Self-host edition Infisical — **тот же web UI** что Cloud (это open-source версия cloud edition, одна кодовая база). После запуска docker-контейнера UI доступен на `https://infisical.<your-domain>.tld/` (через свой `deploy/proxy-stack/nginx` с TLS).

Через UI можно:
- Управлять secrets вручную (set / view / rotate)
- Просматривать audit log per project
- Создавать / редактировать / удалять projects
- Управлять members и их scope'ом (RBAC)
- Создавать / ротировать machine identities
- Настраивать access policies (folder-path-based, role-based)
- Импорт/экспорт secrets (CSV, JSON, .env)

**UI и programmatic API/CLI/MCP работают параллельно** — никакого выбора "или/или". Володя пользуется тем что удобно в моменте: код / скрипт когда автоматизирует, UI когда хочется визуально посмотреть или быстро рукой подправить.

## REST endpoints что я использую

| Operation | Endpoint | Auth |
|---|---|---|
| Login machine identity | `POST /api/v1/auth/universal-auth/login` | clientId/secret |
| Create project | `POST /api/v2/workspace` | Bearer |
| Create environment | `POST /api/v1/workspace/{projectId}/environments` | Bearer |
| Create / update secret | `POST/PATCH /api/v3/secrets/raw/{key}` | Bearer |
| Create identity | `POST /api/v1/identities` | Bearer (admin) |
| Attach Universal Auth | `POST /api/v1/auth/universal-auth/identities/{id}` | Bearer (admin) |
| Create client secret | `POST /api/v1/auth/universal-auth/identities/{id}/client-secrets` | Bearer (admin) |
| Add identity to project | TODO — verify endpoint при первом scaffold | Bearer (admin) |

Все вызовы делаются на `https://infisical.<your-domain>.tld/api/...`, не на `app.infisical.com`.

## Когда апдейтить

| Что | Когда |
|---|---|
| Infisical server (docker image) | quarterly review changelog, не часто (stable releases) |
| CLI / SDK / MCP | continuous через caret-range / npx -y |
| AI skills | `npx skills add` периодически |

При major upgrade Infisical server — Backup БД перед `docker compose up -d` с новым tag'ом.

## Известные ограничения и watch list

- Один Postgres → бэкап-стратегия обязательна (без ENCRYPTION_KEY БД мертва)
- SDK не имеет identity management методов (только secrets) — admin ops через REST
- MCP server tools не покрывают identity management — fallback на REST
- CLI не печатает session JWT в stdout — keychain непрозрачен для скриптов
- При полной потере VPS — нужны бэкапы. Без них всё переcоздавать заново
- `INFISICAL_HOST_URL` нужно во всех конфигах (CLI, SDK, MCP) — не забудь при добавлении нового интеграции

## Ссылки

- [Сайт](https://infisical.com/)
- [Docs index](https://infisical.com/docs)
- [Self-host install guide](https://infisical.com/docs/self-hosting/overview)
- [REST API reference](https://infisical.com/docs/api-reference/overview/introduction)
- [llms.txt (для AI агентов)](https://infisical.com/docs/llms.txt)
- [GitHub: главный сервер](https://github.com/Infisical/infisical)
- [GitHub: CLI](https://github.com/Infisical/cli)
- [GitHub: Node SDK](https://github.com/Infisical/node-sdk-v2)
- [GitHub: MCP server](https://github.com/Infisical/infisical-mcp-server)
- [GitHub: AI skills](https://github.com/Infisical/ai-skills)
- [Discord community](https://infisical.com/slack)

## Связанные

- [`45-data-location.md`](../whg/45-data-location.md) — где живут какие значения
- [`holygrail-infisical` skill](../../.claude/skills/holygrail-infisical/SKILL.md) — workflow для агента
- [`37-scaffolding.md`](../whg/37-scaffolding.md) — scaffolding нового сайта
