#!/usr/bin/env bash
# sync-template.sh — тонкая обёртка над scripts/sync-template.mjs.
#
# Реализация переехала на Node: rsync нет в Git Bash на Windows, и его установка
# (msys2 / scoop / WSL) превращала «одну команду» в квест. Node в проекте есть
# по определению — синк работает из коробки везде.
#
# Флаги и аргументы прежние:
#   ./scripts/sync-template.sh <instance-path> [--ref <ref>] [--repo <path-or-url>]
#                                              [--dry-run] [--include-claude]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found in PATH. Установи Node.js 20+ (в WHG он и так нужен)." >&2
  exit 1
fi

exec node "$SCRIPT_DIR/sync-template.mjs" "$@"
