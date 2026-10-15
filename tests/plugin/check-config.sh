#!/usr/bin/env bash
# Vérifie que le plugin installe socle, instructions, skills, agents et commandes du groupe demandé,
# et rien d'un groupe non demandé. N'appelle aucun modèle. Usage : tests/plugin/check-config.sh
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cat > "$WORK/opencode.json" <<JSON
{ "plugin": [["$ROOT", { "groups": ["gouv-fr/dso"] }]], "agent": { "cpin-review": { "temperature": 0.5 } } }
JSON
mkdir -p "$WORK/code"
cat > "$WORK/code/opencode.json" <<JSON
{ "plugin": [["$ROOT", { "groups": ["gouv-fr/code"] }]] }
JSON
mkdir -p "$WORK/anssi"
cat > "$WORK/anssi/opencode.json" <<JSON
{ "plugin": [["$ROOT", { "groups": ["gouv-fr/anssi"] }]] }
JSON
cd "$WORK"
# Seuls les champs vérifiés sont extraits : la config globale peut contenir des secrets.
opencode debug config | jq -e --arg root "$ROOT" '
  (.instructions | index($root + "/AGENTS.md") and index($root + "/.agents/skills/gouv-fr/dso/instructions.md"))
  and (.instructions | index($root + "/.agents/skills/gouv-fr/code/instructions.md") | not)
  and (.skills.paths | index($root + "/.agents/skills/gouv-fr/dso"))
  and (.agent["cpin-orchestrateur"].mode == "primary")
  and ([.agent["cpin-plan", "cpin-build", "cpin-review"].mode] | all(. == "subagent"))
  and (.agent["cpin-review"].temperature == 0.5)
  and (.command["deployer-cpin"].agent == "cpin-orchestrateur")
' > /dev/null
echo "OK   plugin starter-kit (groupe gouv-fr/dso)"

cd "$WORK/code"
opencode debug config | jq -e --arg root "$ROOT" '
  (.instructions | index($root + "/.agents/skills/gouv-fr/code/instructions.md"))
  and (.instructions | index($root + "/.agents/skills/gouv-fr/dso/instructions.md") | not)
  and ([.agent["dev-verif-plan", "dev-review"].mode] | all(. == "subagent"))
  and (.agent["cpin-orchestrateur"] == null)
  and (.command.livrer.agent == "build")
  and (.command["deployer-cpin"] == null)
' > /dev/null
echo "OK   plugin starter-kit (groupe gouv-fr/code)"

# Groupe imbriqué sous gouv-fr/, sans agent ni commande : instructions + catalogue seuls.
cd "$WORK/anssi"
opencode debug config | jq -e --arg root "$ROOT" '
  (.instructions | index($root + "/.agents/skills/gouv-fr/anssi/instructions.md"))
  and (.skills.paths | index($root + "/.agents/skills/gouv-fr/anssi"))
  and (.agent["cpin-orchestrateur"] == null)
  and (.agent["dev-review"] == null)
' > /dev/null
echo "OK   plugin starter-kit (groupe imbriqué gouv-fr/anssi)"
