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

Le plus simple : le plugin du starter-kit, avec les groupes voulus. Il charge le socle `AGENTS.md` et, pour
chaque groupe, ses instructions, ses skills, ses agents et ses commandes :

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    ["starter-kit-opencode@git+https://github.com/dnum-mi/starter-kit-opencode.git", { "groups": ["dso"] }]
  ]
}
```

`"groups": ["dev", "dso"]` pour les deux. Une valeur déclarée dans votre `opencode.json` (ex.
`"agent": { "cpin-review": { "model": "…" } }`) l'emporte sur celle du plugin.

Sans plugin, déclarer à la main les URL du socle, des `instructions.md` et des skills de chaque groupe (voir
`AGENTS.md`) ; les agents et commandes ne sont alors pas installés.

### Groupe `dev` : implémenter un plan

Lancer `/livrer <plan ou chemin du fichier de plan>` (agent `build`). Le sous-agent `dev-verif-plan` vérifie
d'abord que les paquets et les API du plan existent vraiment dans le projet (`package.json`, `npm view`,
`.d.ts`) et corrige le plan. `build` implémente, puis `dev-review`, dans une session neuve, lance typecheck,
lint, tests et build du projet : il rend `PORTE: OK|KO`. En cas de KO, `build` corrige à la source et relance
la review (3 essais au plus). Rien n'est commité.

### Groupe `dso` : déployer sur Cloud Pi Native

Lancer `/deployer-cpin` (ou passer sur l'agent `cpin-orchestrateur` avec Tab). L'orchestrateur suit le runbook
`deploiement-cpin` : il pose les questions des portes humaines (phases 0 à 2), puis fait tourner
`cpin-plan` → `cpin-build` → `cpin-review` jusqu'à ce que `check-cpin-rules.py` passe (3 essais au plus),
et vous laisse commiter.

## Groupes de skills

Chaque groupe (`.agents/skills/<groupe>/`) a son `index.json` et et son `instructions.md` (invariants, routage), chargés par URL dans `opencode.json` — voir `AGENTS.md`. Régénérer les index : `node scripts/skills-index.mjs` ; vérifier : `node scripts/skills-index.mjs --check`.

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
