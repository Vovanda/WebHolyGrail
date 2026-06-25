# Self-host Infisical instance (VPS-shared, один на всю VPS)

Generic compose для self-host Infisical, **shared между всеми Holy Grail сайтами на одной VPS**.

> **1 VPS = 1 Infisical instance**. Не клонировать per-site. Каждый сайт = отдельный
> _project_ внутри этого instance (native Infisical RBAC изоляция).
> См. `docs/stack/infisical.md` → «Архитектура».

Рядом в `deploy/`:

- `deploy/proxy-stack/` — host-nginx + certbot, тоже VPS-shared (TLS для всех сайтов + Infisical)
- `deploy/prod/` — per-site blue-green compose (клонируется в `/opt/sites/<slug>/`)
- `deploy/local/` — per-developer local dev (MinIO)

См. также:

- `docs/stack/infisical.md` — стек, версии, инструменты
- `.claude/skills/whg-infisical/SKILL.md` — workflow для агента (REST/CLI/UI пути)
- `.claude/skills/infisical-self-host/` — официальный skill (downloaded)

## Установка на VPS (один раз навсегда)

```bash
# 1. Папка под shared instance
sudo mkdir -p /opt/infisical && sudo chown $USER:$USER /opt/infisical

# 2. Скопировать compose + env-template (scp с локальной машины
#    или из любого клонированного template-репо в /opt/infisical/)
cp deploy/infisical/docker-compose.yml /opt/infisical/
cp deploy/infisical/.env.example /opt/infisical/.env

# 3. Заполнить .env
cd /opt/infisical
sed -i "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$(openssl rand -hex 16)|"      .env
sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -base64 32)|"          .env
sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" .env
sed -i "s|^SITE_URL=.*|SITE_URL=https://infisical.example.com|"         .env
chmod 600 .env

# 4. Запуск
docker compose up -d
docker compose logs -f infisical    # ждать "Server listening on port 8080"

# 5. Health
curl http://localhost:8080/api/status
# → {"date":"...","message":"Ok","emailConfigured":false,...}

# 6. Bootstrap admin identity (один раз)
docker exec infisical-api infisical bootstrap \
  --email admin@example.com \
  --password "$(openssl rand -hex 32)" \
  --organization "Holy Grail Sites" \
  --output json > /opt/infisical/.bootstrap.json
chmod 600 /opt/infisical/.bootstrap.json
cat /opt/infisical/.bootstrap.json   # сохрани identity.credentials и user.password
```

Bootstrap output (JSON) содержит:

- `identity.credentials.clientId` / `clientSecret` — admin UA для programmatic scaffold
- `identity.organization.id` — orgId
- `user.email` / `user.password` — для входа в Web UI

Кладёшь в personal env (на твоей машине):

```
INFISICAL_HOST_URL=https://infisical.example.com
INFISICAL_ADMIN_CLIENT_ID=<...>
INFISICAL_ADMIN_CLIENT_SECRET=<...>
INFISICAL_ADMIN_ORG_ID=<...>
```

Дальше `pnpm setup-infisical -- --site <slug>` создаёт project для нового сайта автоматически.

## Reverse proxy + TLS

Через host-nginx (`deploy/proxy-stack/`) добавить server-блок:

```nginx
server {
  listen 443 ssl http2;
  server_name infisical.example.com;

  ssl_certificate     /etc/letsencrypt/live/infisical.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/infisical.example.com/privkey.pem;

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

Сертификат: `sudo certbot --nginx -d infisical.example.com`.

## Бэкап

`ENCRYPTION_KEY` потерян → БД нечитаема. Хранить в encrypted Vault + personal MCP.

Daily pg_dump:

```bash
docker exec infisical-postgres pg_dump -U infisical infisical | gzip > /backups/infisical-$(date +%F).sql.gz
```

## Апгрейд

1. Backup БД (см. выше).
2. Изменить tag в `docker-compose.yml` (pinned version, не `latest`).
3. `docker compose pull && docker compose up -d`.
4. Schema migrations накатываются автоматически на boot.
