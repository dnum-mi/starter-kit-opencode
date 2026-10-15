---
name: projet-structure
description: Structure un projet (layout, config OpenCode) et l'initialise proprement, sans fuite ni écrasement.
category: code
version: 0.3.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, structure, repo, init, gitignore, opencode, cli, environnement]
    related_skills: [code-quality, repo-cicd, stack-technique, monorepo-pnpm]
---

# Gouv-fr — Structure de projet et initialisation de dépôt

## Quand utiliser

- **Structurer** un projet (layout, CLI, intégration OpenCode, variables d'environnement).
- **Initialiser** un dépôt proprement et sans fuite : `git init`, `.gitignore` durci, hooks secrets.

Ne pas confondre avec `monorepo-pnpm` (organisation multi-packages) ni `repo-cicd` (CI/CD
Cloud Pi Native d'un dépôt existant).

## 1. Structure de projet

### Layout de référence

```
mon-app/
├── AGENTS.md                 # règles projet + architecture
├── opencode.json             # config OpenCode du projet (provider, MCP)
└── src/
    ├── components/           # composants DSFR
    ├── pages/                # pages / routes
    ├── services/             # appels API, logique métier
    └── styles/               # styles propres au projet
```

À adapter : un backend Python n'a pas de `components/` ; un monorepo range ses paquets sous `apps/`
et `packages/` (voir `monorepo-pnpm`).

### Intégration OpenCode

Le kit se charge sans rien écrire dans le projet, de deux façons :

- **plugin** — le `opencode.json` du projet déclare
  `["<chemin-du-kit>", { "groups": ["gouv-fr/code"] }]` : instructions, skills, agents et commandes
  arrivent au démarrage ;
- **skills seuls** — copier `.agents/skills/gouv-fr/<groupe>/*` dans `~/.agents/skills/` ; les
  `instructions.md` du groupe ne sont alors **pas** chargés.

Détail des deux mécanismes : README du kit.

Détail de la version d'origine : [`references/source-gouv-fr-projet-structure.md`](references/source-gouv-fr-projet-structure.md)

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
