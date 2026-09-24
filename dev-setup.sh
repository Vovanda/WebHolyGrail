#!/usr/bin/env bash
# Настройка стенда: один раз на машину или на свежую копию.
#
# Путей два, и оба обычные.
#
#   ./dev-setup.sh            файл настроек рядом с проектом. Ничего, кроме
#                             Node и pnpm, не нужно: файлы CMS хранит у себя,
#                             докер не участвует.
#
#   ./dev-setup.sh --shared   общее хранилище секретов (Infisical) и локальное
#                             хранилище файлов в докере. Нужно там, где настройки
#                             общие на команду и меняются без выкладки.
#
# Боевой сайт настраивается иначе - через deploy/prod/deploy.sh, и секреты там
# только из Infisical.

set -e
cd "$(dirname "$0")"

SHARED=0
[ "${1:-}" = "--shared" ] && SHARED=1

echo ""
echo "  Настройка стенда Web Holy Grail"
echo ""

# ---------------------------------------------------------------- свой файл --
if [ "$SHARED" = "0" ]; then
  if [ -f .env.local ]; then
    echo "  [ok]   .env.local уже есть"
  else
    cp .env.local.example .env.local
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    # Ключ подписи заполняется сразу: без него CMS не стартует, а пустая строка
    # в примере выглядит как заполненная настройка.
    if command -v perl >/dev/null 2>&1; then
      perl -pi -e "s/^PAYLOAD_SECRET=.*/PAYLOAD_SECRET=$SECRET/" .env.local
    else
      sed -i.bak "s/^PAYLOAD_SECRET=.*/PAYLOAD_SECRET=$SECRET/" .env.local && rm -f .env.local.bak
    fi
    echo "  [set]  .env.local создан, ключ подписи сгенерирован"
  fi

  echo ""
  echo "  Хранилище файлов: своё, внутри проекта (src/cms/media)."
  echo "  Внешнее включается строками S3_* в .env.local - см. пояснение там же."
  echo ""
  echo "  ✓ Готово. Запускай ./dev.sh"
  echo ""
  exit 0
fi

# ------------------------------------------------------------ общий доступ --
if ! command -v infisical >/dev/null 2>&1; then
  echo "  ERROR: infisical CLI не найден - он нужен для общего хранилища секретов."
  echo "  Установка:"
  echo "    macOS:    brew install infisical/get-cli/infisical"
  echo "    Windows:  winget install Infisical.CLI"
  echo "    Linux:    curl -1sLf 'https://artifacts-cli.infisical.com/install.sh' | sh"
  echo ""
  echo "  Либо подними стенд на своём файле настроек: ./dev-setup.sh"
  echo ""
  exit 1
fi
echo "  [ok]   infisical CLI: $(infisical --version 2>&1 | head -1)"

if ! command -v docker >/dev/null 2>&1; then
  echo "  ERROR: docker не найден - он нужен для локального хранилища файлов."
  echo "  Установка: https://docs.docker.com/get-docker/"
  echo ""
  echo "  Либо подними стенд без хранилища: ./dev-setup.sh"
  echo ""
  exit 1
fi
echo "  [ok]   docker: $(docker --version 2>&1 | head -1)"

if ! infisical user 2>/dev/null | grep -q '@'; then
  echo "  [next] infisical login - вход через браузер"
  infisical login
else
  echo "  [ok]   вход в Infisical уже выполнен"
fi

if [ -f .infisical.json ]; then
  echo "  [ok]   .infisical.json уже есть"
else
  echo "  [next] infisical init - выбери проект этого сайта"
  infisical init
fi

echo ""
echo "  → Поднимаю локальное хранилище файлов..."
docker compose --profile minio -f deploy/local/docker-compose.yml up -d minio minio-init >/dev/null 2>&1
echo "  [ok]   хранилище → http://localhost:9000  (корзина local-media)"
echo "         панель    → http://localhost:9001  (minioadmin / minioadmin)"

echo ""
echo "  → Проверяю настройки в разделе dev..."

set_if_empty() {
  local key="$1"
  local default_value="$2"
  local current
  current=$(infisical secrets get "$key" --env=dev --plain 2>/dev/null || echo "")
  if [ -z "$current" ]; then
    infisical secrets set "$key=$default_value" --env=dev >/dev/null 2>&1
    echo "  [set]  $key"
  else
    echo "  [ok]   $key"
  fi
}

set_if_empty "S3_BUCKET" "local-media"
set_if_empty "S3_REGION" "us-east-1"
set_if_empty "S3_ENDPOINT" "http://localhost:9000"
set_if_empty "S3_PUBLIC_URL" "http://localhost:9000/local-media"
set_if_empty "S3_ACCESS_KEY_ID" "minioadmin"
set_if_empty "S3_SECRET_ACCESS_KEY" "minioadmin"

PAYLOAD_SECRET_CURRENT=$(infisical secrets get PAYLOAD_SECRET --env=dev --plain 2>/dev/null || echo "")
if [ -z "$PAYLOAD_SECRET_CURRENT" ]; then
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  infisical secrets set "PAYLOAD_SECRET=$SECRET" --env=dev >/dev/null 2>&1
  echo "  [set]  PAYLOAD_SECRET - сгенерирован"
fi

set_if_empty "DATABASE_URI" "file:./data/site.db"
set_if_empty "NEXT_PUBLIC_CMS_URL" "http://localhost:3001"
set_if_empty "NEXT_PUBLIC_SITE_URL" "http://localhost:3000"
set_if_empty "PAYLOAD_PUBLIC_SERVER_URL" "http://localhost:3001"

echo ""
echo "  ✓ Готово. Запускай ./dev.sh"
echo ""
