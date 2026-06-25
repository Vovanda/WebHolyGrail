#!/usr/bin/env bash
# Run the dev stack (CMS :3001 + Client :3000) with secrets injected by Infisical.
#
# Prerequisites:
#   - Infisical CLI installed (https://infisical.com/docs/cli/overview)
#   - `./dev-setup.sh` run once (creates `.infisical.json` linking this folder
#     to the Infisical project and logs you in)

set -e
cd "$(dirname "$0")"

if ! command -v infisical >/dev/null 2>&1; then
  echo ""
  echo "  ERROR: infisical CLI not found."
  echo "  Install: https://infisical.com/docs/cli/overview"
  echo ""
  exit 1
fi

if [ ! -f .infisical.json ]; then
  echo ""
  echo "  ERROR: .infisical.json not found in this folder."
  echo "  Run: ./dev-setup.sh"
  echo ""
  exit 1
fi

# Проверяем MinIO (S3 storage для Media). Если контейнер не запущен — поднимаем.
if command -v docker >/dev/null 2>&1; then
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'holygrail-minio'; then
    echo "  → MinIO не запущен, поднимаю..."
    docker compose --profile minio -f deploy/local/docker-compose.yml up -d minio minio-init >/dev/null 2>&1 || {
      echo "  ⚠ Не удалось поднять MinIO. Запусти вручную: pnpm minio:up"
      echo "    или настрой облачный S3 в Infisical."
    }
  fi
fi

echo ""
echo "  dev stack (secrets via Infisical, env=dev)"
echo "  CMS    → http://localhost:3001"
echo "  Admin  → http://localhost:3001/admin"
echo "  Client → http://localhost:3000"
echo ""

# `--recursive` walks the workspace and injects secrets into every child.
# `--env=dev` picks the Infisical environment.
infisical run --env=dev --recursive -- \
  pnpm exec concurrently \
    --names "cms,client" \
    --prefix-colors "yellow,cyan" \
    --kill-others-on-fail \
    "pnpm --filter cms dev" \
    "pnpm --filter client dev"
