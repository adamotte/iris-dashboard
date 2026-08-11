#!/usr/bin/env bash
# Installation d'Iris (plugin + thèmes) sur la machine qui héberge hermes-agent.
# Usage : ./install.sh [--dashboard-url http://127.0.0.1:9119]
set -euo pipefail

DASH_URL="${2:-http://127.0.0.1:9119}"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$HERMES_HOME" ]; then
  echo "✗ $HERMES_HOME introuvable — hermes-agent est-il installé sur cette machine ?" >&2
  exit 1
fi

echo "→ Installation du plugin iris…"
mkdir -p "$HERMES_HOME/plugins"
cp -r "$SRC_DIR/plugins/iris" "$HERMES_HOME/plugins/"

echo "→ Installation des thèmes iris-dark / iris-light…"
mkdir -p "$HERMES_HOME/dashboard-themes"
cp "$SRC_DIR/themes/iris-dark.yaml" "$SRC_DIR/themes/iris-light.yaml" "$HERMES_HOME/dashboard-themes/"

echo "→ Rescan des plugins…"
if curl -fsS "$DASH_URL/api/dashboard/plugins/rescan" >/dev/null 2>&1; then
  echo "  plugins rechargés."
else
  echo "  (dashboard injoignable sur $DASH_URL — lance « hermes dashboard » puis recharge la page)"
fi

cat <<'EOF'

✓ Iris installé.
  1. Ouvre le dashboard et recharge la page : la nouvelle page d'accueil remplace Status.
  2. Clique sur l'icône palette (en-tête) et choisis « Iris (sombre) » ou « Iris (clair) ».
  3. Sur mobile, une barre de navigation basse apparaît automatiquement.

Désinstallation :
  rm -rf ~/.hermes/plugins/iris ~/.hermes/dashboard-themes/iris-*.yaml
EOF
