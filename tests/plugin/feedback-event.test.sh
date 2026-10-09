#!/usr/bin/env bash
# Vérifie que la commande /feedback est enregistrée par le plugin et que son template
# et le handler d'événement n'utilisent que des APIs opencode documentées.
# Usage : tests/plugin/feedback-event.test.sh
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cat > "$WORK/opencode.json" <<JSON
{ "plugin": [["$ROOT", { "groups": ["dev"] }]] }
JSON
cd "$WORK"

# 1. La commande /feedback est enregistrée avec le bon frontmatter
opencode debug config | jq -e '
  .command.feedback.agent == "build"
  and .command.feedback.subtask == false
  and (.command.feedback.description | length > 0)
' > /dev/null && echo "OK   commande /feedback enregistrée"

# 2. Le template ne contient pas de syntaxe invalide (<await user input>)
if grep -q '<await user input>' "$ROOT/commands/root/feedback.md"; then
  echo "KO   template contient <await user input> (syntaxe non opencode)" >&2
  exit 1
fi
echo "OK   template sans <await user input>"

# 3. Le handler d'événement n'utilise que des APIs documentées (event + client.tui)
if grep -qE 'client\.(app\.ask|commands\.run)' "$ROOT/plugin/starter-kit.js"; then
  echo "KO   handler utilise une API non documentée (client.app.ask / client.commands.run)" >&2
  exit 1
fi
grep -q 'event: async' "$ROOT/plugin/starter-kit.js" \
  && echo "OK   handler via le hook event (API documentée)"
