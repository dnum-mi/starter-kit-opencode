#!/usr/bin/env bash
set -uo pipefail

# Vérifie les prérequis du kit sur le poste, sans rien installer ni afficher de jeton.
# Obligatoire absent : code 1. Optionnel absent : avertissement et mode dégradé, code 0.
# Usage : bash scripts/doctor.sh   (ou make doctor)

KIT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OPENCODE_MIN="1.18.0"
NODE_MIN="20.11.0"
DEBUG_DIR="$KIT_ROOT/scripts/cpin-debug"
BROWSERS_DIR="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
[[ "$OSTYPE" == darwin* && -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]] && BROWSERS_DIR="$HOME/Library/Caches/ms-playwright"

FAILURES=0
pass() { printf '\033[0;32m✓\033[0m %s\n' "$1"; }
fail() { printf '\033[0;31m✗\033[0m %s\n' "$1"; FAILURES=$((FAILURES + 1)); }
warn() { printf '\033[1;33m!\033[0m %s\n' "$1"; }
hint() { printf '    %s\n' "$@"; }

# Vrai si la version $1 est >= $2.
version_ge() { [[ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -1)" == "$2" ]]; }

# Première version x.y.z affichée par la commande (par défaut "<outil> --version").
version_of() {
  local cmd=("$@")
  ((${#cmd[@]} == 1)) && cmd+=(--version)
  "${cmd[@]}" 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1
}

check_required() {
  echo "--- Obligatoire ---"
  local ver
  ver="$(version_of opencode)"
  if [[ -n "$ver" ]] && version_ge "$ver" "$OPENCODE_MIN"; then
    pass "opencode $ver"
  else
    fail "opencode ≥ $OPENCODE_MIN : ${ver:-absent}"
    hint "https://opencode.ai/docs/#install"
  fi
  if command -v git >/dev/null; then pass "git $(version_of git)"; else
    fail "git : absent"; hint "sudo apt install git | brew install git | winget install Git.Git"
  fi
}

check_node() {
  local ver
  ver="$(version_of node)"
  if [[ -n "$ver" ]] && version_ge "$ver" "$NODE_MIN"; then pass "node $ver"; return; fi
  warn "node ≥ $NODE_MIN : ${ver:-absent}"
  hint "Sans lui : scripts console, Vault et debug indisponibles → mode manuel du runbook deploiement-cpin."
  hint "Installer : https://nodejs.org (ou proto install node 24)"
}

check_gh() {
  if ! command -v gh >/dev/null; then
    warn "gh : absent"
    hint "Sans lui : secrets GitHub posés et vérifiés à la main dans l'UI." "Installer : https://cli.github.com/"
    return
  fi
  local scopes
  scopes="$(gh auth status 2>/dev/null | grep -i 'token scopes' | head -1)"
  if [[ -z "$scopes" ]]; then
    warn "gh $(version_of gh) : non authentifié"; hint "gh auth login"; return
  fi
  if [[ "$scopes" == *workflow* ]]; then pass "gh $(version_of gh), authentifié, scope workflow"; return; fi
  warn "gh $(version_of gh) authentifié, sans le scope workflow"
  hint "Sans lui : les fichiers .github/workflows/ sont poussés à la main." "Ajouter : gh auth refresh -s workflow"
}

check_chart_tools() {
  local missing=0
  if command -v helm >/dev/null; then pass "helm $(version_of helm version --short)"; else
    warn "helm : absent"; hint "Installer : https://helm.sh/docs/intro/install/"; missing=1
  fi
  if command -v uv >/dev/null; then pass "uv $(version_of uv)"; else
    warn "uv : absent"; hint "Installer : curl -LsSf https://astral.sh/uv/install.sh | sh"; missing=1
  fi
  ((missing)) || return 0
  hint "Sans eux : check-cpin-rules.py ne tourne pas en local, la porte de la phase 3 passe à la CI."
}

check_playwright() {
  local firefox
  firefox="$(compgen -G "$BROWSERS_DIR/firefox-*" | head -1)"
  if [[ -d "$DEBUG_DIR/node_modules/playwright" && -n "$firefox" ]]; then pass "Playwright + Firefox"; return; fi
  warn "Playwright + Firefox : non installés dans le kit"
  hint "Sans eux : debug par l'UI d'ArgoCD." "Installer (~100 Mo) : make -C $KIT_ROOT install-debug"
}

check_optional() {
  echo ""
  echo "--- Optionnel (mode dégradé si absent) ---"
  check_node
  check_gh
  check_chart_tools
  check_playwright
}

check_required
check_optional
echo ""
if ((FAILURES)); then echo "$FAILURES prérequis obligatoire(s) manquant(s)."; exit 1; fi
echo "Prérequis obligatoires présents."
