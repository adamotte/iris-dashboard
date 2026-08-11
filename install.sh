#!/usr/bin/env bash
# Install Iris (plugin + themes) for the hermes-agent dashboard.
#
# Native install:  ./install.sh
# Docker install:  ./install.sh --docker /path/to/hermes-volume
#   (the path is the host directory mounted as ~/.hermes inside the container)
#
# Options: --dashboard-url <url>   (default: http://127.0.0.1:9119)
set -euo pipefail

DASH_URL="http://127.0.0.1:9119"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
DOCKER_MODE=0
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

while [ $# -gt 0 ]; do
  case "$1" in
    --docker)
      DOCKER_MODE=1
      HERMES_HOME="${2:?usage: --docker <hermes-volume-dir>}"
      shift 2 ;;
    --dashboard-url)
      DASH_URL="${2:?usage: --dashboard-url <url>}"
      shift 2 ;;
    *)
      echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

if [ ! -d "$HERMES_HOME" ]; then
  if [ "$DOCKER_MODE" = 1 ]; then
    echo "✗ $HERMES_HOME not found — is this the host directory mounted as ~/.hermes?" >&2
  else
    echo "✗ $HERMES_HOME not found — is hermes-agent installed on this machine?" >&2
  fi
  exit 1
fi

echo "→ Installing the iris plugin into $HERMES_HOME/plugins/…"
mkdir -p "$HERMES_HOME/plugins"
rm -rf "$HERMES_HOME/plugins/iris"
cp -r "$SRC_DIR/plugins/iris" "$HERMES_HOME/plugins/"

echo "→ Installing the iris-dark / iris-light themes…"
mkdir -p "$HERMES_HOME/dashboard-themes"
cp "$SRC_DIR/themes/iris-dark.yaml" "$SRC_DIR/themes/iris-light.yaml" "$HERMES_HOME/dashboard-themes/"

echo "→ Rescanning plugins…"
if curl -fsS "$DASH_URL/api/dashboard/plugins/rescan" >/dev/null 2>&1; then
  echo "  plugins reloaded."
elif [ "$DOCKER_MODE" = 1 ]; then
  echo "  (dashboard unreachable at $DASH_URL — restart the hermes container)"
else
  echo "  (dashboard unreachable at $DASH_URL — run « hermes dashboard » then reload the page)"
fi

cat <<'EOF'

✓ Iris installed.
  1. Reload the dashboard page (restart the container if the rescan failed):
     the new home page replaces Status.
  2. Palette icon (header) → « Iris (sombre) » or « Iris (clair) ».
  3. On mobile, a bottom navigation bar appears automatically.

Update:     git pull, then run this script again.
Uninstall:
  rm -rf <hermes-home>/plugins/iris <hermes-home>/dashboard-themes/iris-*.yaml
EOF
