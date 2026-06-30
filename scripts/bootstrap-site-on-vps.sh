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

# Try to find existing project. v2 API: GET /api/v2/workspace?organizationId=...
EXISTING=$(API "$INFISICAL_HOST_URL/api/v2/workspace?organizationId=$INFISICAL_ADMIN_ORG_ID" \
  | grep -oE "\"id\":\"[^\"]+\",\"name\":\"$PROJECT_NAME\"" \
  | head -1 \
  | grep -oE '"id":"[^"]+"' \
  | head -1 \
  | cut -d'"' -f4)

if [ -n "$EXISTING" ]; then
  PROJECT_ID="$EXISTING"
  echo "   ✓ project уже существует: $PROJECT_ID"
else
  RESP=$(API -X POST "$INFISICAL_HOST_URL/api/v2/workspace" -d "{
    \"projectName\": \"$PROJECT_NAME\",
    \"organizationId\": \"$INFISICAL_ADMIN_ORG_ID\",
    \"type\": \"secret-manager\"
  }")
  PROJECT_ID=$(echo "$RESP" | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4)
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
EXISTING_IDENT=$(API "$INFISICAL_HOST_URL/api/v1/workspace/$PROJECT_ID/identity-memberships" \
  | grep -oE "\"identityId\":\"[^\"]+\"[^}]*\"name\":\"$IDENTITY_NAME\"" \
  | head -1 \
  | grep -oE '"identityId":"[^"]+"' \
  | cut -d'"' -f4)

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
  IDENTITY_ID=$(echo "$RESP" | grep -oE '"id":"[^"]+"' | head -1 | cut -d'"' -f4)
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
  CLIENT_ID=$(echo "$UA_RESP" | grep -oE '"clientId":"[^"]+"' | head -1 | cut -d'"' -f4)

  # Generate client-secret
  SECRET_RESP=$(API -X POST "$INFISICAL_HOST_URL/api/v1/auth/universal-auth/identities/$IDENTITY_ID/client-secrets" \
    -d '{"description":"deploy", "numUsesLimit": 0, "ttl": 0}')
  CLIENT_SECRET=$(echo "$SECRET_RESP" | grep -oE '"clientSecret":"[^"]+"' | head -1 | cut -d'"' -f4)

  if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "   ✗ UA setup failed (clientId=$CLIENT_ID, clientSecret=${CLIENT_SECRET:+<set>}${CLIENT_SECRET:-<empty>})" >&2
    exit 1
  fi
  echo "   ✓ UA identity создан: $IDENTITY_ID"
  SKIP_CREDS=0
fi

# ─── 4. Save creds на disk (только для свежесозданного identity) ────────
if [ "${SKIP_CREDS:-0}" = "0" ]; then
  echo
  echo "→ Saving UA creds → $CREDS_DIR"
  sudo install -d -m 0700 -o deploy -g deploy "$CREDS_DIR"
  echo -n "$CLIENT_ID" | sudo tee "$CREDS_DIR/client-id" >/dev/null
  echo -n "$CLIENT_SECRET" | sudo tee "$CREDS_DIR/client-secret" >/dev/null
  sudo chown deploy:deploy "$CREDS_DIR/client-id" "$CREDS_DIR/client-secret"
  sudo chmod 600 "$CREDS_DIR/client-id" "$CREDS_DIR/client-secret"
  echo "   ✓ creds saved (chmod 600 deploy:deploy)"
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
