---
name: outils-dev
description: Use when working with developer tooling — Git workflows, Docker compose, VS Code setup, GitHub CLI, pnpm, proto, zsh, uv, or any development utility for Fabrique Numérique projects
allowed-tools: Bash Read
---

# CoFabNum Developer Tools

Working with the tools used in Fabrique Numérique projects.

## Available Scripts

- **`scripts/check-environment.sh`** — Verifies all required and optional tools are installed
  - Usage: `bash scripts/check-environment.sh` (read-only report)
  - Usage: `bash scripts/check-environment.sh --fix` (includes install commands)

## Git

### Branch naming

```
<type>/<kebab-description>#<ticket>
```

Types: `feat`, `fix`, `hotfix`, `tech`, `docs`, `refactor`

### Commit messages

Conventional Commits. French acceptable.

```
feat: ajouter authentification JWT#123
fix: corriger le nommage de la variable user#124
tech: mise à jour des dépendances#125
```

### zsh aliases

Add to `~/.zshrc`:

```zsh
alias gfeat='git switch -c feat/$1 && ding'
alias gfix='git switch -c fix/$1 && ding'
alias gtech='git switch -c tech/$1 && ding'

ding() {
  [ "$(uname -s)" = "Darwin" ] && afplay /System/Library/Sounds/Glass.aiff &>/dev/null &
  [ "$(uname -s)" != "Darwin" ] && play /path/to/ok.mp3 &>/dev/null &
}
```

## Docker

### Container rules

- Lightweight base: `*-alpine`, `*-slim`, `distroless`
- Non-root user (UID ≥ 1000)
- Multi-stage builds
- Non-privileged port (≥ 1024)
- **Never** use `latest` tag in production

### Docker Compose

Default for local development. See [environnement-installation] for template.

### Kubernetes local (optional)

| Tool | When to use |
|------|-------------|
| [Kind](https://kind.sigs.k8s.io/) | Test K8s manifests locally |
| [k3d](https://k3d.io/) | Lightweight K8s in Docker |
| [Minikube](https://minikube.sigs.k8s.io/) | Local cluster with GUI |

## pnpm

```shell
pnpm install            # Install all deps
pnpm add <pkg>          # Add dependency
pnpm add -D <pkg>       # Add dev dependency
pnpm store path         # Cache path for CI
```

See [environnement-installation] for setup, [monorepo] for workspaces.

## proto

```shell
proto install node@24.13.1
proto install python@3.12
proto ls                  # List installed
```

Create `.prototools` at project root for auto-version switching.

## GitHub CLI

```shell
gh auth login
gh pr create --title "feat: new feature#123"
gh pr list
gh pr checkout <number>
gh pr review --approve
gh pr review --comment --body "LGTM"
```

## uv (Python)

```shell
uv init my-project
uv add fastapi
uv add --dev ruff pytest httpx
uv run fastapi dev
uv run pytest
uv run ruff check .
```

Files: `pyproject.toml` (metadata), `uv.lock` (locked deps).

## VS Code Extensions

| Extension | Purpose |
|-----------|---------|
| ESLint | JS/TS linting |
| Prisma | Schema highlighting |
| Python | Python support |
| Docker | Containers |
| REST Client | API testing |

See [environnement-installation] for settings.

## Gotchas

- **Branch names must include ticket** — `feat/description` is incomplete, use `feat/description#123`
- **pnpm store caching** — use `pnpm store path` output for CI cache key, not a hardcoded path
- **Docker group on Linux** — `usermod -aG docker` requires re-login to take effect
- **proto versions override system** — proto-managed versions take precedence over system-wide installs
- **Never commit `.turbo/`** — it's a local cache directory
- **GitHub Actions pin versions** — always use `@v6` tags, never `@latest` or `@main`
- **WSL2 memory** — if Docker is slow on WSL, increase memory in `.wslconfig`
- **Docker Compose is default** — only use Kind/k3d/Minikube when testing K8s-specific features
