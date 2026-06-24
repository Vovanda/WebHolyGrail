#!/usr/bin/env bash
# Blue-green deploy для veo55-site на VPS.
# Запускается локально на VPS (вызывается из GitHub Actions через SSH).
#
# Использование:
#   /opt/sites/veo55/deploy/prod/deploy.sh [TAG]
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
ENV_FILE="$SCRIPT_DIR/.env.production"
STATE_FILE="$SITE_DIR/ACTIVE_COLOR"

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
echo " Deploy veo55-site"
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
  CURRENT_SHA=$(curl -sf --max-time 3 "http://localhost:$ACTIVE_CLIENT_PORT/api/_status" 2>/dev/null \
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
docker network inspect veo55-net >/dev/null 2>&1 || docker network create veo55-net

# 1. Pull новых images
echo
echo "→ Pulling images (tag=$TAG)..."
COLOR=$INACTIVE \
CMS_PORT=$INACTIVE_CMS_PORT \
CLIENT_PORT=$INACTIVE_CLIENT_PORT \
TAG=$TAG \
  docker compose -p veo55-$INACTIVE --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull

# 2. Up inactive
echo
echo "→ Starting $INACTIVE..."
COLOR=$INACTIVE \
CMS_PORT=$INACTIVE_CMS_PORT \
CLIENT_PORT=$INACTIVE_CLIENT_PORT \
TAG=$TAG \
  docker compose -p veo55-$INACTIVE --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

# 3. Healthcheck loop — 60 секунд total (30 итераций × 2 сек)
echo
echo "→ Healthcheck loop (max 60s)..."
HEALTHY=false
for i in $(seq 1 30); do
  if curl -sf --max-time 3 "http://localhost:$INACTIVE_CMS_PORT/api/access" >/dev/null 2>&1 && \
     curl -sf --max-time 3 "http://localhost:$INACTIVE_CLIENT_PORT/api/_status" >/dev/null 2>&1; then
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
  docker logs --tail 30 "veo55-cms-$INACTIVE" 2>&1 | sed 's/^/     /'
  COLOR=$INACTIVE \
  CMS_PORT=$INACTIVE_CMS_PORT \
  CLIENT_PORT=$INACTIVE_CLIENT_PORT \
  TAG=$TAG \
    docker compose -p veo55-$INACTIVE --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
  exit 1
fi

# 4. Switch nginx upstream symlink (хост путь = bind-mount в nginx container)
echo
echo "→ Switching nginx upstream → $INACTIVE..."
ln -sf "veo55-upstream-$INACTIVE.conf" /opt/proxy/nginx/snippets/veo55-upstream-active.conf
docker exec holygrail-nginx nginx -t
docker exec holygrail-nginx nginx -s reload
echo "   ✓ nginx reloaded"

# 5. Save state
echo "$INACTIVE" > "$STATE_FILE"

# 6. Wait + stop old color (если был ranee active)
if [ "$ACTIVE" != "$INACTIVE" ] && docker ps --format '{{.Names}}' | grep -q "veo55-cms-$ACTIVE"; then
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
    docker compose -p veo55-$ACTIVE --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
  echo "   ✓ $ACTIVE stopped"
fi

echo
echo "═══════════════════════════════════════════════════════"
echo " ✓ Deploy done. Active: $INACTIVE, tag: $TAG"
echo "═══════════════════════════════════════════════════════"
