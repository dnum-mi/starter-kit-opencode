# CoFabNum Agent Skills

Skills pour agents (OpenCode, Claude, Codex) basés sur la documentation de la [Fabrique Numérique](https://docs.fabrique-numerique.fr/).

## Structure

```
.agents/skills/
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

Les skills sont dans `.agents/skills/` — standard cross-client reconnu par OpenCode, Claude Code, Codex, etc.

### Depuis ce repo

```bash
# Copier tous les skills dans le dossier global
cp -r .agents/skills/* ~/.agents/skills/
```

### Depuis un autre projet

Le dossier `~/.agents/skills/` est automatiquement scanné par tous les clients compatibles.

## Installation via opencode.json

Ajouter ce dossier comme dépôt Git pour que les skills soient découverts automatiquement via `.agents/skills/`.

## Application Vue DSFR

L'application Vue 3 + DSFR est dans `apps/vue-dsfr-app/`.

### Développement

```bash
pnpm --filter vue-dsfr-app run dev
```

Accessible sur `http://localhost:5000` ou via le proxy Onyxia sur le port 5000.

### Build

```bash
pnpm --filter vue-dsfr-app run build
```

### Tests unitaires

```bash
pnpm --filter vue-dsfr-app run test:unit
```

### Lint

```bash
pnpm --filter vue-dsfr-app run lint
```

### Preview

```bash
pnpm --filter vue-dsfr-app run preview
```

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
