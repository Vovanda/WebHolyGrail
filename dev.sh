#!/usr/bin/env bash
# Run the dev stack (CMS :3001 + Client :3000) with secrets injected by Infisical.
#
# Prerequisites:
#   - Infisical CLI installed (https://infisical.com/docs/cli/overview)
#   - `./dev-setup.sh` run once (creates `.infisical.json` linking this folder
#     to the Infisical project and logs you in)

set -e
cd "$(dirname "$0")"

if ! command -v infisical >/dev/null 2>&1; then
  echo ""
  echo "  ERROR: infisical CLI not found."
  echo "  Install: https://infisical.com/docs/cli/overview"
  echo ""
  exit 1
fi

if [ ! -f .infisical.json ]; then
  echo ""
  echo "  ERROR: .infisical.json not found in this folder."
  echo "  Run: ./dev-setup.sh"
  echo ""
  exit 1
fi

echo ""
echo "  dev stack (secrets via Infisical, env=dev)"
echo "  CMS    → http://localhost:3001"
echo "  Admin  → http://localhost:3001/admin"
echo "  Client → http://localhost:3000"
echo ""

# `--recursive` walks the workspace and injects secrets into every child.
# `--env=dev` picks the Infisical environment.
infisical run --env=dev --recursive -- \
  pnpm exec concurrently \
    --names "cms,client" \
    --prefix-colors "yellow,cyan" \
    --kill-others-on-fail \
    "pnpm --filter cms dev" \
    "pnpm --filter client dev"
