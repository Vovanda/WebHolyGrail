#!/usr/bin/env bash
# deploy.sh — деплой veo55 на production VPS.
#
# Использование (с локальной машины):
#   VPS_HOST=user@1.2.3.4 ./deploy.sh
#
# Что делает:
#   1. rsync репо на VPS (исключая node_modules, .next, .git, data)
#   2. ssh: docker compose build + up -d
#   3. ssh: pnpm migrate (применить новые миграции)
#   4. smoke: curl https://<DOMAIN> + /admin
#
# Первый деплой — см. README.md (нужны certbot certs, infisical setup).

set -euo pipefail

: "${VPS_HOST:?VPS_HOST env required, e.g. user@1.2.3.4}"
: "${REMOTE_DIR:=/srv/veo55}"
: "${DOMAIN:=veo55.ru}"

echo "[deploy] target: $VPS_HOST → $REMOTE_DIR (domain: $DOMAIN)"

# --- 1. Sync code ---
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.tmp' \
  --exclude='*.bak-*' \
  --exclude='.env.local' \
  --exclude='.env.production' \
  --exclude='**/data/*.db' \
  --exclude='**/data/*.db.bak-*' \
  ./ "$VPS_HOST:$REMOTE_DIR/"

# --- 2. Build + restart stack ---
ssh "$VPS_HOST" "cd $REMOTE_DIR && \
  infisical run --env=prod -- docker compose \
    -f sites/veo55/deploy/prod/docker-compose.yml \
    up -d --build --remove-orphans"

# --- 3. Apply migrations внутри контейнера cms ---
ssh "$VPS_HOST" "docker exec veo55-cms pnpm --filter veo55-cms migrate"

# --- 4. Smoke ---
echo "[deploy] smoke checks…"
sleep 5
curl -sS -o /dev/null -w "  client: %{http_code}\n" "https://$DOMAIN/"
curl -sS -o /dev/null -w "  admin:  %{http_code}\n" "https://$DOMAIN/admin"
curl -sS -o /dev/null -w "  api:    %{http_code}\n" "https://$DOMAIN/api/access"

echo "[deploy] done."
