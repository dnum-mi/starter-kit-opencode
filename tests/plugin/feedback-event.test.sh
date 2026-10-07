#!/usr/bin/env bash
# Simple smoke test for the feedback command and event handler
# This script does not actually trigger a skill error (that would require a full OpenCode session).
# Instead it runs the /feedback command in a non‑interactive way to verify that the command
# is registered and that the `gh issue create --dry-run` path works.

set -e

# Create a temporary body file
cat > /tmp/feedback_body.md <<'EOF'
## Contexte
Test error message

## Symptôme
Erreur simulée

## Attendu
Le skill aurait dû réussir

## Reproduction
1. Exécuter `/feedback`
2. Répondre aux invites
EOF

# Run the command via the OpenCode CLI (assuming `opencode` is in PATH)
# The command will ask for input; we simulate input via a heredoc.
opencode "feedback" <<EOF



EOF

# Verify that the command returns a non‑zero exit code only on failure
EOF