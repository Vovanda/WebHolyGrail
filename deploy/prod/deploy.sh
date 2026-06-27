#!/usr/bin/env bash
# Blue-green deploy для site-site на VPS.
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
echo " Deploy site-site"
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

# Убедимся что external network существует
docker network inspect holygrail-net >/dev/null 2>&1 || docker network create holygrail-net

# 1. Pull новых images
echo
echo "→ Pulling images (tag=$TAG)..."
COLOR=$INACTIVE \
CMS_PORT=$INACTIVE_CMS_PORT \
CLIENT_PORT=$INACTIVE_CLIENT_PORT \
TAG=$TAG \
  "${INFISICAL_RUN[@]}" docker compose -p site-$INACTIVE -f "$COMPOSE_FILE" pull

# 2. Up inactive
echo
echo "→ Starting $INACTIVE..."
COLOR=$INACTIVE \
CMS_PORT=$INACTIVE_CMS_PORT \
CLIENT_PORT=$INACTIVE_CLIENT_PORT \
TAG=$TAG \
  "${INFISICAL_RUN[@]}" docker compose -p site-$INACTIVE -f "$COMPOSE_FILE" up -d

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
  docker logs --tail 30 "cms-$INACTIVE" 2>&1 | sed 's/^/     /'
  COLOR=$INACTIVE \
  CMS_PORT=$INACTIVE_CMS_PORT \
  CLIENT_PORT=$INACTIVE_CLIENT_PORT \
  TAG=$TAG \
    "${INFISICAL_RUN[@]}" docker compose -p site-$INACTIVE -f "$COMPOSE_FILE" down
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
if ! docker exec "cms-$INACTIVE" pnpm --filter cms migrate 2>&1 | tail -10; then
  echo "   ✗ migrate failed — rolling back"
  docker logs --tail 30 "cms-$INACTIVE" 2>&1 | sed 's/^/     /'
  COLOR=$INACTIVE \
  CMS_PORT=$INACTIVE_CMS_PORT \
  CLIENT_PORT=$INACTIVE_CLIENT_PORT \
  TAG=$TAG \
    "${INFISICAL_RUN[@]}" docker compose -p site-$INACTIVE -f "$COMPOSE_FILE" down
  exit 1
fi
echo "   ✓ migrations applied"

# 4. Switch nginx upstream symlink (хост путь = bind-mount в nginx container)
echo
echo "→ Switching nginx upstream → $INACTIVE..."
ln -sf "site-upstream-$INACTIVE.conf" /opt/proxy/nginx/snippets/site-upstream-active.conf
docker exec holygrail-nginx nginx -t
docker exec holygrail-nginx nginx -s reload
echo "   ✓ nginx reloaded"

# 5. Save state
echo "$INACTIVE" > "$STATE_FILE"

# 6. Wait + stop old color (если был ranee active)
if [ "$ACTIVE" != "$INACTIVE" ] && docker ps --format '{{.Names}}' | grep -q "cms-$ACTIVE"; then
  echo
  echo "→ Draining old $ACTIVE (5s grace)..."
  sleep 5
  if [ "$ACTIVE" = blue ]; then
    OLD_CMS_PORT=3001; OLD_CLIENT_PORT=3000
  else
    OLD_CMS_PORT=3011; OLD_CLIENT_PORT=3010
  fi
  COLOR=$ACTIVE \
  CMS_PORT=$OLD_CMS_PORT \
  CLIENT_PORT=$OLD_CLIENT_PORT \
  TAG=$TAG \
    "${INFISICAL_RUN[@]}" docker compose -p site-$ACTIVE -f "$COMPOSE_FILE" down
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
