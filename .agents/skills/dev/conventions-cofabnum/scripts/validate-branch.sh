#!/usr/bin/env bash
set -euo pipefail

# CoFabNum Branch Name Validator
# Validates git branch names against the convention:
#   <type>/<kebab-case-desc>#<ticket>
# Usage: bash scripts/validate-branch.sh [<branch-name>]
#        (defaults to current branch if no argument)

BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")}"

if [[ -z "$BRANCH" ]]; then
  echo "Error: could not determine branch name"
  echo "Usage: bash scripts/validate-branch.sh [<branch-name>]"
  exit 2
fi

# Valid types
VALID_TYPES="feat fix hotfix tech docs refactor"

# Extract type part (before first /)
TYPE="${BRANCH%%/*}"
REMAINDER="${BRANCH#*/}"

# Check if branch has the expected format
if [[ "$BRANCH" != */* ]]; then
  echo "FAIL: '$BRANCH' — format must be: <type>/<description>#<ticket>"
  echo "  Valid types: feat | fix | hotfix | tech | docs | refactor"
  exit 1
fi

# Validate type
TYPE_OK=false
for valid in $VALID_TYPES; do
  if [[ "$TYPE" == "$valid" ]]; then
    TYPE_OK=true
    break
  fi
done

if ! $TYPE_OK; then
  echo "FAIL: '$TYPE' is not a valid branch type"
  echo "  Valid types: $VALID_TYPES"
  exit 1
fi

# Check kebab-case description (before #)
DESC="${REMAINDER%%#*}"
TICKET="${REMAINDER##*#}"

if [[ "$DESC" == "$REMAINDER" ]]; then
  echo "FAIL: '$BRANCH' — missing ticket number after #"
  echo "  Example: feat/my-feature#123"
  exit 1
fi

# Validate kebab-case: only lowercase letters, numbers, hyphens
if [[ "$DESC" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  : # valid
else
  echo "FAIL: '$DESC' — description must be kebab-case (lowercase, numbers, hyphens only)"
  echo "  Example: worker-logs (not worker_logs, not WorkerLogs, not worker-Logs)"
  exit 1
fi

# Validate ticket number is numeric
if [[ ! "$TICKET" =~ ^[0-9]+$ ]]; then
  echo "FAIL: '$TICKET' — ticket number must be numeric"
  exit 1
fi

echo "PASS: '$BRANCH' ✓"
echo "  Type: $TYPE"
echo "  Description: $DESC"
echo "  Ticket: #$TICKET"
exit 0
