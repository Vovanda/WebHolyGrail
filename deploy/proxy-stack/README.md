# Proxy stack — Holy Grail VPS-base

Глобальный nginx (host network, Docker) + certbot для всех Holy Grail сайтов на одном VPS. Per-site vhost'ы кладутся в `nginx/conf.d/<domain>.conf`.

## Структура

```
deploy/proxy-stack/
├── docker-compose.yml             # nginx + certbot
├── nginx/
│   ├── nginx.conf                 # глобал: gzip, HTTP/3, scanner-block, ACME-аware default
│   ├── snippets/
│   │   ├── ssl-modern.conf            # TLS 1.2/1.3 modern profile
│   │   ├── security-headers.conf      # HSTS, X-Frame, Referrer-Policy
│   │   ├── proxy-upstream.conf        # стандартный proxy_set_header набор для Next/Payload
│   │   ├── site-upstream-blue.conf.template   # ← per-site, переименовать <site>-upstream-blue.conf
│   │   └── site-upstream-green.conf.template  # ← per-site
│   └── conf.d/
│       └── site.conf.template     # ← per-site vhost (HTTP→HTTPS, /admin /api /_payload в upstream)
└── certs/                          # /etc/letsencrypt/ bind-mount (генерируется certbot'ом)
```

## Деплой на новый VPS

```bash
# на VPS:
sudo mkdir -p /opt/proxy
sudo chown deploy:deploy /opt/proxy

# с локалки:
scp -r deploy/proxy-stack/* deploy@<vps>:/opt/proxy/

# на VPS:
cd /opt/proxy
docker compose up -d
```

## Добавить новый сайт

Для каждого сайта на VPS:

1. **Скопировать template'ы и подставить значения:**

   ```bash
   cd /opt/proxy/nginx
   SITE=mysite DOMAIN=mysite.ru

   sed "s/{{SITE}}/$SITE/g; s/{{DOMAIN}}/$DOMAIN/g; s/{{CMS_PORT_BLUE}}/3001/; s/{{CLIENT_PORT_BLUE}}/3000/" \
     snippets/site-upstream-blue.conf.template > snippets/${SITE}-upstream-blue.conf

   sed "s/{{SITE}}/$SITE/g; s/{{DOMAIN}}/$DOMAIN/g; s/{{CMS_PORT_GREEN}}/3011/; s/{{CLIENT_PORT_GREEN}}/3010/" \
     snippets/site-upstream-green.conf.template > snippets/${SITE}-upstream-green.conf

   ln -sf ${SITE}-upstream-blue.conf snippets/${SITE}-upstream-active.conf

   sed "s/{{SITE}}/$SITE/g; s/{{DOMAIN}}/$DOMAIN/g" \
     conf.d/site.conf.template > conf.d/$DOMAIN.conf
   ```

2. **Выпустить cert:**

   ```bash
   cd /opt/proxy
   docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
     --agree-tos --no-eff-email --email <admin>@<domain> \
     -d <domain> -d www.<domain>
   ```

3. **Reload nginx:**
   ```bash
   docker compose exec nginx nginx -t
   docker compose exec nginx nginx -s reload
   ```

> Detailed: см. `architecture/Template ↔ Instance workflow` в MCP `HolyGrail` workspace.
> Полный чеклист первого деплоя VPS — `deployment/Чеклист первого деплоя Holy Grail site` в том же workspace.

## Авто-продление certs

`/etc/cron.d/certbot-renew` (создать руками или через ansible):

```cron
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
0 */12 * * * root sleep $((RANDOM % 3600)) && cd /opt/proxy && /usr/bin/docker compose run --rm certbot renew --quiet && /usr/bin/docker compose exec -T nginx nginx -s reload
```

Каждые 12 ч с random jitter — стандартная практика LE. `certbot renew` — no-op если до истечения >30 дней.
