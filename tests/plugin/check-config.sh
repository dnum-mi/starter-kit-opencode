#!/usr/bin/env bash
# Vérifie que le plugin installe socle, instructions, skills, agents et commandes du groupe demandé,
# et rien d'un groupe non demandé. N'appelle aucun modèle. Usage : tests/plugin/check-config.sh
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cat > "$WORK/opencode.json" <<JSON
{ "plugin": [["$ROOT", { "groups": ["dso"] }]], "agent": { "cpin-review": { "temperature": 0.5 } } }
JSON
mkdir "$WORK/dev"
cat > "$WORK/dev/opencode.json" <<JSON
{ "plugin": [["$ROOT", { "groups": ["dev"] }]] }
JSON
cd "$WORK"
# Seuls les champs vérifiés sont extraits : la config globale peut contenir des secrets.
opencode debug config | jq -e --arg root "$ROOT" '
  (.instructions | index($root + "/AGENTS.md") and index($root + "/.agents/skills/dso/instructions.md"))
  and (.instructions | index($root + "/.agents/skills/dev/instructions.md") | not)
  and (.skills.paths | index($root + "/.agents/skills/dso"))
  and (.agent["cpin-orchestrateur"].mode == "primary")
  and ([.agent["cpin-plan", "cpin-build", "cpin-review"].mode] | all(. == "subagent"))
  and (.agent["cpin-review"].temperature == 0.5)
  and (.command["deployer-cpin"].agent == "cpin-orchestrateur")
' > /dev/null && echo "OK   plugin starter-kit (groupe dso)"

cd "$WORK/dev"
opencode debug config | jq -e --arg root "$ROOT" '
  (.instructions | index($root + "/.agents/skills/dev/instructions.md"))
  and (.instructions | index($root + "/.agents/skills/dso/instructions.md") | not)
  and ([.agent["dev-verif-plan", "dev-review"].mode] | all(. == "subagent"))
  and (.agent["cpin-orchestrateur"] == null)
  and (.command.livrer.agent == "build")
  and (.command["deployer-cpin"] == null)
' > /dev/null && echo "OK   plugin starter-kit (groupe dev)"
