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

## Groupes (instructions + skills, à installer séparément)

Ce fichier est le **socle commun**. Chaque groupe de `.agents/skills/<groupe>/` apporte ses propres
instructions (`instructions.md` : invariants et routage vers ses skills) et son catalogue de skills
(`index.json`). On installe un groupe en déclarant **ses deux URL** dans `opencode.json` ; un groupe non
déclaré n'est jamais chargé.

| Groupe | Pour qui | Instructions |
|--------|----------|--------------|
| `dev` | développer une application (front, back, monorepo, poste dev) | `.agents/skills/dev/instructions.md` |
| `dso` | CI/CD fabnum-cicd, Helm, déploiement Cloud Pi Native | `.agents/skills/dso/instructions.md` |

```json
"instructions": [
  "https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/AGENTS.md",
  "https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/.agents/skills/<groupe>/instructions.md"
],
"skills": { "urls": [
  "https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/.agents/skills/<groupe>/"
] }
```

Règles pour les mainteneurs :

- Le regroupement est propre à ce repo : le standard Agent Skills ne le définit pas. OpenCode charge chaque URL comme un catalogue indépendant.
- Noms de skills **uniques entre groupes** : OpenCode les télécharge tous dans `~/.cache/opencode/skills/`.
- Une instruction propre à un groupe va dans son `instructions.md`, **jamais ici** ; un groupe ne renvoie vers un autre qu'en le nommant (« voir le groupe `dso` »), sans supposer qu'il est installé.
- Après avoir ajouté ou retiré un fichier de skill : `node scripts/skills-index.mjs` (génère), `node scripts/skills-index.mjs --check` (vérifie).

## Gotchas

- ESLint replaces Prettier
- Ruff replaces black, flake8, isort, pyupgrade
- Never modify migration files manually
- Never pin GitHub Actions to `@master` or `@main`
