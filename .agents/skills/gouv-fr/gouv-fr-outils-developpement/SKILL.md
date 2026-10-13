---
name: gouv-fr-outils-developpement
description: Installation et configuration des outils dev (Git, Docker, pnpm, proto, VS Code, GitHub CLI, uv, zsh). Vérification d'environnement, branches, commits, Docker Compose.
category: workflow
version: 0.2.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, dev-tools, git, docker, pnpm, proto, vscode, github-cli, uv, shell]
    related_skills: [gouv-fr-stack-technique, gouv-fr-deployment-docker-k8s, gouv-fr-conventions-nommage]
---

# Gouv-fr — Outils de développement

Travailler avec les outils de développement utilisés dans les projets Fabrique Numérique : installation, configuration,
Git, Docker, pnpm, proto, VS Code, GitHub CLI, etc.

## Quand utiliser
- Configurer ou dépanner son environnement de développement
- Installer et configurer les outils requis (Git, Docker, pnpm, proto, VS Code)
- Automatiser la vérification de l'environnement
- Gérer les workflows Git (branches, commits, PRs)

## Scripts disponibles
- **`scripts/check-environment.sh`** — Vérifie tous les outils requis et optionnels
  - Usage : `bash scripts/check-environment.sh` (rapport en lecture seule)
  - Usage : `bash scripts/check-environment.sh --fix` (inclut les commandes d'installation)

## Installation machine
### Windows

#### WSL

```shell
# PowerShell (Admin)
wsl --install
# Recommandé : Ubuntu
wsl --install -d Ubuntu
```

#### Installer dans WSL

```shell
sudo apt update && sudo apt install -y git zsh docker.io
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
curl proto.sh | sh
```

#### VS Code

Utiliser **l'extension WSL** — ouvrir les dossiers dans WSL, pas dans Windows.

### macOS

#### Homebrew

```shell
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installer

```shell
brew install git zsh proto docker
```

#### VS Code

```shell
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-vscode.vscode-docker
code --install-extension Prisma.prisma
```

### Ubuntu

```shell
sudo apt update
sudo apt install -y git zsh docker.io
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
curl proto.sh | sh
```

```shell
# Docker : ajouter l'utilisateur au groupe
sudo usermod -aG docker $USER
# Reconnexion requise
```

### Proto Setup

Créer `.prototools` à la racine du projet :

```
node 24.13.1
pnpm 10.0.0
```

Proto bascule automatiquement les versions au changement de répertoire.

## Git

### Branch naming

```
<type>/<kebab-description>#<ticket>
```

Types : `feat`, `fix`, `hotfix`, `tech`, `docs`, `refactor`

### Commit messages

Conventional Commits. Français acceptable.

```
feat: ajouter authentification JWT#123
fix: corriger le nommage de la variable user#124
tech: mise à jour des dépendances#125
```

### Pull Requests

- Une PR = une intention
- Jamais de `--force` sur les branches partagées
- Review obligatoire avant merge

### Trailer obligatoire

```
Co-Authored-By: gouv-fr-code (<id>) <noreply@numerique.gouv.fr>
```

### Configuration Git

```shell
git config --global init.defaultBranch main
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
```

### zsh aliases

Ajouter à `~/.zshrc` :

```zsh
alias gfeat='git switch -c feat/$1 && ding'
alias gfix='git switch -c fix/$1 && ding'
alias gtech='git switch -c tech/$1 && ding'

ding() {
  [ "$(uname -s)" = "Darwin" ] && afplay /System/Library/Sounds/Glass.aiff &>/dev/null &
  [ "$(uname -s)" != "Darwin" ] && play /path/to/ok.mp3 &>/dev/null &
}
```

### Alias zsh (méthode alternative)

```bash
createFeatBranch() { (git switch -c "feat/$1" && ding) || dong }
createFixBranch() { (git switch -c "fix/$1" && ding) || dong }
createTechBranch() { (git switch -c "tech/$1" && ding) || dong }

alias gfeat='createFeatBranch'
alias gfix='createFixBranch'
alias gtech='createTechBranch'
```

## Docker

### Container rules

- Lightweight base : `*-alpine`, `*-slim`, `distroless`
- Non-root user (UID ≥ 1000)
- Multi-stage builds
- Non-privileged port (≥ 1024)
- **Never** use `latest` tag in production

### Docker Compose

Default for local development.

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

### Kubernetes local (optional)

| Tool | When to use |
|---|---|
| [Kind](https://kind.sigs.k8s.io/) | Test K8s manifests locally |
| [k3d](https://k3d.io/) | Lightweight K8s in Docker |
| [Minikube](https://minikube.sigs.k8s.io/) | Local cluster with GUI |

Tester l'image en lecture seule avant de livrer : `docker run --read-only <image>`.

## pnpm

```shell
pnpm install            # Install all deps
pnpm add <pkg>          # Add dependency
pnpm add -D <pkg>       # Add dev dependency
pnpm store path         # Cache path for CI
```

Voir [gouv-fr-monorepo-pnpm] pour les workspaces.

## proto

```shell
proto install node@24.13.1
proto install python@3.12
proto ls                  # List installed
```

Créer `.prototools` à la racine du projet pour le switching automatique.

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

Files : `pyproject.toml` (metadata), `uv.lock` (locked deps).

## VS Code Extensions

| Extension | Purpose |
|---|---|
| ESLint | JS/TS linting |
| Prisma | Schema highlighting |
| Python | Python support |
| Docker | Containers |
| REST Client | API testing |

### VS Code Settings

`.vscode/settings.json` :

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

## Noms de fichiers et dossiers
- **Impérativement kebab-case**
- Exception : noms de composants Vue (au moins 2 mots, CamelCase) + `App.vue`

### Structure de projet (kebab-case)

```
my-app/
├── src/
│   ├── index.ts              # Point d'entrée
│   ├── app.ts                # Config Fastify/NestJS
│   ├── plugins/              # Plugins Fastify
│   ├── routes/               # Routes
│   ├── services/             # Logique métier
│   └── utils/                # Utilitaires
└── tests/
    └── routes/
        └── cat-routes.test.ts
```

## Noms de variables

| Type | Convention | Exemple |
|---|---|---|
| Variable booléenne | `is*`, `has*`, `should*`, `can*` + camelCase | `isActive`, `hasPermission` |
| Variable date | camelCase + suffixe `Date` ou `At` | `startDate`, `lastModifiedAt` |
| Fonction/class | camelCase / PascalCase | `getUser()`, `UserService` |
| Constante | SCREAMING_SNAKE_CASE | `MAX_RETRIES` |
| Variable générale | camelCase, explicite | `userEmail`, `appConfig` |

### Règles

- Noms en **anglais** par défaut
- Français autorisé si traduction prête à confusion ou mot réservé (`dossier`, `affaire`)
- **Proscrit** : variables d'une seule lettre (sauf identité `x => x`)
- Noms explicites : potentiellement longs, mais pas excessifs

## Hygiène de Dépôt

- `.gitignore` avant le 1er commit
- Jamais commité : `node_modules/`, `.venv/`, `vendor/`, secrets, `.env`

## Pièges
- **Branches incluent le ticket** — `feat/description` est incomplet, utiliser `feat/description#123`
- **pnpm store caching** — utiliser la sortie `pnpm store path` pour la clé de cache CI, pas un chemin hardcodé
- **Docker group on Linux** — `usermod -aG docker` nécessite une reconnexion
- **proto versions override system** — les versions proto ont la priorité sur les installations système
- **Never commit `.turbo/`** — c'est un cache local
- **GitHub Actions pin versions** — toujours utiliser `@v6`, jamais `@latest` ou `@main`
- **WSL2 memory** — si Docker est lent sur WSL, augmenter la mémoire dans `.wslconfig`
- **Windows developers MUST use WSL** — pas de développement natif Windows
- **Docker requires re-login** — les changements de groupe docker ne s'appliquent pas aux sessions existantes
- **Noto fonts** — installer `fonts-noto` pour le rendu Unicode correct dans les terminaux
- **Ne pas utiliser `master` comme branche par défaut** — `main` seulement
- **Ne pas mélanger kebab-case et camelCase** dans les noms de fichiers
