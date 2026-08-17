#!/usr/bin/env bash
# Sync per-plugin content branches from the monorepo subdirs.
#
# Each iris plugin lives in the monorepo at plugins/iris-*; the dashboard
# update path (`hermes plugins update` -> `git pull --ff-only` inside
# ~/.hermes/plugins/<name>) requires that directory to BE a git checkout
# whose root matches the plugin content. A sparse checkout of the monorepo
# cannot do that (the repo nests the plugin under plugins/), so we publish
# one fast-forward branch per plugin whose root tree IS the plugin content.
# install.sh clones those branches; this script regenerates and pushes them
# after a release.
#
# Run from the repo root after a release:  tools/sync-plugin-branches.sh
set -euo pipefail
cd "$(dirname "$0")/.."

git fetch -q origin develop
REV=$(git rev-parse origin/develop)
UPDATED=0

for dir in plugins/iris*; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  subtree=$(git rev-parse "$REV^{tree}:$dir") || { echo "skip $name: no tree" >&2; continue; }
  if git show-ref -q "refs/heads/$name"; then
    cur=$(git rev-parse "refs/heads/$name")
    if [ "$(git rev-parse "$cur^{tree}")" = "$subtree" ]; then
      echo "= $name (unchanged)"
      continue
    fi
    new=$(printf 'sync %s @ %s' "$name" "$(git rev-parse --short "$REV")" \
      | git commit-tree "$subtree" -p "$cur")
  else
    new=$(printf 'iris %s @ %s' "$name" "$(git rev-parse --short "$REV")" \
      | git commit-tree "$subtree")
  fi
  git branch -f "$name" "$new"
  git push -q origin "$name"
  echo "pushed $name @ $(git rev-parse --short "$new")"
  UPDATED=$((UPDATED + 1))
done

echo "done: $UPDATED branch(es) pushed."