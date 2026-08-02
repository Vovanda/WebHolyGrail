#!/usr/bin/env bash
# First-time setup: install Infisical, log in, link this folder to the project,
# поднять локальный MinIO для S3-storage в dev.
# Run once per machine / per fresh clone.

set -e
cd "$(dirname "$0")"

echo ""
echo "  Holy Grail dev-setup"
echo ""

# 1. Infisical CLI.
if ! command -v infisical >/dev/null 2>&1; then
  echo "  ERROR: infisical CLI not found."
  echo "  Install:"
  echo "    macOS:    brew install infisical/get-cli/infisical"
  echo "    Windows:  winget install Infisical.CLI"
  echo "    Linux:    curl -1sLf 'https://artifacts-cli.infisical.com/install.sh' | sh"
  echo ""
  exit 1
fi
echo "  [ok]   infisical CLI: $(infisical --version 2>&1 | head -1)"

# 2. Docker (нужен для MinIO).
if ! command -v docker >/dev/null 2>&1; then
  echo "  ERROR: docker не найден — нужен для локального MinIO (S3 storage в dev)."
  echo "  Install: https://docs.docker.com/get-docker/"
  echo ""
  exit 1
fi
echo "  [ok]   docker: $(docker --version 2>&1 | head -1)"

# 3. Infisical login.
if ! infisical user 2>/dev/null | grep -q '@'; then
  echo "  [next] running 'infisical login' — sign in via browser"
  infisical login
else
  echo "  [ok]   уже залогинен в Infisical"
fi

# 4. Linking folder to Infisical project.
if [ -f .infisical.json ]; then
  echo "  [ok]   .infisical.json уже есть — skip init"
else
  echo "  [next] running 'infisical init' — выбери проект для этого сайта"
  infisical init
fi

# 5. Поднять MinIO (локальный S3 для dev).
echo ""
echo "  → Поднимаем MinIO (S3-compatible storage для dev)..."
docker compose --profile minio -f deploy/local/docker-compose.yml up -d minio minio-init >/dev/null 2>&1
echo "  [ok]   MinIO API → http://localhost:9000  (bucket: local-media)"
echo "         MinIO UI  → http://localhost:9001  (minioadmin / minioadmin)"

# 6. Установить дефолтные S3_* в Infisical dev env (если пустые).
echo ""
echo "  → Проверяем S3_* секреты в Infisical dev env..."

set_if_empty() {
  local key="$1"
  local default_value="$2"
  local current=$(infisical secrets get "$key" --env=dev --plain 2>/dev/null || echo "")
  if [ -z "$current" ]; then
    infisical secrets set "$key=$default_value" --env=dev >/dev/null 2>&1
    echo "  [set]  $key (dev)"
  else
    echo "  [ok]   $key already set in dev"
  fi
}

set_if_empty "S3_BUCKET" "local-media"
set_if_empty "S3_REGION" "us-east-1"
set_if_empty "S3_ENDPOINT" "http://localhost:9000"
set_if_empty "S3_PUBLIC_URL" "http://localhost:9000/local-media"
set_if_empty "S3_ACCESS_KEY_ID" "minioadmin"
set_if_empty "S3_SECRET_ACCESS_KEY" "minioadmin"

# 7. PAYLOAD_SECRET если не задан — сгенерировать.
PAYLOAD_SECRET_CURRENT=$(infisical secrets get PAYLOAD_SECRET --env=dev --plain 2>/dev/null || echo "")
if [ -z "$PAYLOAD_SECRET_CURRENT" ]; then
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  infisical secrets set "PAYLOAD_SECRET=$SECRET" --env=dev >/dev/null 2>&1
  echo "  [set]  PAYLOAD_SECRET (dev) — сгенерирован"
fi

set_if_empty "DATABASE_URI" "file:./data/site.db"
set_if_empty "NEXT_PUBLIC_CMS_URL" "http://localhost:3001"
set_if_empty "NEXT_PUBLIC_SITE_URL" "http://localhost:3000"
set_if_empty "PAYLOAD_PUBLIC_SERVER_URL" "http://localhost:3001"

echo ""
echo "  ✓ Setup готов. Запускай ./dev.sh"
echo ""
