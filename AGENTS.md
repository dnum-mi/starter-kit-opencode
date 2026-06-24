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

Les skills suivants sont chargés automatiquement depuis `.agents/skills/` :

| Skill | Quand l'utiliser |
|-------|-----------------|
| `conventions-cofabnum` | Créer ou relire un projet — nommage, archi, TS, REST, linting |
| `recettes-client` | Frontend Vue 3 / Nuxt 3 — DSFR, VueDsfr, composables, tests |
| `recettes-serveur` | Backend NestJS / Fastify / FastAPI — scaffolding, logging, OpenAPI |
| `stack-technique` | Configurer les outils recommandés — ESLint antfu, Prisma, date-fns… |
| `monorepo` | Monorepo pnpm workspaces + Turborepo |
| `ci-cd` | GitHub Actions, workflows fabnum-cicd, Docker, Helm, release |
| `deploiement` | Cloud Pi Native, Kubernetes/OpenShift, Dockerfiles, Helm charts |
| `environnement-installation` | Setup poste dev — Windows/WSL, macOS, Ubuntu |
| `outils-dev` | Git, Docker Compose, VS Code, GitHub CLI, pnpm, proto, zsh, uv |
## Gotchas

- Vue components need 2+ words (`BadgeTypeOrganisme.vue`, not `Badge.vue`)
- Folders = kebab-case, Vue files = PascalCase
- ESLint replaces Prettier
- Ruff replaces black, flake8, isort, pyupgrade
- Never modify migration files manually
- Never pin GitHub Actions to `@master` or `@main`
