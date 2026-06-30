#!/usr/bin/env bash
# Blue-green deploy для Holy Grail site на VPS.
# Запускается локально на VPS (вызывается из GitHub Actions через SSH).
#
# Использование:
#   /opt/sites/site/deploy/prod/deploy.sh [TAG]
#
# TAG = git SHA из GH Actions (default: latest).
#
# Логика:
#   1. Прочитать текущий active color (default blue если первый запуск)
#   2. Pull новых images для inactive color
#   3. Up inactive color на свободных портах
#   4. Healthcheck loop (60 сек total)
#   5. Switch nginx upstream symlink → reload
#   6. Stop старый color (5 сек на in-flight)
#
# При failure healthcheck — rollback (down inactive, active не трогаем).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/compose.bluegreen.yml"
STATE_FILE="$SITE_DIR/ACTIVE_COLOR"

# ── Secrets via Infisical ───────────────────────────────────────────────
# Per-site Universal Auth machine identity. Creds живут в:
#   /etc/infisical/<slug>/client-id      (chmod 600 deploy:deploy)
#   /etc/infisical/<slug>/client-secret  (chmod 600 deploy:deploy)
#
# Скрипт делает `infisical login --method=universal-auth ...` → JWT, потом
# каждый `docker compose ...` оборачивает в `infisical run --token=$JWT --env=prod`,
# чтобы секреты летели в env контейнеров без записи на диск.
#
# Multi-site (несколько Holy Grail сайтов на одной VPS) — каждый имеет
# свою папку `/etc/infisical/<slug>/`, изолированную RBAC'ом Infisical.
#
# Slug определяется (по убыванию приоритета): $SITE_SLUG env → basename
# директории сайта. Hostname Infisical instance — $INFISICAL_HOST_URL env.
SITE_SLUG="${SITE_SLUG:-$(basename "$SITE_DIR")}"
INFISICAL_ENV="${INFISICAL_ENV:-prod}"
INFISICAL_HOST_URL="${INFISICAL_HOST_URL:-}"
CREDS_DIR="/etc/infisical/$SITE_SLUG"

if ! command -v infisical >/dev/null 2>&1; then
  echo "ERROR: infisical CLI not installed on this host." >&2
  echo "Install: curl -1sLf 'https://artifacts-cli.infisical.com/install.sh' | sh" >&2
  exit 1
fi
if [ -z "$INFISICAL_HOST_URL" ]; then
  echo "ERROR: INFISICAL_HOST_URL env not set (e.g. https://infisical.example.com)." >&2
  exit 1
fi
if [ ! -r "$CREDS_DIR/client-id" ] || [ ! -r "$CREDS_DIR/client-secret" ]; then
  echo "ERROR: $CREDS_DIR/{client-id,client-secret} not readable." >&2
  echo "Set them up via \`pnpm setup-infisical -- --site $SITE_SLUG\` output." >&2
  exit 1
fi

echo "→ Infisical login (slug=$SITE_SLUG, env=$INFISICAL_ENV, host=$INFISICAL_HOST_URL)"
INFISICAL_TOKEN="$(infisical login --method=universal-auth \
  --client-id="$(cat "$CREDS_DIR/client-id")" \
  --client-secret="$(cat "$CREDS_DIR/client-secret")" \
  --domain="$INFISICAL_HOST_URL" \
  --plain --silent)"
if [ -z "$INFISICAL_TOKEN" ]; then
  echo "ERROR: infisical login returned empty token" >&2
  exit 1
fi
INFISICAL_RUN=(infisical run --token="$INFISICAL_TOKEN" --domain="$INFISICAL_HOST_URL" --env="$INFISICAL_ENV" --)

TAG="${1:-latest}"
ACTIVE="$(cat "$STATE_FILE" 2>/dev/null || echo blue)"
INACTIVE=$([ "$ACTIVE" = blue ] && echo green || echo blue)

if [ "$INACTIVE" = blue ]; then
  INACTIVE_CMS_PORT=3001
  INACTIVE_CLIENT_PORT=3000
else
  INACTIVE_CMS_PORT=3011
  INACTIVE_CLIENT_PORT=3010
fi

echo "═══════════════════════════════════════════════════════"
echo " Deploy $SITE_SLUG"
echo "   active   : $ACTIVE"
echo "   inactive : $INACTIVE (cms=$INACTIVE_CMS_PORT, client=$INACTIVE_CLIENT_PORT)"
echo "   image tag: $TAG"
echo "═══════════════════════════════════════════════════════"

# Idempotency — skip если запрошенный SHA уже задеплоен на active.
# (актуально при workflow rerun / повторных triggers того же commit'а)
if [ "$TAG" != "latest" ] && [ "$ACTIVE" != "" ]; then
  if [ "$ACTIVE" = blue ]; then
    ACTIVE_CLIENT_PORT=3000
  else
    ACTIVE_CLIENT_PORT=3010
  fi
  CURRENT_SHA=$(curl -sf --max-time 3 "http://localhost:$ACTIVE_CLIENT_PORT/api/health" 2>/dev/null \
                 | jq -r '.sha' 2>/dev/null || echo "")
  EXPECTED_SHORT=$(echo "$TAG" | cut -c1-7)
  if [ -n "$CURRENT_SHA" ] && [ "$CURRENT_SHA" = "$EXPECTED_SHORT" ]; then
    echo
    echo "✓ SHA $EXPECTED_SHORT уже задеплоен на $ACTIVE — skip"
    exit 0
  fi
fi

cd "$SCRIPT_DIR"

# Убедимся что external network существует (per-site, согласно compose.bluegreen.yml)
docker network inspect "$SITE_SLUG-net" >/dev/null 2>&1 || docker network create "$SITE_SLUG-net"

# ── Pre-flight: ensure-site-infra ────────────────────────────────────────
# Идемпотентно (no-op если всё уже на месте). Делает то, что забыли вручную при
# первом деплое нового сайта: MinIO bucket, nginx site-conf, LE-cert. Без этого
# первый деплой выходит с 502 / 404 на media / placeholder без серта.
#
# Требует на VPS:
#   - PRIMARY_DOMAIN env (или $1, или из ${SITE_SLUG}.conf если уже есть)
#   - admin email для certbot — $CERTBOT_EMAIL env (fallback noreply@$PRIMARY_DOMAIN)
#   - shared host-nginx container `holygrail-nginx` (host-network mode)
#   - MinIO container `minio` доступен на 127.0.0.1:9100
PRIMARY_DOMAIN="${PRIMARY_DOMAIN:-}"
NGINX_CONFD="/opt/proxy/nginx/conf.d"
NGINX_SNIPPETS="/opt/proxy/nginx/snippets"
CERTS_ROOT="/opt/proxy/certs"
WEBROOT="/opt/proxy/nginx/webroot"

if [ -z "$PRIMARY_DOMAIN" ] && [ -f "$NGINX_CONFD/${SITE_SLUG}.conf" ]; then
  PRIMARY_DOMAIN="$(awk '/server_name/ && !/www\./ {print $2; exit}' "$NGINX_CONFD/${SITE_SLUG}.conf" | tr -d ';')"
fi
if [ -z "$PRIMARY_DOMAIN" ]; then
  echo "ERROR: PRIMARY_DOMAIN env not set and не удалось вывести из nginx-conf." >&2
  echo "Set: PRIMARY_DOMAIN=<your-domain> $0 $TAG" >&2
  exit 1
fi
CERTBOT_EMAIL="${CERTBOT_EMAIL:-noreply@${PRIMARY_DOMAIN}}"

echo
echo "→ Pre-flight ensure-site-infra (domain=$PRIMARY_DOMAIN)"

# 1. MinIO bucket для media (same-origin proxy через /media/).
BUCKET="${SITE_SLUG}-media"
if ! docker exec minio mc ls "local/${BUCKET}" >/dev/null 2>&1; then
  echo "   • create MinIO bucket: $BUCKET"
  docker exec minio mc mb "local/${BUCKET}" >/dev/null
fi
docker exec minio mc anonymous set download "local/${BUCKET}" >/dev/null 2>&1 || true

# 2. nginx upstream snippets per-color (blue=3000/3001, green=3010/3011).
TEMPLATE_DIR="$(cd "$SCRIPT_DIR/../proxy-stack/nginx" && pwd)"
for color in blue green; do
  snip="$NGINX_SNIPPETS/${SITE_SLUG}-upstream-${color}.conf"
  if [ ! -f "$snip" ]; then
    sed "s/<SITE_SLUG>/${SITE_SLUG}/g" \
      "$TEMPLATE_DIR/snippets/site-upstream-${color}.conf.template" \
      | sudo tee "$snip" >/dev/null
    echo "   • generated $snip"
  fi
done
# active symlink (blue по умолчанию для первого деплоя — deploy.sh ниже переключит).
if [ ! -L "$NGINX_SNIPPETS/${SITE_SLUG}-upstream-active.conf" ]; then
  sudo ln -sf "${SITE_SLUG}-upstream-blue.conf" "$NGINX_SNIPPETS/${SITE_SLUG}-upstream-active.conf"
fi

# 3. nginx site vhost из template (если ещё нет).
vhost="$NGINX_CONFD/${SITE_SLUG}.conf"
if [ ! -f "$vhost" ]; then
  sed -e "s/<PRIMARY_DOMAIN>/${PRIMARY_DOMAIN}/g" \
      -e "s/<SITE_SLUG>/${SITE_SLUG}/g" \
      "$TEMPLATE_DIR/conf.d/site.conf.template" \
      | sudo tee "$vhost" >/dev/null
  echo "   • generated $vhost"

  # На самом первом старте серта ещё нет — nginx упадёт. Кладём временный
  # HTTP-only vhost (только ACME-challenge + redirect), выпускаем серт,
  # затем переставляем full TLS-vhost.
  tmp_vhost="$NGINX_CONFD/${SITE_SLUG}.conf.tmp"
  sudo mv "$vhost" "$tmp_vhost"
  sudo tee "$vhost" >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${PRIMARY_DOMAIN};
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files \$uri =404;
    }
    location / { return 503 'cert pending'; }
}
EOF
  docker exec holygrail-nginx nginx -s reload >/dev/null 2>&1 || true
fi

# 4. LE-cert через certbot/certbot docker (webroot challenge).
if [ ! -f "$CERTS_ROOT/live/${PRIMARY_DOMAIN}/fullchain.pem" ]; then
  echo "   • issuing LE cert for $PRIMARY_DOMAIN"
  sudo docker run --rm \
    -v "$CERTS_ROOT:/etc/letsencrypt" \
    -v "$WEBROOT:/var/www/certbot" \
    certbot/certbot:latest certonly \
    --webroot --webroot-path=/var/www/certbot \
    -d "$PRIMARY_DOMAIN" \
    --email "$CERTBOT_EMAIL" --agree-tos --no-eff-email --non-interactive \
    --keep-until-expiring

  # Серт получен — поставить full TLS vhost (если выше клали tmp HTTP-only).
  if [ -f "$NGINX_CONFD/${SITE_SLUG}.conf.tmp" ]; then
    sudo mv "$NGINX_CONFD/${SITE_SLUG}.conf.tmp" "$vhost"
  fi
fi

# 5. Reload nginx чтобы подцепить vhost / новый серт (idempotent).
docker exec holygrail-nginx nginx -t >/dev/null 2>&1 && \
  docker exec holygrail-nginx nginx -s reload >/dev/null 2>&1 || true
echo "   ✓ infra ready"

# 1. Pull новых images
echo
echo "→ Pulling images (tag=$TAG)..."
SITE_SLUG=$SITE_SLUG \
COLOR=$INACTIVE \
CMS_PORT=$INACTIVE_CMS_PORT \
CLIENT_PORT=$INACTIVE_CLIENT_PORT \
TAG=$TAG \
  "${INFISICAL_RUN[@]}" docker compose -p "$SITE_SLUG-$INACTIVE" -f "$COMPOSE_FILE" pull

# 2. Up inactive
echo
echo "→ Starting $INACTIVE..."
SITE_SLUG=$SITE_SLUG \
COLOR=$INACTIVE \
CMS_PORT=$INACTIVE_CMS_PORT \
CLIENT_PORT=$INACTIVE_CLIENT_PORT \
TAG=$TAG \
  "${INFISICAL_RUN[@]}" docker compose -p "$SITE_SLUG-$INACTIVE" -f "$COMPOSE_FILE" up -d

# 3. Healthcheck loop — 60 секунд total (30 итераций × 2 сек)
echo
echo "→ Healthcheck loop (max 60s)..."
HEALTHY=false
for i in $(seq 1 30); do
  if curl -sf --max-time 3 "http://localhost:$INACTIVE_CMS_PORT/api/access" >/dev/null 2>&1 && \
     curl -sf --max-time 3 "http://localhost:$INACTIVE_CLIENT_PORT/api/health" >/dev/null 2>&1; then
    echo "   ✓ $INACTIVE healthy (after $((i*2))s)"
    HEALTHY=true
    break
  fi
  sleep 2
done

if [ "$HEALTHY" != true ]; then
  echo
  echo "   ✗ $INACTIVE failed healthcheck after 60s — rolling back"
  echo "   cms logs (last 30):"
  docker logs --tail 30 "$SITE_SLUG-cms-$INACTIVE" 2>&1 | sed 's/^/     /'
  SITE_SLUG=$SITE_SLUG \
  COLOR=$INACTIVE \
  CMS_PORT=$INACTIVE_CMS_PORT \
  CLIENT_PORT=$INACTIVE_CLIENT_PORT \
  TAG=$TAG \
    "${INFISICAL_RUN[@]}" docker compose -p "$SITE_SLUG-$INACTIVE" -f "$COMPOSE_FILE" down
  exit 1
fi

# 3.5. Auto-migrate. Идемпотентно: `payload migrate` skip'ает уже применённые.
# Запускается ДО switch nginx — чтобы новый цвет получил актуальную schema до
# того как принять traffic. Старый цвет ещё работает на старой schema; для
# expand-only миграций это safe (см. payload-migration skill, blue-green safety).
# Для несовместимых rename/drop — миграция может временно сломать старый цвет
# (~5-10 сек до switch). Это редкий path, помечать `// @needs-maintenance`.
echo
echo "→ Applying migrations (pnpm migrate)..."
if ! docker exec "$SITE_SLUG-cms-$INACTIVE" pnpm --filter cms migrate 2>&1 | tail -10; then
  echo "   ✗ migrate failed — rolling back"
  docker logs --tail 30 "$SITE_SLUG-cms-$INACTIVE" 2>&1 | sed 's/^/     /'
  SITE_SLUG=$SITE_SLUG \
  COLOR=$INACTIVE \
  CMS_PORT=$INACTIVE_CMS_PORT \
  CLIENT_PORT=$INACTIVE_CLIENT_PORT \
  TAG=$TAG \
    "${INFISICAL_RUN[@]}" docker compose -p "$SITE_SLUG-$INACTIVE" -f "$COMPOSE_FILE" down
  exit 1
fi
echo "   ✓ migrations applied"

# 4. Switch nginx upstream symlink (хост путь = bind-mount в nginx container).
# Snippets именованы per-site чтобы несколько Holy Grail сайтов могли стоять
# рядом на одной VPS без конфликтов имён.
echo
echo "→ Switching nginx upstream → $INACTIVE..."
ln -sf "$SITE_SLUG-upstream-$INACTIVE.conf" "/opt/proxy/nginx/snippets/$SITE_SLUG-upstream-active.conf"
docker exec holygrail-nginx nginx -t
docker exec holygrail-nginx nginx -s reload
echo "   ✓ nginx reloaded"

# 5. Save state
echo "$INACTIVE" > "$STATE_FILE"

# 6. Wait + stop old color (если был ranee active)
if [ "$ACTIVE" != "$INACTIVE" ] && docker ps --format '{{.Names}}' | grep -q "$SITE_SLUG-cms-$ACTIVE"; then
  echo
  echo "→ Draining old $ACTIVE (5s grace)..."
  sleep 5
  if [ "$ACTIVE" = blue ]; then
    OLD_CMS_PORT=3001; OLD_CLIENT_PORT=3000
  else
    OLD_CMS_PORT=3011; OLD_CLIENT_PORT=3010
  fi
  SITE_SLUG=$SITE_SLUG \
  COLOR=$ACTIVE \
  CMS_PORT=$OLD_CMS_PORT \
  CLIENT_PORT=$OLD_CLIENT_PORT \
  TAG=$TAG \
    "${INFISICAL_RUN[@]}" docker compose -p "$SITE_SLUG-$ACTIVE" -f "$COMPOSE_FILE" down
  echo "   ✓ $ACTIVE stopped"
fi


# 7. Post-success housekeeping — удалить unused images / containers / buildx-
# cache. Делается после успешного switch чтобы освободить место под следующий
# deploy. Активные blue/green контейнеры удерживают свои images — они НЕ будут
# затронуты. `docker image prune -af` удалит только unused (старые SHA-теги,
# базовые слои не attached). buildx prune --keep-storage 2GB — компромисс между
# скоростью кэша и распуханием. На VPS с 5+ сайтами в будущем это обязательная
# дисциплина — без неё 80 GB забьются за 10-15 deploy'ев.
echo
echo "→ Post-deploy cleanup (unused images / buildx cache)..."
docker image prune -af 2>&1 | grep -E "Total reclaimed|deleted:" | tail -3 | sed 's/^/   /'
docker container prune -f 2>&1 | grep -E "Total reclaimed" | tail -1 | sed 's/^/   /'
docker buildx prune -af --keep-storage 2GB 2>&1 | grep -E "Total" | tail -1 | sed 's/^/   /'
echo "   Disk: $(df -h / | tail -1 | awk '{print $3" used / "$2" ("$5")"}')"

echo
echo "═══════════════════════════════════════════════════════"
echo " ✓ Deploy done. Active: $INACTIVE, tag: $TAG"
echo "═══════════════════════════════════════════════════════"
