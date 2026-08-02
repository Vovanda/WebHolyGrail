#!/usr/bin/env bash
# Bootstrap нового Holy Grail сайта на VPS — идемпотентно.
#
# Делает то, что иначе пришлось бы делать руками **до** первого `git push`:
#   1. Создаёт /opt/sites/<slug> и git-clones репо туда
#   2. Создаёт Infisical project `holygrail-<slug>` (через self-host REST)
#   3. Создаёт Universal Auth machine identity для deploy.sh
#   4. Сохраняет client-id + client-secret в /etc/infisical/<slug>/ (chmod 600 deploy:deploy)
#
# После этого блока GH Actions workflow `deploy.yml` берёт всё на себя.
#
# Запуск (на VPS, под deploy user):
#   SLUG=whg \
#   REPO=https://github.com/Vovanda/WebHolyGrail.git \
#   INFISICAL_HOST_URL=https://infisical.<your-host> \
#   INFISICAL_ADMIN_TOKEN=<JWT из /opt/infisical/.bootstrap.json> \
#   INFISICAL_ADMIN_ORG_ID=<org uuid> \
#   /tmp/bootstrap-site-on-vps.sh
#
# Можно сразу из локальной машины через SSH:
#   scp scripts/bootstrap-site-on-vps.sh deploy@<vps>:/tmp/
#   ssh deploy@<vps> "SLUG=whg REPO=... INFISICAL_HOST_URL=... \
#     INFISICAL_ADMIN_TOKEN=... INFISICAL_ADMIN_ORG_ID=... /tmp/bootstrap-site-on-vps.sh"

set -euo pipefail

: "${SLUG:?required (e.g. whg, sawking-tech)}"
: "${REPO:?required (e.g. https://github.com/<owner>/<repo>.git)}"
: "${INFISICAL_HOST_URL:?required (e.g. https://infisical.example.com)}"
: "${INFISICAL_ADMIN_TOKEN:?required (JWT from /opt/infisical/.bootstrap.json)}"
: "${INFISICAL_ADMIN_ORG_ID:?required (org uuid)}"

SITE_DIR="/opt/sites/${SLUG}"
CREDS_DIR="/etc/infisical/${SLUG}"
PROJECT_NAME="holygrail-${SLUG}"

echo "═══════════════════════════════════════════════════════"
echo " Bootstrap site '$SLUG'"
echo "   repo:       $REPO"
echo "   site dir:   $SITE_DIR"
echo "   creds dir:  $CREDS_DIR"
echo "   infisical:  $INFISICAL_HOST_URL"
echo "═══════════════════════════════════════════════════════"

# ─── 1. Site dir + git ──────────────────────────────────────────────────
if [ ! -d "$SITE_DIR" ]; then
  sudo install -d -o deploy -g deploy "$SITE_DIR"
fi

cd "$SITE_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "→ git init + fetch $REPO"
  git init -q -b main
  git remote add origin "$REPO" 2>/dev/null || git remote set-url origin "$REPO"
  git fetch --depth 50 origin main
  git reset --hard origin/main
else
  echo "→ git repo уже инициализирован, sync с origin/main"
  git fetch --depth 50 origin main
  git reset --hard origin/main
fi
echo "   ✓ $SITE_DIR на $(git log -1 --oneline)"

# ─── 2. Infisical project (idempotent) ──────────────────────────────────
echo
echo "→ Infisical: ensure project '$PROJECT_NAME'"

API() {
  curl -sS --max-time 15 \
    -H "Authorization: Bearer $INFISICAL_ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    "$@"
}

# Список проектов: GET /api/v1/workspace. Прежний `/api/v2/workspace?organizationId=`
# отвечает 404 — маршрута нет, то есть поиск существующего проекта не работал
# никогда и каждый прогон создавал дубль (Infisical дописываетslug суффикс).
# Через jq, а не grep по сырому JSON: порядок полей в ответе не гарантирован, а
# `grep` без совпадения под `set -euo pipefail` убивал весь скрипт молча.
EXISTING=$(API "$INFISICAL_HOST_URL/api/v1/workspace" \
  | jq -r --arg name "$PROJECT_NAME" \
      'first(.workspaces[]? | select(.name == $name) | .id) // empty' 2>/dev/null || true)

if [ -n "$EXISTING" ]; then
  PROJECT_ID="$EXISTING"
  echo "   ✓ project уже существует: $PROJECT_ID"
else
  RESP=$(API -X POST "$INFISICAL_HOST_URL/api/v2/workspace" -d "{
    \"projectName\": \"$PROJECT_NAME\",
    \"organizationId\": \"$INFISICAL_ADMIN_ORG_ID\",
    \"type\": \"secret-manager\"
  }")
  PROJECT_ID=$(echo "$RESP" | jq -r '.project.id // .id // empty' 2>/dev/null || true)
  if [ -z "$PROJECT_ID" ]; then
    echo "   ✗ create project failed: $RESP" >&2
    exit 1
  fi
  echo "   ✓ project создан: $PROJECT_ID"
fi

# ─── 3. Universal Auth identity (idempotent) ────────────────────────────
echo
echo "→ Infisical: ensure UA identity '$SLUG-deploy'"

IDENTITY_NAME="${SLUG}-deploy"
# Identity живёт на уровне организации, а не проекта: прежний
# `/api/v1/workspace/<id>/identity-memberships` отвечает 404, поэтому «уже
# существует» не срабатывало и каждый прогон плодил новую identity.
EXISTING_IDENT=$(API "$INFISICAL_HOST_URL/api/v2/organizations/$INFISICAL_ADMIN_ORG_ID/identity-memberships" \
  | jq -r --arg name "$IDENTITY_NAME" \
      'first(.identityMemberships[]? | select(.identity.name == $name) | .identity.id) // empty' 2>/dev/null || true)

if [ -n "$EXISTING_IDENT" ]; then
  IDENTITY_ID="$EXISTING_IDENT"
  echo "   ✓ identity уже существует: $IDENTITY_ID"
  echo "   ⚠ existing identity — client-secret НЕ regenerate (старые creds в $CREDS_DIR должны работать)"
  SKIP_CREDS=1
else
  # Create identity at org level
  RESP=$(API -X POST "$INFISICAL_HOST_URL/api/v1/identities" -d "{
    \"name\": \"$IDENTITY_NAME\",
    \"organizationId\": \"$INFISICAL_ADMIN_ORG_ID\",
    \"role\": \"member\"
  }")
  IDENTITY_ID=$(echo "$RESP" | jq -r '.identity.id // .id // empty' 2>/dev/null || true)
  if [ -z "$IDENTITY_ID" ]; then
    echo "   ✗ create identity failed: $RESP" >&2
    exit 1
  fi

  # Attach to project as developer
  API -X POST "$INFISICAL_HOST_URL/api/v2/workspace/$PROJECT_ID/identity-memberships/$IDENTITY_ID" \
    -d "{\"role\": \"member\"}" >/dev/null

  # Attach Universal Auth method
  UA_RESP=$(API -X POST "$INFISICAL_HOST_URL/api/v1/auth/universal-auth/identities/$IDENTITY_ID" -d '{
    "clientSecretTrustedIps": [{"ipAddress": "0.0.0.0/0"}],
    "accessTokenTrustedIps": [{"ipAddress": "0.0.0.0/0"}],
    "accessTokenTTL": 2592000,
    "accessTokenMaxTTL": 2592000,
    "accessTokenNumUsesLimit": 0
  }')
  CLIENT_ID=$(echo "$UA_RESP" | jq -r '.identityUniversalAuth.clientId // .clientId // empty' 2>/dev/null || true)

  # Generate client-secret
  SECRET_RESP=$(API -X POST "$INFISICAL_HOST_URL/api/v1/auth/universal-auth/identities/$IDENTITY_ID/client-secrets" \
    -d '{"description":"deploy", "numUsesLimit": 0, "ttl": 0}')
  CLIENT_SECRET=$(echo "$SECRET_RESP" | jq -r '.clientSecret // .clientSecretData.clientSecret // empty' 2>/dev/null || true)

  if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "   ✗ UA setup failed (clientId=$CLIENT_ID, clientSecret=${CLIENT_SECRET:+<set>}${CLIENT_SECRET:-<empty>})" >&2
    exit 1
  fi
  echo "   ✓ UA identity создан: $IDENTITY_ID"
  SKIP_CREDS=0
fi

# ─── 4. Save creds на disk ──────────────────────────────────────────────
# Файла ровно три: без `project-id` UA-логин из deploy.sh падает с
# «Project ID is required when using machine identity». client-secret пишем
# только для свежесозданной identity — у существующей он неизвлекаем.
echo
echo "→ Saving creds → $CREDS_DIR"
sudo install -d -m 0700 -o deploy -g deploy "$CREDS_DIR"
printf '%s' "$PROJECT_ID" | sudo tee "$CREDS_DIR/project-id" >/dev/null
if [ "${SKIP_CREDS:-0}" = "0" ]; then
  printf '%s' "$CLIENT_ID" | sudo tee "$CREDS_DIR/client-id" >/dev/null
  printf '%s' "$CLIENT_SECRET" | sudo tee "$CREDS_DIR/client-secret" >/dev/null
fi
sudo chown deploy:deploy "$CREDS_DIR"/*
sudo chmod 600 "$CREDS_DIR"/*
if [ "${SKIP_CREDS:-0}" = "0" ]; then
  echo "   ✓ client-id, client-secret, project-id (chmod 600 deploy:deploy)"
else
  echo "   ✓ project-id обновлён; client-id/secret оставлены от существующей identity"
  if [ ! -s "$CREDS_DIR/client-secret" ]; then
    echo "   ✗ client-secret пуст, а identity уже существует — его нельзя перевыпустить здесь." >&2
    echo "     Удали identity '$IDENTITY_NAME' в Infisical и перезапусти bootstrap." >&2
    exit 1
  fi
fi

echo
echo "═══════════════════════════════════════════════════════"
echo " ✓ Bootstrap done for '$SLUG'"
echo "═══════════════════════════════════════════════════════"
echo
echo "Next:"
echo "  1. Заполнить prod-секреты в Infisical project '$PROJECT_NAME' env=prod:"
echo "     PAYLOAD_SECRET, DATABASE_URI, S3_BUCKET, S3_REGION, S3_ENDPOINT,"
echo "     S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL,"
echo "     PAYLOAD_PUBLIC_SERVER_URL, NEXT_PUBLIC_SITE_URL, PAYLOAD_ALLOWED_ORIGINS,"
echo "     ADMIN_INITIAL_EMAIL, ADMIN_INITIAL_PASSWORD"
echo "  2. Через GH Settings задать VPS_HOST/VPS_SSH_KEY/IMAGE_NAME_PREFIX/PRIMARY_DOMAIN/PORT_BASE etc"
echo "  3. git push origin main → GH Actions сам всё задеплоит через deploy.sh"
