# CoFabNum Agent Skills

Skills pour agents (OpenCode, Claude, Codex) basés sur la documentation de la [Fabrique Numérique](https://docs.fabrique-numerique.fr/).

## Structure

```
.agents/skills/dev/
├── conventions-cofabnum/          → nommage, architecture, TypeScript, API, lint, code qualité, déploiement, POC→prod
├── recettes-serveur/              → NestJS, Fastify, FastAPI
├── recettes-client/               → Vue 3, Nuxt 3, Toaster
├── stack-technique/               → ESLint, Prisma, Prettier, REST Client
├── monorepo/                      → pnpm workspaces, Turborepo
├── ci-cd/                         → GitHub Actions, workflows réutilisables, Trivy, SonarQube
├── environnement-installation/    → Windows/WSL, macOS, Ubuntu
└── outils-dev/                    → Git, Docker, pnpm, proto, VS Code, GitHub CLI, zsh
```

## Installation

Les skills sont rangés par groupe dans `.agents/skills/<groupe>/` (groupe actuel : `dev`). Le dossier `.agents/skills/` est un emplacement reconnu par OpenCode, Claude Code, Codex, etc. ; le regroupement en sous-dossiers est propre à ce repo.

### Depuis ce repo

```bash
# Copier tous les skills dans le dossier global
cp -r .agents/skills/dev/* ~/.agents/skills/
```

### Depuis un autre projet

Le dossier `~/.agents/skills/` est automatiquement scanné par tous les clients compatibles.

## Installation via opencode.json

Déclarer l'URL du groupe voulu dans `skills.urls` (voir `AGENTS.md`).

## Groupes de skills

Chaque groupe (`.agents/skills/<groupe>/`) a son `index.json` et se charge par URL dans `opencode.json` (`skills.urls`) — voir `AGENTS.md`. Régénérer les index : `node scripts/skills-index.mjs` ; vérifier : `node scripts/skills-index.mjs --check`.

## Scripts disponibles

Chaque skill peut contenir des scripts dans `scripts/` :

| Script | Skill | Usage |
|--------|-------|-------|
| `check-environment.sh` | outils-dev | Vérifie les outils installés |
| `validate-branch.sh` | conventions | Valide le format `<type>/<kebab>#<ticket>` |
| `check-folders.sh` | conventions | Vérifie kebab-case et PascalCase |
| `scaffold-nestjs.sh` | recettes-serveur | Crée un projet NestJS complet |
| `scaffold-fastify.sh` | recettes-serveur | Crée un projet Fastify complet |
| `scaffold-fastapi.sh` | recettes-serveur | Crée un projet FastAPI complet |

## Sécurité

Les permissions sont configurées dans `opencode.json` — par défaut permissives :

- **Skills** : tous chargés automatiquement (`"*": "allow"`)
- **bash, edit, read** : valeurs par défaut OpenCode (`allow` sauf `.env`)

## Source

Ces skills sont dérivés de la documentation officielle de la [Fabrique Numérique](https://docs.fabrique-numerique.fr/) (`dnum-mi/transversal-doc`).

## Références

### Standard Agent Skills
- [Specification](https://agentskills.io/specification) — format SKILL.md, frontmatter, conventions de nommage
- [Best Practices](https://agentskills.io/skill-creation/best-practices) — scopes, contexte, calibrage
- [Using Scripts](https://agentskills.io/skill-creation/using-scripts) — scripts, agentskills.io, output structuré
- [Client Implementation](https://agentskills.io/client-implementation/adding-skills-support) — progressive disclosure, permissions

### OpenCode
- [Skills Documentation](https://opencode.ai/docs/fr/skills/) — discovery, placement, format
- [Permissions](https://opencode.ai/docs/fr/permissions/) — rules granulaires, allow/deny/ask

### Fabrique Numérique
- [docs.fabrique-numerique.fr](https://docs.fabrique-numerique.fr/) — documentation officielle
- [GitHub: dnum-mi/transversal-doc](https://github.com/dnum-mi/transversal-doc) — repo source
- [GitHub: dnum-mi/fabnum-cicd](https://github.com/dnum-mi/fabnum-cicd) — workflows CI/CD réutilisables
