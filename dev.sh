#!/usr/bin/env bash
# Run the dev stack (CMS :3001 + Client :3000).
#
# Secrets resolution chain (только для local dev — prod через deploy/prod/deploy.sh,
# там Infisical обязателен hard):
#
#   1. Infisical CLI + .infisical.json (любой инстанс):
#      a) VPS shared instance (https://infisical.<canonical>.tld) — приоритет,
#         тот же state что у других разработчиков, prod-like
#      b) local container на dev-машине (если поднят `docker compose` локально)
#   2. .env.local — offline fallback (см. .env.local.example), когда:
#      - VPS Infisical недоступен (нет сети)
#      - не лень поднять local Infisical контейнер
#   3. fail-fast если ни того, ни другого нет

set -e
cd "$(dirname "$0")"

# MinIO (S3 storage для Media) — поднимаем заранее в обоих режимах.
if command -v docker >/dev/null 2>&1; then
  if ! docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'holygrail-minio'; then
    echo "  → MinIO не запущен, поднимаю..."
    docker compose --profile minio -f deploy/local/docker-compose.yml up -d minio minio-init >/dev/null 2>&1 || {
      echo "  ⚠ Не удалось поднять MinIO. Запусти вручную: pnpm minio:up"
    }
  fi
fi

INFISICAL_OK=0
if command -v infisical >/dev/null 2>&1 && [ -f .infisical.json ]; then
  # health-check: infisical run с пустой командой проверяет connectivity + auth
  if infisical run --env=dev --command='true' >/dev/null 2>&1; then
    INFISICAL_OK=1
  fi
fi

echo ""
echo "  dev stack"
echo "  CMS    → http://localhost:3001"
echo "  Admin  → http://localhost:3001/admin"
echo "  Client → http://localhost:3000"
echo ""

if [ "$INFISICAL_OK" = "1" ]; then
  echo "  ✓ secrets: Infisical (env=dev)"
  echo ""
  exec infisical run --env=dev --recursive -- \
    pnpm exec concurrently \
      --names "cms,client" \
      --prefix-colors "yellow,cyan" \
      --kill-others-on-fail \
      "pnpm --filter cms dev" \
      "pnpm --filter client dev"
elif [ -f .env.local ]; then
  echo "  ⚠ Infisical недоступен, fallback на .env.local (только для offline dev)"
  echo ""
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
  exec pnpm exec concurrently \
    --names "cms,client" \
    --prefix-colors "yellow,cyan" \
    --kill-others-on-fail \
    "pnpm --filter cms dev" \
    "pnpm --filter client dev"
else
  echo "  ERROR: нет ни Infisical, ни .env.local."
  echo ""
  echo "  Варианты:"
  echo "    A) Настроить Infisical: ./dev-setup.sh"
  echo "    B) Создать .env.local из .env.local.example (offline)"
  echo ""
  exit 1
fi
