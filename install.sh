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

# Since the #46435 hardening, user dashboard plugins are only served when
# listed under plugins.enabled in config.yaml. `hermes plugins enable` does
# not accept dashboard-only plugins (no plugin.yaml), so write the key here.
echo "→ Activating the plugin (plugins.enabled in config.yaml)…"
CFG="$HERMES_HOME/config.yaml"
if [ -f "$CFG" ] && grep -qE '^[[:space:]]*-[[:space:]]*"?iris"?[[:space:]]*$' "$CFG"; then
  echo "  iris is already in plugins.enabled."
elif python3 - "$CFG" <<'PY' 2>/dev/null
import sys, pathlib
try:
    import yaml
except ImportError:
    sys.exit(1)
p = pathlib.Path(sys.argv[1])
cfg = (yaml.safe_load(p.read_text()) if p.exists() else {}) or {}
plugins = cfg.setdefault("plugins", {})
enabled = plugins.setdefault("enabled", [])
if "iris" not in enabled:
    enabled.append("iris")
    p.write_text(yaml.safe_dump(cfg, sort_keys=False, allow_unicode=True))
sys.exit(0)
PY
then
  echo "  iris added to plugins.enabled."
elif [ -f "$CFG" ] && ! grep -qE '^plugins:' "$CFG"; then
  printf '\nplugins:\n  enabled:\n    - iris\n' >> "$CFG"
  echo "  iris added to plugins.enabled."
elif [ ! -f "$CFG" ]; then
  printf 'plugins:\n  enabled:\n    - iris\n' > "$CFG"
  echo "  config.yaml created with plugins.enabled: [iris]."
else
  echo "  ⚠ Could not edit $CFG automatically (python3+PyYAML unavailable and"
  echo "    a plugins: section already exists). Add this manually:"
  echo "      plugins:"
  echo "        enabled:"
  echo "          - iris"
fi

echo "→ Rescanning plugins…"
if curl -fsS "$DASH_URL/api/dashboard/plugins/rescan" >/dev/null 2>&1; then
  echo "  plugins reloaded."
elif [ "$DOCKER_MODE" = 1 ]; then
  echo "  (rescan requires dashboard auth or the dashboard is unreachable —"
  echo "   restart the hermes container to pick the plugin up)"
else
  echo "  (rescan requires dashboard auth or the dashboard is unreachable —"
  echo "   restart « hermes dashboard » then reload the page)"
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
  (and remove "iris" from plugins.enabled in <hermes-home>/config.yaml)
EOF
