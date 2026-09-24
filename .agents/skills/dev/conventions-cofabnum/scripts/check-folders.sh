#!/usr/bin/env bash
set -euo pipefail

# CoFabNum Folder Naming Validator
# Checks that folders and files follow CoFabNum naming conventions:
# - All folders and files: kebab-case
# - Vue component files: PascalCase with 2+ words (except App.vue)
# Usage: bash scripts/check-folders.sh [<path>]
#        (defaults to current directory if no argument)

TARGET="${1:-.}"

if [[ ! -d "$TARGET" ]]; then
  echo "Error: '$TARGET' is not a directory"
  exit 2
fi

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ISSUES=0
VUE_ISSUES=0

check_kebab() {
  local name="$1"
  local path="$2"

  # Skip hidden files/dirs, node_modules, .git, dist, build, SKILL.md
  if [[ "$name" == .* ]] || [[ "$name" == "node_modules" ]] || [[ "$name" == ".git" ]] || [[ "$name" == "dist" ]] || [[ "$name" == "build" ]] || [[ "$name" == "SKILL.md" ]]; then
    return
  fi

  # Skip files with extensions that should be PascalCase (Vue files)
  if [[ "$name" == *.vue ]] || [[ "$name" == *.cy.ts ]] || [[ "$name" == *.spec.ts ]] || [[ "$name" == *.spec.js ]] || [[ "$name" == *.cy.js ]]; then
    return
  fi

  # Check kebab-case: lowercase letters, numbers, hyphens only
  if [[ "$name" =~ [A-Z] ]] || [[ "$name" =~ _ ]]; then
    echo -e "  ${YELLOW}WARN${NC} kebab-case: $path (contains uppercase or underscores)"
    ISSUES=$((ISSUES+1))
  fi
}

check_vue() {
  local name="$1"
  local path="$2"

  # Only check Vue-related files
  if [[ ! "$name" =~ \.(vue|cy\.ts|spec\.ts|cy\.js|spec\.js)$ ]]; then
    return
  fi

  # Strip extension
  local base="${name%.*}"

  # Skip App.vue
  if [[ "$base" == "App" ]]; then
    return
  fi

  # Check PascalCase: starts with uppercase, no hyphens
  if [[ ! "$base" =~ ^[A-Z] ]] || [[ "$base" =~ - ]]; then
    echo -e "  ${RED}FAIL${NC} PascalCase: $path (expected PascalCase, got: $base)"
    ISSUES=$((ISSUES+1))
    return
  fi

  # Check 2+ words (has uppercase letter after first char, or contains separator)
  # Simple check: has at least one uppercase letter after first position
  if [[ "$base" =~ ^[A-Z][a-z]+$ ]]; then
    echo -e "  ${YELLOW}WARN${NC} 2+ words: $path ('$base' — Vue components should have 2+ words, e.g. 'LoginForm')"
    VUE_ISSUES=$((VUE_ISSUES+1))
  fi
}

echo "═══════════════════════════════════════"
echo " CoFabNum Folder Naming Check"
echo " Target: $TARGET"
echo "═══════════════════════════════════════"
echo ""

# Check folders
echo "--- Folders ---"
while IFS= read -r dir; do
  check_kebab "$(basename "$dir")" "$dir"
done < <(find "$TARGET" -type d 2>/dev/null)

# Check files
echo ""
echo "--- Files ---"
while IFS= read -r file; do
  check_kebab "$(basename "$file")" "$file"
  check_vue "$(basename "$file")" "$file"
done < <(find "$TARGET" -type f 2>/dev/null)

echo ""
echo "═══════════════════════════════════════"
if [[ $ISSUES -eq 0 ]]; then
  echo " All naming conventions valid ✓"
elif [[ $ISSUES -eq 1 && $VUE_ISSUES -gt 0 ]]; then
  echo " $VUE_ISSUES warning(s) (2+ words convention) ✓"
else
  echo " $ISSUES issue(s) found ✗"
fi
echo "═══════════════════════════════════════"

exit $ISSUES
