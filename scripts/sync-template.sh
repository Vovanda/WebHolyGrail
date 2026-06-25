#!/usr/bin/env bash
# sync-template.sh — обновить инстанс Holy Grail из template (WHG).
#
# Usage:
#   ./scripts/sync-template.sh <instance-path> [--ref main|<branch>|<tag>|<sha>] \
#                                              [--repo <path-or-url>] \
#                                              [--dry-run]
#
# Examples:
#   ./scripts/sync-template.sh ../veo55-site
#   ./scripts/sync-template.sh ../veo55-site --ref develop
#   ./scripts/sync-template.sh ../veo55-site --ref tag/v0.2.0
#   ./scripts/sync-template.sh ../veo55-site --repo Vovanda/WebHolyGrail --ref main
#   ./scripts/sync-template.sh ../veo55-site --dry-run
#
# Что делает:
#   1. Если --repo URL → temp clone --depth=1 -b <ref>; иначе локальный --repo path.
#   2. rsync generic-whitelist из template → instance (с переименованиями: content→layout, и т.д.)
#   3. БЕЗ overwrite domain (blocks/domain/, app/(site)/<domain>/, src/cms/src/collections/<domain>/...)
#   4. Печатает diff stat и предлагает следующие шаги (pnpm install + smoke + commit).
#   5. Записывает sha источника в .template-version в инстансе.
#
# Что НЕ делает:
#   - НЕ overwrite payload.config.ts и contracts/src/index.ts (там merge-zone — добавляет domain).
#   - НЕ overwrite migrations/, site.config.ts, .env*, .infisical.json.
#   - НЕ запускает git commit/push автоматически — это делает разработчик после ревью.

set -euo pipefail

INSTANCE=""
REF="main"
REPO=""
DRY_RUN=false

while [ $# -gt 0 ]; do
  case "$1" in
    --ref) REF="$2"; shift 2 ;;
    --repo) REPO="$2"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --help|-h)
      sed -n '2,32p' "$0"; exit 0 ;;
    -*) echo "Unknown flag: $1" >&2; exit 1 ;;
    *)
      if [ -z "$INSTANCE" ]; then INSTANCE="$1"; else
        echo "Unexpected arg: $1" >&2; exit 1
      fi
      shift ;;
  esac
done

if [ -z "$INSTANCE" ]; then
  echo "ERROR: instance path required" >&2
  echo "  ./scripts/sync-template.sh <instance-path> [--ref <ref>] [--repo <path-or-url>]" >&2
  exit 1
fi

INSTANCE=$(cd "$INSTANCE" && pwd)
[ -d "$INSTANCE/.git" ] || { echo "ERROR: $INSTANCE is not a git repo" >&2; exit 1; }

# Source = local WHG if --repo пустой
if [ -z "$REPO" ]; then
  REPO="$(cd "$(dirname "$0")/.." && pwd)"
fi

# Если REPO URL (github short или https) — clone в /tmp
SOURCE_DIR=""
CLEANUP_SOURCE=false
if [[ "$REPO" =~ ^(https?://|git@|[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$) ]]; then
  TMP="/tmp/whg-sync-$$"
  URL="$REPO"
  if [[ "$REPO" =~ ^[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+$ ]]; then
    URL="git@github.com:${REPO}.git"
  fi
  echo "→ Clone $URL @ $REF"
  git clone --depth=1 -b "$REF" "$URL" "$TMP" >/dev/null 2>&1 || \
    git clone "$URL" "$TMP" >/dev/null 2>&1 && (cd "$TMP" && git checkout "$REF")
  SOURCE_DIR="$TMP"
  CLEANUP_SOURCE=true
else
  SOURCE_DIR="$REPO"
  # checkout указанной ref если локальный repo
  if [ -d "$SOURCE_DIR/.git" ]; then
    CURRENT_REF=$(git -C "$SOURCE_DIR" rev-parse --abbrev-ref HEAD)
    if [ "$REF" != "$CURRENT_REF" ]; then
      echo "→ git checkout $REF in $SOURCE_DIR"
      git -C "$SOURCE_DIR" fetch --quiet
      git -C "$SOURCE_DIR" checkout "$REF" --quiet
    fi
  fi
fi

SOURCE_SHA=$(git -C "$SOURCE_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "→ Source: $SOURCE_DIR @ $REF ($SOURCE_SHA)"
echo "→ Target: $INSTANCE"

# Whitelist — пути относительно $SOURCE_DIR которые rsync'аем в $INSTANCE
WHITELIST=(
  # Client
  "src/client/src/ui/"
  "src/client/src/blocks/primitives/"
  "src/client/src/blocks/layout/"
  "src/client/src/blocks/system/"
  "src/client/src/layouts/"
  "src/client/src/lib/api-client.ts"
  "src/client/src/lib/utils.ts"
  "src/client/src/lib/seo/"
  "src/client/src/lib/analytics.tsx"
  "src/client/src/lib/theme-bootstrap.tsx"
  "src/client/src/lib/lexical-text.ts"
  "src/client/src/styles/"

  # CMS — только generic collections + блоки
  "src/cms/src/blocks/"
  "src/cms/src/collections/Pages.ts"
  "src/cms/src/collections/Media.ts"
  "src/cms/src/collections/Users.ts"
  "src/cms/src/collections/FormSubmissions.ts"
  "src/cms/src/collections/ReusableBlocks.ts"
  "src/cms/src/collections/Posts.ts"
  "src/cms/src/collections/Comments.ts"
  "src/cms/src/collections/FaqGroups.ts"
  "src/cms/src/globals/SiteSettings.ts"

  # Contracts — только generic
  "contracts/src/blocks.ts"
  "contracts/src/faq.ts"
  "contracts/src/forms.ts"
  "contracts/src/globals.ts"
  "contracts/src/layout.ts"
  "contracts/src/media.ts"
  "contracts/src/notices.ts"
  "contracts/src/pages.ts"
  "contracts/src/reusable.ts"
  "contracts/src/social.ts"
  "contracts/src/theme.ts"

  # Deploy
  "deploy/"

  # Root scripts
  "dev.sh"
  "dev-setup.sh"

  # Claude skills — только holygrail-* и payload*
  ".claude/skills/holygrail-rules/"
  ".claude/skills/holygrail-layouts/"
  ".claude/skills/holygrail-modals/"
  ".claude/skills/holygrail-ui-reference/"
  ".claude/skills/holygrail-infisical/"
  ".claude/skills/holygrail-template-sync/"
  ".claude/skills/payload/"
  ".claude/skills/payload-jobs/"
  ".claude/skills/payload-migration/"
)

# Blacklist — что rsync должен исключать **даже внутри whitelist'ов**
EXCLUDES=(
  "--exclude=domain/"           # blocks/domain/ — instance-owned
  "--exclude=node_modules/"
  "--exclude=.next/"
  "--exclude=dist/"
  "--exclude=*.local"
)

RSYNC_FLAGS="-av --delete"
$DRY_RUN && RSYNC_FLAGS="$RSYNC_FLAGS --dry-run"

echo ""
echo "→ Syncing whitelist (${#WHITELIST[@]} paths)..."
echo ""

for path in "${WHITELIST[@]}"; do
  src="$SOURCE_DIR/$path"
  dst="$INSTANCE/$path"
  if [ ! -e "$src" ]; then
    echo "  ? $path (нет в source)"
    continue
  fi
  if [ -d "$src" ]; then
    mkdir -p "$dst"
    rsync $RSYNC_FLAGS "${EXCLUDES[@]}" "$src" "$dst" 2>&1 | tail -3 | sed "s|^|    |"
  else
    mkdir -p "$(dirname "$dst")"
    rsync $RSYNC_FLAGS "$src" "$dst" 2>&1 | tail -2 | sed "s|^|    |"
  fi
done

# Записать .template-version (только если не dry-run)
if ! $DRY_RUN; then
  PREV=""
  [ -f "$INSTANCE/.template-version" ] && PREV=$(cat "$INSTANCE/.template-version")
  cat > "$INSTANCE/.template-version" <<EOF
# Holy Grail template sync marker.
# Update by sync-template.sh on every sync.
source_sha=$SOURCE_SHA
source_ref=$REF
synced_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)
previous_sha=$PREV
EOF
  echo ""
  echo "  ✓ .template-version → $INSTANCE/.template-version"
fi

if $CLEANUP_SOURCE; then
  rm -rf "$SOURCE_DIR"
fi

echo ""
echo "──────────────────────────────────────────────"
echo "Sync завершён. Дальше в $INSTANCE:"
echo "  1. git status                        — посмотреть что изменилось"
echo "  2. git diff --stat                   — масштаб"
echo "  3. pnpm install                      — peer-deps drift если был"
echo "  4. pnpm -r exec tsc --noEmit         — typecheck smoke"
echo "  5. pnpm dev                          — runtime smoke"
echo "  6. git checkout -b chore/sync-template-$(date +%Y%m%d)"
echo "  7. git add -A && git commit -m 'chore(sync): pull template $REF ($SOURCE_SHA)'"
echo "  8. gh pr create / merge / pull"
echo "──────────────────────────────────────────────"
