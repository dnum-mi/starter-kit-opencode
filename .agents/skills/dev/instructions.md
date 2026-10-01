# Groupe `dev` : développer une application

> Chargé en plus du socle `AGENTS.md`. Installer avec l'URL de skills `.agents/skills/dev/`.

## Skills

Skills dans `.agents/skills/dev/` :

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

## Implementing a Plan

Before and while implementing a plan (migration, feature, refactor) that touches external libraries:

> With the starter-kit plugin, `/livrer <plan>` automates this: subagent `dev-verif-plan` checks steps 1–2, subagent `dev-review` is the gate for step 3.

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

## Gotchas

- Vue components need 2+ words (`BadgeTypeOrganisme.vue`, not `Badge.vue`)
- Folders = kebab-case, Vue files = PascalCase
