# Agents Guide - CoFabNum

> Conventions and operational config shared across all Fabrique Numérique projects.

## Git Setup (run before first commit)

```bash
git config --global init.defaultBranch main
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
```

## Versions (pin in `.prototools`)

```
node 24.13.1
pnpm 10.0.0
```

## Branch Naming

```
<type>/<kebab-desc>#<ticket>
```

Types: `feat`, `fix`, `hotfix`, `tech`, `docs`, `refactor`
Examples: `feat/worker-logs#353`, `refactor/reorganize-backend#360`

## Commit Messages

Conventional Commits format. French is acceptable.

## Code Quality

- Lines ≤ 120 (≤ 140 forbidden)
- Functions ≤ 20 lines, one purpose
- No silent error swallowing
- Named constants, no magic numbers
- Early return over deep nesting

## TypeScript

- strict mode, no `enum`/`namespace`
- No `any` (extremely rare)
- Unions instead of enums
- Zod for runtime validation
- `interface` for objects/contracts, `type` for unions

## Python

- Ruff: `line-length = 88`, `target-version = "py312"`

## Linting

| Language | Tool | Config |
|----------|------|--------|
| JS/TS | ESLint + @antfu/eslint-config | flat config, no Prettier |
| Python | ruff | ruff check + ruff format |

## REST API

- Nouns only, always plural, no verbs in paths
- HTTP method is the verb
- stdout-only structured JSON logs
- Error messages in French or i18n keys

## Docker

- Lightweight base (`*-alpine`, `*-slim`)
- Non-root user (UID ≥ 1000)
- Multi-stage builds
- No `latest` tags in production
- Scan with Trivy in CI

## Deployment

- Helm charts mandatory (no raw YAML manifests)
- K8s/OpenShift, rootless

## Project AGENTS.md

Each subproject has its own `AGENTS.md` with project-specific config. This file takes precedence for cross-project conventions.

## Skills disponibles

### Socle

Les skills suivants (groupe `dev`) sont dans `.agents/skills/dev/` :

| Skill | Quand l'utiliser |
|-------|-----------------|
| `conventions-cofabnum` | Créer ou relire un projet — nommage, archi, TS, REST, linting |
| `recettes-client` | Frontend Vue 3 / Nuxt 3 — DSFR, VueDsfr, composables, tests |
| `recettes-serveur` | Backend NestJS / Fastify / FastAPI — scaffolding, logging, OpenAPI |
| `stack-technique` | Configurer les outils recommandés — ESLint antfu, Prisma, date-fns… |
| `monorepo` | Monorepo pnpm workspaces + Turborepo |
| `ci-cd` | Principes CI/CD et gabarit CI de base — pour fabnum-cicd, releases et Cloud Pi Native voir `cicd-fabnum` (groupe `dso`) |
| `deploiement` | Dockerfiles de production, durcissement des conteneurs (rootless, lecture seule, tags), dev local K8s — pour Helm et Cloud Pi Native voir le groupe `dso` |
| `environnement-installation` | Setup poste dev — Windows/WSL, macOS, Ubuntu |
| `outils-dev` | Git, Docker Compose, VS Code, GitHub CLI, pnpm, proto, zsh, uv |
### Groupes de skills

Les skills sont rangés par groupe dans `.agents/skills/<groupe>/` (aujourd'hui `dev`), chaque groupe ayant son propre `index.json`.
Les groupes ne sont pas faits pour être installés ensemble : un groupe n'est chargé que si son URL est déclarée dans `opencode.json` :

```json
"skills": { "urls": [
  "https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/.agents/skills/dev/",
  "https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/.agents/skills/<groupe>/"
] }
```

- Ce regroupement est propre à ce repo : le standard Agent Skills ne le définit pas. OpenCode charge chaque URL comme un catalogue indépendant.
- Noms de skills **uniques entre groupes** : OpenCode les télécharge tous dans `~/.cache/opencode/skills/`.
- Après avoir ajouté ou retiré un fichier de skill : `node scripts/skills-index.mjs` (génère), `node scripts/skills-index.mjs --check` (vérifie).
- Ajouter une sous-section par groupe dans ce fichier (tableau « Skill / Quand l'utiliser »).

### Groupe `dso` (CI/CD, Helm, Cloud Pi Native)

URL : `https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/.agents/skills/dso/`. Doc de fond : `docs/okf/quickstart.md`.

| Skill | Quand l'utiliser |
|-------|-----------------|
| `cicd-fabnum` | Écrire ou relire un `ci.yml`/`cd.yml` avec les workflows fabnum-cicd, releases, sync vers Cloud Pi Native |
| `helm-chart-cpin` | Créer ou adapter un chart Helm pour Cloud Pi Native (template tobi, UID OpenShift, labels MIOM, Vault, vérification Kyverno) |
| `deploiement-cpin` | Embarquer et déployer une application sur Cloud Pi Native (console, mirror, pipeline DSO, ArgoCD, secrets) et diagnostiquer un déploiement qui ne bouge pas |

## Documentation interne (OKF)

`docs/okf/` regroupe la connaissance CI/CD (fabnum-cicd), Helm et Cloud Pi Native au format OKF.
Point d'entrée : `docs/okf/quickstart.md` (routage par intention). Les sources amont font autorité ; la doc n'est pas un skill.

## Implementing a Plan

Before and while implementing a plan (migration, feature, refactor) that touches external libraries:

### 1. Verify dependencies actually exist

- [ ] Check the plan's packages match what's installed (`package.json`, lockfile) — a plan can reference a package that doesn't exist on npm or isn't the one used by the project
- [ ] Check installed versions match what the plan assumes (`pnpm list <pkg>`)
- [ ] If a package isn't installed yet, confirm it exists on npm before adding it (`npm view <pkg>`)

> Example: a plan referenced `@gouvfr/dsfr-vue` (`FrInput`, `FrButton`) — that package doesn't exist on npm. The project actually uses `@gouvminint/vue-dsfr` (`DsfrInput`, `DsfrButton`).

### 2. Read the real type definitions before coding

- [ ] Locate the `.d.ts` files for the library (`node_modules/<pkg>/**/*.d.ts`)
- [ ] Read the actual component/function signature before writing code that uses it
- [ ] Adapt the plan's code if the real API differs — don't copy-paste it as-is

> Example: a plan used `<FrInput :native-validators="{ required: { errorMessage: '...', enable: true } }" />`, but `DsfrInputProps` (`node_modules/@gouvminint/vue-dsfr/types/components/DsfrInput/DsfrInput.types.d.ts`) has `isInvalid?: boolean` and no `native-validators`. See [recettes-client] for the real DsfrInput API.

### 3. Build before committing

- [ ] Run the project build / typecheck (`pnpm build`, `vue-tsc --noEmit`, `tsc --noEmit`) at the end of each task
- [ ] Fix all type errors before committing
- [ ] Never commit a state that breaks the build, even "temporarily"

### 4. Test existing behavior before changing it

- [ ] Run the app (`pnpm dev`) and check the current behavior of the feature being modified
- [ ] Identify pre-existing bugs (e.g. a non-reactive toast, a frozen counter) — don't confuse them with regressions introduced by the plan
- [ ] Either fix pre-existing bugs as part of the task, or note them explicitly as out of scope in the plan/PR

## Choix technologiques

Quand plusieurs options de la stack cofabnum sont possibles (ex. NestJS vs Fastify, FastAPI vs Fastify), présenter les options à l'utilisateur avec les arguments pour chacune avant de recommander — ne pas choisir silencieusement.

## Gotchas

- Pour toute question backend/serveur/API, utiliser le skill `recettes-serveur` avant de répondre — Express n'est pas dans la stack cofabnum
- Vue components need 2+ words (`BadgeTypeOrganisme.vue`, not `Badge.vue`)
- Folders = kebab-case, Vue files = PascalCase
- ESLint replaces Prettier
- Ruff replaces black, flake8, isort, pyupgrade
- Never modify migration files manually
- Never pin GitHub Actions to `@master` or `@main`
