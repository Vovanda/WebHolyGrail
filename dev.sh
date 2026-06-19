#!/usr/bin/env bash
# Быстрый запуск dev-стека veo55 (CMS :3001 + Client :3000).
#
# Первый запуск: ./dev-setup.sh  (создаёт .env.local файлы)
# После: ./dev.sh

set -e
cd "$(dirname "$0")"

CMS_ENV="sites/veo55/src/cms/.env.local"
CLIENT_ENV="sites/veo55/src/client/.env.local"

if [ ! -f "$CMS_ENV" ] || [ ! -f "$CLIENT_ENV" ]; then
  echo ""
  echo "  ERROR: .env.local файлы не найдены."
  echo "  Запусти сначала: ./dev-setup.sh"
  echo ""
  exit 1
fi

echo ""
echo "  veo55 dev stack"
echo "  CMS    → http://localhost:3001"
echo "  Admin  → http://localhost:3001/admin"
echo "  Client → http://localhost:3000"
echo ""

pnpm exec concurrently \
  --names "cms,client" \
  --prefix-colors "yellow,cyan" \
  --kill-others-on-fail \
  "pnpm --filter veo55-cms dev" \
  "pnpm --filter veo55-client dev"
