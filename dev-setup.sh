#!/usr/bin/env bash
# First-time setup: install Infisical, log in, link this folder to the project.
# Run once per machine.

set -e
cd "$(dirname "$0")"

echo ""
echo "  Infisical dev-setup"
echo ""

# 1. Check CLI is installed.
if ! command -v infisical >/dev/null 2>&1; then
  echo "  ERROR: infisical CLI not found."
  echo "  Install:"
  echo "    macOS:    brew install infisical/get-cli/infisical"
  echo "    Windows:  winget install Infisical.CLI"
  echo "    Linux:    curl -1sLf 'https://artifacts-cli.infisical.com/install.sh' | sh"
  echo ""
  exit 1
fi
echo "  [ok]   infisical CLI: $(infisical --version 2>&1 | head -1)"

# 2. Log in (skipped if a valid session already exists).
if ! infisical user 2>/dev/null | grep -q '@'; then
  echo "  [next] running 'infisical login' — sign in via browser"
  infisical login
else
  echo "  [ok]   already logged in"
fi

# 3. Link this folder to an Infisical project.
if [ -f .infisical.json ]; then
  echo "  [ok]   .infisical.json already exists — skipping init"
else
  echo "  [next] running 'infisical init' — pick the project for this site"
  infisical init
fi

echo ""
echo "  Done. Now run ./dev.sh"
echo ""
