#!/usr/bin/env bash
# Installation d'Iris (plugin + thèmes) pour le dashboard hermes-agent.
#
# Installation native :   ./install.sh
# Installation Docker :   ./install.sh --docker /chemin/du/volume/hermes
#   (le chemin est le dossier hôte monté comme ~/.hermes dans le conteneur)
#
# Options : --dashboard-url <url>   (défaut : http://127.0.0.1:9119)
set -euo pipefail

DASH_URL="http://127.0.0.1:9119"
HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
DOCKER_MODE=0
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"

while [ $# -gt 0 ]; do
  case "$1" in
    --docker)
      DOCKER_MODE=1
      HERMES_HOME="${2:?usage: --docker <dossier-volume-hermes>}"
      shift 2 ;;
    --dashboard-url)
      DASH_URL="${2:?usage: --dashboard-url <url>}"
      shift 2 ;;
    *)
      echo "option inconnue : $1" >&2; exit 1 ;;
  esac
done

if [ ! -d "$HERMES_HOME" ]; then
  if [ "$DOCKER_MODE" = 1 ]; then
    echo "✗ $HERMES_HOME introuvable — est-ce bien le dossier hôte monté comme ~/.hermes ?" >&2
  else
    echo "✗ $HERMES_HOME introuvable — hermes-agent est-il installé sur cette machine ?" >&2
  fi
  exit 1
fi

echo "→ Installation du plugin iris dans $HERMES_HOME/plugins/…"
mkdir -p "$HERMES_HOME/plugins"
rm -rf "$HERMES_HOME/plugins/iris"
cp -r "$SRC_DIR/plugins/iris" "$HERMES_HOME/plugins/"

echo "→ Installation des thèmes iris-dark / iris-light…"
mkdir -p "$HERMES_HOME/dashboard-themes"
cp "$SRC_DIR/themes/iris-dark.yaml" "$SRC_DIR/themes/iris-light.yaml" "$HERMES_HOME/dashboard-themes/"

echo "→ Rescan des plugins…"
if curl -fsS "$DASH_URL/api/dashboard/plugins/rescan" >/dev/null 2>&1; then
  echo "  plugins rechargés."
elif [ "$DOCKER_MODE" = 1 ]; then
  echo "  (dashboard injoignable sur $DASH_URL — redémarre le conteneur hermes)"
else
  echo "  (dashboard injoignable sur $DASH_URL — lance « hermes dashboard » puis recharge la page)"
fi

cat <<'EOF'

✓ Iris installé.
  1. Recharge la page du dashboard (redémarre le conteneur si le rescan a échoué) :
     la nouvelle page d'accueil remplace Status.
  2. Icône palette (en-tête) → « Iris (sombre) » ou « Iris (clair) ».
  3. Sur mobile, une barre de navigation basse apparaît automatiquement.

Mise à jour :  git pull puis relancer ce script.
Désinstallation :
  rm -rf <hermes-home>/plugins/iris <hermes-home>/dashboard-themes/iris-*.yaml
EOF
