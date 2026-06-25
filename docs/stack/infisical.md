# Infisical

> Env-aware versioned key-value config storage. Cloud SaaS или self-host.
> В Holy Grail используется как **general-purpose config store** — секреты + env-dependent runtime + feature flags + rate limits. Не только для секретов. Подробнее — [`45-data-location.md`](../whg/45-data-location.md).

## Текущие версии

| Компонент | Версия | Проверка |
|---|---|---|
| CLI | latest stable | `infisical --version` |
| Node SDK `@infisical/sdk` | `^3.0.0` | в `package.json` |
| MCP server `@infisical/mcp` | latest | `npx @infisical/mcp --version` |

Релизы tracking:
- [CLI releases](https://github.com/Infisical/cli/releases)
- [SDK releases](https://github.com/Infisical/node-sdk-v2/releases) (новый SDK; legacy `infisical-node` deprecated)
- [MCP server releases](https://github.com/Infisical/infisical-mcp-server/releases)
- [Main server releases](https://github.com/Infisical/infisical/releases) (для self-host)

## Что мы используем

- **Cloud** (`app.infisical.com`) — текущий выбор. Free tier хватает на ~5 проектов / 200 секретов на проект.
- **Self-host** — на roadmap если упрёмся в free tier лимиты или захочется per-site автономии. Trade-offs описаны в `45-data-location.md`.
- **Auth method** — **Universal Auth** machine identities (legacy service tokens deprecated).
- **Local dev** — `dev-setup.sh` сетит дефолтные S3_*/PAYLOAD_SECRET/URL'ы в Infisical dev environment автоматически.
- **Prod** — `deploy/prod/deploy.sh` обёрнут `infisical run --env=prod`, контейнеры получают env при старте.

## Установка CLI (одноразово per машина)

| OS | Команда |
|---|---|
| macOS | `brew install infisical/get-cli/infisical` |
| Windows | `winget install Infisical.CLI` |
| Linux | `curl -1sLf 'https://artifacts-cli.infisical.com/install.sh' \| sh` |

Verify: `infisical --version`.

## Login (одноразово per машина)

```bash
infisical login
```

Browser-flow, токен сохраняется в системный keychain (macOS Keychain / Windows Credential Manager / Linux Secret Service).

CLI **не имеет** команды для печати session JWT в stdout — keychain непрозрачен для скриптов. Программный доступ — через **Universal Auth machine identity**, не через user-account токен.

## MCP server (для меня — Claude в этом репо)

Официальный `@infisical/mcp` экспонирует Infisical API как MCP tools для AI-агентов.

### Установка в Claude Code

```bash
claude mcp add infisical -- npx -y @infisical/mcp
```

Или вручную в `~/.claude/mcp.json` / `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "infisical": {
      "command": "npx",
      "args": ["-y", "@infisical/mcp"],
      "env": {
        "INFISICAL_UNIVERSAL_AUTH_CLIENT_ID": "<UA-client-id>",
        "INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET": "<UA-client-secret>",
        "INFISICAL_HOST_URL": "https://app.infisical.com"
      }
    }
  }
}
```

Verify: `claude mcp list` → должна быть запись `infisical`.

### Что MCP экспонирует (текущий набор tools)

- `create-secret`, `update-secret`, `delete-secret`, `list-secrets`, `get-secret`
- `create-project`, `list-projects`
- `create-environment`
- `create-folder`
- `invite-members-to-project`

### Что MCP **не** даёт (важно для chicken-egg)

Tools для admin operations:
- ❌ `create-identity`
- ❌ `attach-universal-auth`
- ❌ `create-client-secret`
- ❌ `add-identity-to-project`

Это значит — даже MCP **не решает chicken-egg**. Первая admin identity всё равно через UI один раз (см. секцию ниже).

## AI Skills repo (готовые гайды для агента)

`Infisical/ai-skills` — 6 официальных skills от Infisical:

| Skill | Что покрывает |
|---|---|
| `infisical-setup` | Интерактивный setup-гайд: CLI, SDK, Docker, K8s, CI/CD, 12 методов machine identity auth |
| `infisical-secret-syncs` | Sync секретов в 38+ внешних сервисов (AWS SM, GitHub, Vercel, Vault, …) |
| `infisical-dynamic-secrets` | Короткоживущие creds для 27 провайдеров (DB, IAM, SSH) |
| `infisical-agent` | Daemon agent — YAML config, auth, deploy patterns |
| `infisical-terraform` | Terraform Provider — ephemeral resources, OIDC integration |
| `infisical-api` | REST API reference: auth, CRUD, rate limits |

### Установка

```bash
# Через npx (для skills system)
npx skills add Infisical/ai-skills

# Или через Claude Code plugin marketplace
/plugin marketplace add Infisical/ai-skills
```

Также есть **docs-only MCP** без auth (только публичные docs):

```bash
claude mcp add --transport http infisical-docs https://infisical.com/docs/mcp
```

Полезно для быстрого поиска по официальной документации Infisical из Claude.

## Chicken-egg: первая admin identity

Cloud Infisical **by design** требует pre-existing machine identity для admin REST endpoints (создать project / identity / environment). Первая identity невозможна без уже существующей.

**Решение:** один раз в UI создать admin identity с org-admin role:

1. https://app.infisical.com → Organization → Settings → Access Control → **Identities** → Create Identity
2. Name: `claude-scaffold-admin`, Auth Method: Universal Auth, Role: **Admin** (org-level)
3. После создания → Authentication Methods → Universal Auth → **Add Client Secret**
4. Сохранить Client ID + Client Secret (показывается **один раз** — обязательно скопировать)
5. Положить в shell env / `claude_desktop_config.json` / MCP server config:
   ```
   INFISICAL_UNIVERSAL_AUTH_CLIENT_ID=<...>
   INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET=<...>
   ```

После этого — все scaffold / rotate / debug операции автоматизированы через REST либо MCP server.

**Self-host обходит chicken-egg** через команду `infisical bootstrap` — она создаёт admin user + org + admin identity автоматически при первой инициализации. Trade-offs Cloud vs self-host — в `45-data-location.md`.

## REST endpoints что я использую

| Operation | Endpoint | Auth |
|---|---|---|
| Login machine identity | `POST /api/v1/auth/universal-auth/login` `{ clientId, clientSecret }` → `{ accessToken }` | clientId/secret |
| Create project | `POST /api/v2/workspace` `{ projectName, type, slug }` | Bearer |
| Create environment | `POST /api/v1/workspace/{projectId}/environments` `{ name, slug, position }` | Bearer |
| Create / update secret | `POST/PATCH /api/v3/secrets/raw/{key}` | Bearer |
| Create identity | `POST /api/v1/identities` `{ name, organizationId, role }` | Bearer (admin) |
| Attach Universal Auth | `POST /api/v1/auth/universal-auth/identities/{id}` | Bearer (admin) |
| Create client secret | `POST /api/v1/auth/universal-auth/identities/{id}/client-secrets` `{ description, ttl }` | Bearer (admin) |
| Add identity to project | TODO — verify endpoint при первом scaffold (предположительно `POST /api/v2/workspace/{projectId}/identity-memberships/{identityId}` или подобный) | Bearer (admin) |

Полный API reference — [REST API docs](https://infisical.com/docs/api-reference/overview/introduction).

## Когда апдейтить

| Что | Когда |
|---|---|
| CLI patch / minor | при следующем `brew upgrade` / `winget upgrade` |
| CLI major | quarterly review (см. `40-versions.md`) |
| `@infisical/sdk` patch / minor | через `pnpm up @infisical/sdk` |
| `@infisical/sdk` major | проверить changelog, обновить наш `scripts/setup-infisical.ts` если API менялся |
| MCP server | `npx -y @infisical/mcp` берёт latest по дефолту — авто |
| AI skills | `npx skills add Infisical/ai-skills` периодически — апдейтит skills |

## Известные ограничения и watch list

- Free tier лимиты — ~5 проектов / 200 секретов на проект (точные цифры могут меняться, см. [pricing](https://infisical.com/pricing))
- SDK не имеет identity management методов (только secrets) — admin ops через REST
- MCP server tools не покрывают identity management (chicken-egg)
- CLI не печатает session JWT в stdout — keychain непрозрачен для скриптов
- Cold-start latency растёт с числом секретов (см. `45-data-location.md` watchlist)
- Vendor lock-in на Cloud SaaS — миграция на self-host механическая через export/import + смену `INFISICAL_HOST_URL`

## Ссылки

- [Сайт](https://infisical.com/)
- [Docs index](https://infisical.com/docs)
- [REST API reference](https://infisical.com/docs/api-reference/overview/introduction)
- [llms.txt (для AI агентов)](https://infisical.com/docs/llms.txt)
- [GitHub: главный сервер](https://github.com/Infisical/infisical)
- [GitHub: CLI](https://github.com/Infisical/cli)
- [GitHub: Node SDK](https://github.com/Infisical/node-sdk-v2)
- [GitHub: MCP server](https://github.com/Infisical/infisical-mcp-server)
- [GitHub: AI skills](https://github.com/Infisical/ai-skills)
- [GitHub: Terraform provider](https://github.com/Infisical/terraform-provider-infisical)
- [Discord community](https://infisical.com/slack)

## Связанные

- [`45-data-location.md`](../whg/45-data-location.md) — где живут какие значения (Payload / Infisical / код)
- [`holygrail-infisical` skill](../../.claude/skills/holygrail-infisical/SKILL.md) — workflow для агента
- [`37-scaffolding.md`](../whg/37-scaffolding.md) — scaffolding нового сайта (там Infisical bootstrap шаг)
