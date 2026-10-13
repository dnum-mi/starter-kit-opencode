#!/usr/bin/env bash
set -euo pipefail

# CoFabNum Environment Checker
# Verifies that required tools are installed and reports version information.
# Usage: bash scripts/check-environment.sh [--fix]

FIX="${1:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { printf "${GREEN}✓${NC} %s\n" "$1"; }
fail() { printf "${RED}✗${NC} %s\n" "$1"; FAILURES=$((FAILURES+1)); }
warn() { printf "${YELLOW}!${NC} %s\n" "$1"; }

FAILURES=0

echo "═══════════════════════════════════════"
echo " CoFabNum Environment Checker"
echo "═══════════════════════════════════════"
echo ""

# --- Required tools ---
echo "--- Required Tools ---"

for tool in git; do
  if command -v "$tool" &>/dev/null; then
    VER=$("$tool" --version 2>&1 | head -1)
    pass "$tool: $VER"
  else
    fail "$tool: not found"
    if [[ "$FIX" == "--fix" ]]; then
      case "$tool" in
        git) warn "  Install: sudo apt install git  |  brew install git  |  winget install Git.Git" ;;
      esac
    fi
  fi
done

for tool in node pnpm; do
  if [[ "$tool" == "pnpm" ]]; then
    CMD="pnpm"
  else
    CMD="$tool"
  fi
  if command -v "$CMD" &>/dev/null; then
    VER=$("$CMD" --version 2>&1)
    pass "$tool: $VER"
    if [[ "$tool" == "node" && "$VER" != 2* ]]; then
      warn "  Node 24.x recommended (found: $VER)"
    fi
    if [[ "$tool" == "pnpm" && "$VER" != 1* ]]; then
      warn "  pnpm 10.x recommended (found: $VER)"
    fi
  else
    fail "$tool: not found"
    if [[ "$FIX" == "--fix" ]]; then
      case "$tool" in
        node) warn "  Install via proto: curl proto.sh | sh" ;;
        pnpm) warn "  Install via proto: proto install pnpm@10" ;;
      esac
    fi
  fi
done

for tool in docker; do
  if command -v "$tool" &>/dev/null; then
    VER=$("$tool" --version 2>&1)
    pass "$tool: $VER"
  else
    fail "$tool: not found"
    if [[ "$FIX" == "--fix" ]]; then
      warn "  Install: https://docs.docker.com/get-docker/"
    fi
  fi
done

# --- Optional tools ---
echo ""
echo "--- Optional Tools ---"

for tool in proto zsh gh uv ruff; do
  if command -v "$tool" &>/dev/null; then
    VER=$("$tool" --version 2>&1 || echo "installed")
    pass "$tool: $VER"
  else
    warn "$tool: not found (recommended)"
    if [[ "$FIX" == "--fix" ]]; then
      case "$tool" in
        proto) warn "  curl proto.sh | sh" ;;
        zsh) warn "  sudo apt install zsh  |  brew install zsh" ;;
        gh) warn "  https://cli.github.com/" ;;
        uv) warn "  curl -LsSf https://astral.sh/uv/install.sh | sh" ;;
        ruff) warn "  uv add --dev ruff  |  pipx run ruff" ;;
      esac
    fi
  fi
done

# --- Docker group (Linux/macOS) ---
if [[ "$OSTYPE" == "linux-gnu"* || "$OSTYPE" == "darwin"* ]]; then
  echo ""
  if groups "$USER" 2>/dev/null | grep -q docker; then
    pass "$USER is in docker group"
  else
    warn "$USER is NOT in docker group (run: sudo usermod -aG docker $USER, then re-login)"
  fi
fi

# --- WSL detection ---
if grep -qi microsoft /proc/version 2>/dev/null; then
  echo ""
  warn "Running in WSL — ensure VS Code WSL extension is installed"
fi

echo ""
echo "═══════════════════════════════════════"
if [[ $FAILURES -eq 0 ]]; then
  echo " All required tools found ✓"
else
  echo " $FAILURES missing tool(s) found ✗"
fi
echo "═══════════════════════════════════════"

exit $FAILURES
