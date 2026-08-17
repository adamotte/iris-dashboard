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

IRIS_PLUGINS=$(cd "$SRC_DIR/plugins" && ls -d iris*)

echo "→ Installing the Iris plugins into $HERMES_HOME/plugins/…"
mkdir -p "$HERMES_HOME/plugins"
for p in $IRIS_PLUGINS; do
  rm -rf "$HERMES_HOME/plugins/$p"
  cp -r "$SRC_DIR/plugins/$p" "$HERMES_HOME/plugins/"
done
echo "  $(echo "$IRIS_PLUGINS" | wc -w) plugins installed."

echo "→ Installing the iris-dark / iris-light themes…"
mkdir -p "$HERMES_HOME/dashboard-themes"
cp "$SRC_DIR/themes/iris-dark.yaml" "$SRC_DIR/themes/iris-light.yaml" "$HERMES_HOME/dashboard-themes/"

# Since the #46435 hardening, user dashboard plugins are only served when
# listed under plugins.enabled in config.yaml. Each iris plugin ships a
# plugin.yaml, so `hermes plugins enable iris-*` also works — but the key is
# written here for a scripted, non-interactive activation.
echo "→ Activating the plugins (plugins.enabled in config.yaml)…"
CFG="$HERMES_HOME/config.yaml"
if IRIS_PLUGIN_LIST="$IRIS_PLUGINS" python3 - "$CFG" <<'PY' 2>/dev/null
import os, sys, pathlib
try:
    import yaml
except ImportError:
    sys.exit(1)
names = os.environ["IRIS_PLUGIN_LIST"].split()
p = pathlib.Path(sys.argv[1])
cfg = (yaml.safe_load(p.read_text()) if p.exists() else {}) or {}
plugins = cfg.setdefault("plugins", {})
enabled = plugins.setdefault("enabled", [])
changed = False
for n in names:
    if n not in enabled:
        enabled.append(n)
        changed = True
if changed:
    p.write_text(yaml.safe_dump(cfg, sort_keys=False, allow_unicode=True))
sys.exit(0)
PY
then
  echo "  plugins added to plugins.enabled."
elif [ ! -f "$CFG" ] || ! grep -qE '^plugins:' "$CFG"; then
  { printf '\nplugins:\n  enabled:\n'; for p in $IRIS_PLUGINS; do printf '    - %s\n' "$p"; done; } >> "$CFG"
  echo "  plugins added to plugins.enabled."
else
  echo "  ⚠ Could not edit $CFG automatically (python3+PyYAML unavailable and"
  echo "    a plugins: section already exists). Add each of these under"
  echo "    plugins.enabled: $IRIS_PLUGINS"
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
