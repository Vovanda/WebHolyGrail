#!/usr/bin/env bash
# Первоначальная настройка .env.local для локального dev.
# Запускать один раз. Не перезаписывает если файл уже есть.

set -e
cd "$(dirname "$0")"

CMS_ENV="sites/veo55/src/cms/.env.local"
CLIENT_ENV="sites/veo55/src/client/.env.local"

echo ""
echo "  veo55 dev-setup"
echo ""

# ── CMS .env.local ─────────────────────────────────────────────────────────
if [ -f "$CMS_ENV" ]; then
  echo "  [skip] $CMS_ENV уже существует"
else
  # Генерируем PAYLOAD_SECRET (32 случайных байта → hex)
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  cat > "$CMS_ENV" << EOF
# Локальный dev — НЕ для прода. Сгенерировано dev-setup.sh.
PAYLOAD_SECRET=$SECRET
DATABASE_URI=file:./data/veo55.db
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
EOF
  echo "  [ok]   $CMS_ENV создан (PAYLOAD_SECRET сгенерирован)"
fi

# ── Client .env.local ───────────────────────────────────────────────────────
if [ -f "$CLIENT_ENV" ]; then
  echo "  [skip] $CLIENT_ENV уже существует"
else
  cat > "$CLIENT_ENV" << EOF
# Локальный dev — НЕ для прода. Сгенерировано dev-setup.sh.
NEXT_PUBLIC_CMS_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
EOF
  echo "  [ok]   $CLIENT_ENV создан"
fi

# Создаём папку data для SQLite если нет
mkdir -p sites/veo55/src/cms/data
echo "  [ok]   sites/veo55/src/cms/data/ — папка для SQLite"

echo ""
echo "  Готово. Теперь запускай: ./dev.sh"
echo ""
