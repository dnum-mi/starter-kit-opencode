---
name: environnement-installation
description: Use when setting up a developer machine for Fabrique Numérique projects — Windows/WSL, macOS, or Ubuntu installation guides for Git, pnpm, proto, Docker, zsh, and VS Code
allowed-tools: Bash Read Write
---

# CoFabNum Environment Installation

Install and configure tools for Fabrique Numérique development.

## Tools Matrix

| Tool | Purpose | Required |
|------|---------|----------|
| [proto](https://moonrepo.dev/docs/proto) | Multi-language version manager | Yes |
| [Git](https://git-scm.com/) | Version control | Yes |
| [pnpm](https://pnpm.io/) v10.x | Package manager | Yes |
| [Docker](https://www.docker.com/) | Containerization | Yes |
| [zsh](https://zsh.sourceforge.io/) + oh-my-zsh | Shell | Recommended |
| [GitHub CLI](https://cli.github.com/) | GitHub interactions | Recommended |
| [uv](https://docs.astral.sh/uv/) | Python project manager | Python projects |
| Node.js 24.x LTS | Runtime | JS/TS projects |

## Windows

### WSL

```shell
# PowerShell (Admin)
wsl --install
# Recommended: Ubuntu
wsl --install -d Ubuntu
```

### Install in WSL

```shell
sudo apt update && sudo apt install -y git zsh docker.io
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
curl proto.sh | sh
```

### VS Code

Use the **WSL extension** — open folders inside WSL, not Windows.

## macOS

### Homebrew

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Install

```shell
brew install git zsh proto docker
```

### VS Code

```shell
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-vscode.vscode-docker
code --install-extension Prisma.prisma
```

## Ubuntu

```shell
sudo apt update
sudo apt install -y git zsh docker.io
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
curl proto.sh | sh
```

```shell
# Docker: add user to group
sudo usermod -aG docker $USER
# Re-login required
```

## Proto Setup

Create `.prototools` at project root:

```
node 24.13.1
pnpm 10.0.0
```

Proto auto-switches versions on directory change.

## Git Configuration

```shell
git config --global init.defaultBranch main
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
```

## VS Code Settings

`.vscode/settings.json`:

```json
{
  "[javascript][typescript][vue]": {
    "editor.defaultFormatter": "dbaeumer.vscode-eslint",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }
  },
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll": "explicit",
      "source.organizeImports": "explicit"
    }
  },
  "editor.rulers": [120, 140]
}
```

## Docker Compose

Default for local dev:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports: ["3000:3000"]
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
```

## Gotchas

- **Windows developers MUST use WSL** — no native Windows development
- **Docker group membership** — after `usermod -aG docker`, re-login is required for changes to take effect
- **proto over direct installs** — always use proto for Node/Python versions, never system-wide installs
- **VS Code WSL extension** — Windows users must install the WSL extension to open folders in WSL
- **pnpm store caching in CI** — cache the pnpm store path (`pnpm store path`) between CI runs
- **Docker requires re-login** — changes to docker group don't apply to existing sessions
- **Noto fonts** — install `fonts-noto` for proper Unicode rendering in terminals
- **WSL2 memory** — create `.wslconfig` in `%USERPROFILE%` if WSL2 consumes too much RAM
