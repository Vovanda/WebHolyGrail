#!/usr/bin/env bash
# migrate-veo55-to-domain.sh — ОДНОРАЗОВО для veo55-site.
#
# Приводит структуру veo55-site/src/client/src/ к 4-level Holy Grail
# template-формату (compatible со sync-template.sh).
#
# Что делает:
#   1. Создаёт blocks/domain/kennel/{dogs,litter,catalog,decor,lib}/
#   2. mv components/dog/*           → blocks/domain/kennel/dogs/
#      mv components/catalog/*       → blocks/domain/kennel/catalog/
#      mv components/PawTrail.tsx    → blocks/domain/kennel/decor/PawTrail.tsx
#      mv blocks/veo55/dogs/*        → blocks/domain/kennel/dogs/
#      mv blocks/veo55/litter/*      → blocks/domain/kennel/litter/
#      mv lib/dog-profile/*          → blocks/domain/kennel/lib/dog-profile/
#      mv lib/dog-profile.ts         → blocks/domain/kennel/lib/dog-profile.ts
#   3. Структурный refactor compatible с template:
#      mv blocks/primitives/Carousel.tsx → blocks/primitives/Carousel/CarouselRows.tsx
#      mv blocks/primitives/WaveDivider.tsx → blocks/primitives/Separator/WaveDivider.tsx
#      mv blocks/decor/ContentFrame.tsx → layouts/ContentFrame.tsx
#      mv blocks/content/* → blocks/layout/
#      mv components/SocialIcon.tsx → blocks/primitives/SocialIcon.tsx
#      mv components/faq/* → blocks/primitives/FaqAccordion/
#   4. Mass sed imports:
#      @/components/dog/   → @/blocks/domain/kennel/dogs/
#      @/components/catalog/ → @/blocks/domain/kennel/catalog/
#      @/components/PawTrail → @/blocks/domain/kennel/decor/PawTrail
#      @/components/SocialIcon → @/blocks/primitives/SocialIcon
#      @/components/faq/    → @/blocks/primitives/FaqAccordion/
#      @/blocks/veo55/dogs/   → @/blocks/domain/kennel/dogs/
#      @/blocks/veo55/litter/ → @/blocks/domain/kennel/litter/
#      @/blocks/content/      → @/blocks/layout/
#      @/blocks/decor/ContentFrame → @/layouts/ContentFrame
#      @/blocks/primitives/WaveDivider → @/blocks/primitives/Separator/WaveDivider
#      @/lib/dog-profile/ → @/blocks/domain/kennel/lib/dog-profile/
#      @veo55/contracts   → contracts
#
# Usage:
#   ./scripts/migrate-veo55-to-domain.sh <veo55-site-path> [--dry-run]
#
# После запуска: ./scripts/sync-template.sh <veo55-site-path> работает нормально.

set -euo pipefail

INSTANCE=""
DRY_RUN=false
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --help|-h) sed -n '2,40p' "$0"; exit 0 ;;
    *) INSTANCE="$1"; shift ;;
  esac
done

[ -n "$INSTANCE" ] || { echo "ERROR: instance path required" >&2; exit 1; }
INSTANCE=$(cd "$INSTANCE" && pwd)
[ -d "$INSTANCE/.git" ] || { echo "ERROR: $INSTANCE is not a git repo" >&2; exit 1; }

CLIENT="$INSTANCE/src/client/src"
[ -d "$CLIENT" ] || { echo "ERROR: $CLIENT not found" >&2; exit 1; }

echo "→ Target: $INSTANCE"
$DRY_RUN && echo "→ DRY RUN: показываю но не выполняю"

run() {
  if $DRY_RUN; then
    echo "  [dry] $*"
  else
    echo "  $*"
    eval "$@"
  fi
}

# 1. Создать domain/kennel директории
echo ""
echo "→ Phase 1: создаём blocks/domain/kennel/..."
for d in dogs litter catalog decor lib; do
  run "mkdir -p $CLIENT/blocks/domain/kennel/$d"
done

# 2. Переезд domain-файлов
echo ""
echo "→ Phase 2: переезд domain → blocks/domain/kennel/"

if [ -d "$CLIENT/components/dog" ]; then
  run "git -C $INSTANCE mv src/client/src/components/dog src/client/src/blocks/domain/kennel/dogs/__legacy_components"
  # Сразу uplift содержимое из __legacy_components наверх
  if [ -d "$CLIENT/blocks/domain/kennel/dogs/__legacy_components" ] && ! $DRY_RUN; then
    mv "$CLIENT/blocks/domain/kennel/dogs/__legacy_components/"* "$CLIENT/blocks/domain/kennel/dogs/" 2>/dev/null || true
    rmdir "$CLIENT/blocks/domain/kennel/dogs/__legacy_components" 2>/dev/null || true
  fi
fi

if [ -d "$CLIENT/components/catalog" ]; then
  run "git -C $INSTANCE mv src/client/src/components/catalog src/client/src/blocks/domain/kennel/catalog/__legacy"
  if [ -d "$CLIENT/blocks/domain/kennel/catalog/__legacy" ] && ! $DRY_RUN; then
    mv "$CLIENT/blocks/domain/kennel/catalog/__legacy/"* "$CLIENT/blocks/domain/kennel/catalog/" 2>/dev/null || true
    rmdir "$CLIENT/blocks/domain/kennel/catalog/__legacy" 2>/dev/null || true
  fi
fi

if [ -f "$CLIENT/components/PawTrail.tsx" ]; then
  run "git -C $INSTANCE mv src/client/src/components/PawTrail.tsx src/client/src/blocks/domain/kennel/decor/PawTrail.tsx"
fi

if [ -d "$CLIENT/blocks/veo55/dogs" ]; then
  run "git -C $INSTANCE mv src/client/src/blocks/veo55/dogs src/client/src/blocks/domain/kennel/dogs/__veo55"
  if [ -d "$CLIENT/blocks/domain/kennel/dogs/__veo55" ] && ! $DRY_RUN; then
    mv "$CLIENT/blocks/domain/kennel/dogs/__veo55/"* "$CLIENT/blocks/domain/kennel/dogs/" 2>/dev/null || true
    rmdir "$CLIENT/blocks/domain/kennel/dogs/__veo55" 2>/dev/null || true
  fi
fi

if [ -d "$CLIENT/blocks/veo55/litter" ]; then
  run "git -C $INSTANCE mv src/client/src/blocks/veo55/litter src/client/src/blocks/domain/kennel/litter/__veo55"
  if [ -d "$CLIENT/blocks/domain/kennel/litter/__veo55" ] && ! $DRY_RUN; then
    mv "$CLIENT/blocks/domain/kennel/litter/__veo55/"* "$CLIENT/blocks/domain/kennel/litter/" 2>/dev/null || true
    rmdir "$CLIENT/blocks/domain/kennel/litter/__veo55" 2>/dev/null || true
  fi
fi

# Удалить пустую blocks/veo55/
if [ -d "$CLIENT/blocks/veo55" ] && [ -z "$(ls -A $CLIENT/blocks/veo55 2>/dev/null)" ]; then
  run "rmdir $CLIENT/blocks/veo55"
fi

# lib/dog-profile/ → blocks/domain/kennel/lib/dog-profile/
if [ -d "$CLIENT/lib/dog-profile" ]; then
  run "git -C $INSTANCE mv src/client/src/lib/dog-profile src/client/src/blocks/domain/kennel/lib/dog-profile"
fi
if [ -f "$CLIENT/lib/dog-profile.ts" ]; then
  run "git -C $INSTANCE mv src/client/src/lib/dog-profile.ts src/client/src/blocks/domain/kennel/lib/dog-profile.ts"
fi

# 3. Структурный refactor (generic-уровень)
echo ""
echo "→ Phase 3: структурный refactor (generic)..."

# Carousel.tsx → Carousel/CarouselRows.tsx
if [ -f "$CLIENT/blocks/primitives/Carousel.tsx" ]; then
  run "mkdir -p $CLIENT/blocks/primitives/Carousel"
  run "git -C $INSTANCE mv src/client/src/blocks/primitives/Carousel.tsx src/client/src/blocks/primitives/Carousel/CarouselRows.tsx"
fi

# WaveDivider.tsx → Separator/WaveDivider.tsx
if [ -f "$CLIENT/blocks/primitives/WaveDivider.tsx" ]; then
  run "mkdir -p $CLIENT/blocks/primitives/Separator"
  run "git -C $INSTANCE mv src/client/src/blocks/primitives/WaveDivider.tsx src/client/src/blocks/primitives/Separator/WaveDivider.tsx"
fi

# blocks/decor/ContentFrame.tsx → layouts/ContentFrame.tsx
if [ -f "$CLIENT/blocks/decor/ContentFrame.tsx" ]; then
  run "git -C $INSTANCE mv src/client/src/blocks/decor/ContentFrame.tsx src/client/src/layouts/ContentFrame.tsx"
fi

# blocks/content/ → blocks/layout/
if [ -d "$CLIENT/blocks/content" ]; then
  run "git -C $INSTANCE mv src/client/src/blocks/content src/client/src/blocks/layout"
fi

# components/SocialIcon.tsx → blocks/primitives/SocialIcon.tsx
if [ -f "$CLIENT/components/SocialIcon.tsx" ]; then
  run "git -C $INSTANCE mv src/client/src/components/SocialIcon.tsx src/client/src/blocks/primitives/SocialIcon.tsx"
fi

# components/faq/* → blocks/primitives/FaqAccordion/
if [ -d "$CLIENT/components/faq" ]; then
  run "mkdir -p $CLIENT/blocks/primitives/FaqAccordion"
  # Существующий primitives/FaqAccordion.tsx переименовать в FaqAccordion/FaqAccordion.tsx (если ещё файл, не папка)
  if [ -f "$CLIENT/blocks/primitives/FaqAccordion.tsx" ]; then
    run "git -C $INSTANCE mv src/client/src/blocks/primitives/FaqAccordion.tsx src/client/src/blocks/primitives/FaqAccordion/__tmp_FaqAccordion.tsx"
    # И сразу переименовать обратно — git mv в директорию = move + rename
    if [ -f "$CLIENT/blocks/primitives/FaqAccordion/__tmp_FaqAccordion.tsx" ] && ! $DRY_RUN; then
      mv "$CLIENT/blocks/primitives/FaqAccordion/__tmp_FaqAccordion.tsx" "$CLIENT/blocks/primitives/FaqAccordion/FaqAccordion.tsx"
    fi
  fi
  for f in $CLIENT/components/faq/*; do
    [ -f "$f" ] || continue
    base=$(basename "$f")
    run "git -C $INSTANCE mv src/client/src/components/faq/$base src/client/src/blocks/primitives/FaqAccordion/$base"
  done
  # Чистка пустой папки
  rmdir "$CLIENT/components/faq" 2>/dev/null || true
fi

# Удалить пустую components/
if [ -d "$CLIENT/components" ] && [ -z "$(ls -A $CLIENT/components 2>/dev/null)" ]; then
  run "rmdir $CLIENT/components"
fi

# 4. Mass sed imports
echo ""
echo "→ Phase 4: mass sed imports..."

SED_RULES=(
  "s|@/components/dog/|@/blocks/domain/kennel/dogs/|g"
  "s|@/components/catalog/|@/blocks/domain/kennel/catalog/|g"
  "s|@/components/PawTrail|@/blocks/domain/kennel/decor/PawTrail|g"
  "s|@/components/SocialIcon|@/blocks/primitives/SocialIcon|g"
  "s|@/components/faq/|@/blocks/primitives/FaqAccordion/|g"
  "s|@/blocks/veo55/dogs/|@/blocks/domain/kennel/dogs/|g"
  "s|@/blocks/veo55/litter/|@/blocks/domain/kennel/litter/|g"
  "s|@/blocks/content/|@/blocks/layout/|g"
  "s|@/blocks/decor/ContentFrame|@/layouts/ContentFrame|g"
  "s|@/blocks/primitives/WaveDivider|@/blocks/primitives/Separator/WaveDivider|g"
  "s|@/blocks/primitives/Carousel'|@/blocks/primitives/Carousel/CarouselRows'|g"
  "s|@/lib/dog-profile/|@/blocks/domain/kennel/lib/dog-profile/|g"
  "s|@/lib/dog-profile'|@/blocks/domain/kennel/lib/dog-profile'|g"
  "s|@veo55/contracts|contracts|g"
)

if $DRY_RUN; then
  for rule in "${SED_RULES[@]}"; do
    echo "  [dry] sed: $rule"
  done
else
  SED_EXPR=""
  for rule in "${SED_RULES[@]}"; do
    SED_EXPR="$SED_EXPR -e \"$rule\""
  done
  find "$INSTANCE/src" -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -exec bash -c "eval sed -i $SED_EXPR \"\$0\"" {} \;
fi

echo ""
echo "──────────────────────────────────────────────"
echo "Migration done. Дальше:"
echo "  1. git -C $INSTANCE status                  — посмотреть renames"
echo "  2. cd $INSTANCE && pnpm install"
echo "  3. pnpm -r exec tsc --noEmit               — починить любые остаточные пути"
echo "  4. pnpm dev                                 — runtime smoke"
echo "  5. git commit -m 'refactor: переход на template 4-level структуру (одноразовая миграция)'"
echo "  6. ./scripts/sync-template.sh $INSTANCE     — теперь обычный sync работает"
echo "──────────────────────────────────────────────"
