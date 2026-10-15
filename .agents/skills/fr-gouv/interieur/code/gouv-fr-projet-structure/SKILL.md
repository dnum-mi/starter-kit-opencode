---
name: gouv-fr-projet-structure
description: Structure un projet Fabrique Numérique (layout, CLI, config OpenCode, variables d'environnement) et l'initialise proprement, sans fuite ni écrasement.
category: code
version: 0.3.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, structure, repo, init, gitignore, opencode, cli, environnement]
    related_skills: [gouv-fr-code-quality, gouv-fr-repo-cicd, gouv-fr-stack-technique, gouv-fr-monorepo-pnpm]
---

# Gouv-fr — Structure de projet et initialisation de dépôt

## Quand utiliser

- **Structurer** un projet (layout, CLI, intégration OpenCode, variables d'environnement).
- **Initialiser** un dépôt proprement et sans fuite : `git init`, `.gitignore` durci, hooks secrets.

Ne pas confondre avec `gouv-fr-monorepo-pnpm` (organisation multi-packages) ni `gouv-fr-repo-cicd` (CI/CD
Cloud Pi Native d'un dépôt existant).

## 1. Structure de projet

### Project Layout

```
my-app/
├── AGENTS.md                 # Règles projet + architecture
├── BACKLOG.md                # Tickets (epics → tasks, 🔴🟠🟡)
├── TESTS.md                  # Scénarios de validation
├── FEEDBACK.md               # Retours utilisateurs
├── opencode.json             # OpenCode config: provider Albert + MCPs
├── .albert-code/
│   └── skills.txt            # Skills sélectionnés pour la VM
└── src/
    ├── components/            # Composants DSFR
    ├── pages/                 # Pages / routes
    ├── services/              # API calls, services métier
    └── styles/                # Custom styles
```

### CLI Verbs

| Verbe | Action | Quand |
|---|---|---|
| `gouv-fr-code-index setup` | Scaffold: AGENTS.md, opencode.json, MCP selection, skills selection | Une fois par projet |
| `gouv-fr-code-index run` | Lancer agent OpenCode dans la VM | Par session de codage |

### How OpenCode Loads Gouv-fr

OpenCode lit `AGENTS.md`. La zone gouv-fr-code-index (`<!-- gouv-fr-code-index:agents:start -->` /
`<!-- gouv-fr-code-index:agents:end -->`) est gérée automatiquement.

### Key Environment Variables

| Variable | Default | Rôle |
|---|---|---|
| `AC_VM_CPUS` | `4` | CPU alloué à la VM |
| `AC_VM_MEMORY` | `8` (GiB) | RAM allouée à la VM |
| `AC_VM_DISK` | `32` (GiB) | Disque (sparse, croissance) |
| `AC_ALBERT_BASE_URL` | `https://albert.api.etalab.gouv.fr/v1` | Endpoint Albert API |
| `AGENT_VM_DIR` | `$SELF_DIR/vendor/vm` | Bundle agent-vm |
| `RUNTIME_VM_FILE` | `$HOME/.agent-vm/runtime.sh` | Config runtime VM |

Détail : [`references/source-gouv-fr-projet-structure.md`](references/source-gouv-fr-projet-structure.md)

## 2. Initialisation de dépôt

### Garde-fous

- **Ne jamais écraser** un fichier existant sans le signaler. Si `.gitignore`, `README.md` ou
  `.pre-commit-config.yaml` existent déjà, **fusionner** (ajouter les lignes manquantes), ne pas remplacer.
- **Refuser** d'opérer sur un répertoire qui contient déjà des secrets non protégés (`.env`, clés) sans
  d'abord les couvrir par le `.gitignore`.
- **Ne pas committer de secret** : si le working tree contient déjà un secret, le faire ignorer AVANT le
  premier commit.

### Étapes

1. **Cible** = l'argument passé, ou le répertoire courant. Détecter le type de projet (`package.json`,
   `pyproject.toml`, `go.mod`…) pour adapter les ignores ; sinon « générique ».
2. **git** : `git init` si `.git` absent, brancher sur `main`.
3. **`.gitignore` durci** (créer ou fusionner) : `private/`, `.env`, `.env.*`, `!.env.example`, `*.secret`,
   `*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*`, `*.bak-*`, kubeconfig, `*.tfstate`, dumps,
   `.vscode/*.local`. Le gabarit complet est dans
   [`references/source-gouv-fr-repo-init.md`](references/source-gouv-fr-repo-init.md).

### Vérifications de fin (toutes doivent passer)

- `git check-ignore private/ .env` → les deux ignorés.
- Aucun secret dans le working tree avant le premier commit.

Détail complet (hooks pre-commit, CI secrets) :
[`references/source-gouv-fr-repo-init.md`](references/source-gouv-fr-repo-init.md)
