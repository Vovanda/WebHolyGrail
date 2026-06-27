#!/usr/bin/env bash
# Run the dev stack (CMS :3001 + Client :3000).
#
# Secrets resolution chain (только для local dev — prod через deploy/prod/deploy.sh,
# там Infisical обязателен hard):
#
#   1. Infisical CLI + .infisical.json (любой инстанс):
#      a) VPS shared instance ($INFISICAL_HOST_URL из .infisical.json/env) —
#         приоритет, тот же state что у других разработчиков, prod-like
#      b) local container на dev-машине (если поднят `docker compose` локально)
#   2. .env.local — minimal fallback (см. .env.local.example), когда нет ни
#      VPS-доступа, ни поднятого local Infisical контейнера. Без centralized
#      rotation, без audit — всё руками. Подходит для quick start / offline.
#   3. fail-fast если ни (1), ни (2) недоступны

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

# Подгружаем .env.local если есть (даже когда Infisical OK — оттуда могут идти
# locally-overriden порты CMS_PORT/CLIENT_PORT). Shell env имеет приоритет над .env.local.
if [ -f .env.local ]; then
  ENV_CMS_PORT="$CMS_PORT"
  ENV_CLIENT_PORT="$CLIENT_PORT"
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
  # Восстанавливаем shell-уровень override если был
  [ -n "$ENV_CMS_PORT" ] && CMS_PORT="$ENV_CMS_PORT"
  [ -n "$ENV_CLIENT_PORT" ] && CLIENT_PORT="$ENV_CLIENT_PORT"
fi

CMS_PORT="${CMS_PORT:-3001}"
CLIENT_PORT="${CLIENT_PORT:-3000}"

echo ""
echo "  dev stack"
echo "  CMS    → http://localhost:$CMS_PORT"
echo "  Admin  → http://localhost:$CMS_PORT/admin"
echo "  Client → http://localhost:$CLIENT_PORT"
echo ""
echo "  Override ports: CMS_PORT=4011 CLIENT_PORT=4010 ./dev.sh (или в .env.local)"
echo ""

if [ "$INFISICAL_OK" = "1" ]; then
  echo "  ✓ secrets: Infisical (env=dev)"
  echo ""
  exec infisical run --env=dev --recursive -- \
    pnpm exec concurrently \
      --names "cms,client" \
      --prefix-colors "yellow,cyan" \
      --kill-others-on-fail \
      "pnpm --dir src/cms exec cross-env NODE_OPTIONS=--no-deprecation PORT=$CMS_PORT next dev" \
      "pnpm --dir src/client exec cross-env PORT=$CLIENT_PORT next dev --turbopack"
elif [ -f .env.local ]; then
  echo "  ⚠ Infisical недоступен, fallback на .env.local (только для offline dev)"
  echo ""
  exec pnpm exec concurrently \
    --names "cms,client" \
    --prefix-colors "yellow,cyan" \
    --kill-others-on-fail \
    "pnpm --dir src/cms exec cross-env NODE_OPTIONS=--no-deprecation PORT=$CMS_PORT next dev" \
    "pnpm --dir src/client exec cross-env PORT=$CLIENT_PORT next dev --turbopack"
else
  echo "  ERROR: нет ни Infisical, ни .env.local."
  echo ""
  echo "  Варианты:"
  echo "    A) Настроить Infisical: ./dev-setup.sh"
  echo "    B) Создать .env.local из .env.local.example (offline)"
  echo ""
  exit 1
fi
