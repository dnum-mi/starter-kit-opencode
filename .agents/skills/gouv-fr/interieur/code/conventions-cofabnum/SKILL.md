---
name: conventions-cofabnum
description: Use when creating or reviewing Fabrique Numérique projects — naming conventions, folder architecture, TypeScript rules, RESTful API patterns, linting, code quality, deployment, POC-to-production, or project documentation
allowed-tools: Bash Read
---

# CoFabNum Conventions

Best practices for all Fabrique Numérique projects. Language-agnostic unless noted.

## Quick Reference

| Topic | Key Rule |
|-------|----------|
| Branches | `<type>/<kebab-desc>#<ticket>` |
| Commits | Conventional Commits (French OK) |
| Files/folders | `kebab-case` (Vue files: PascalCase) |
| TypeScript | strict mode, no `enum`/`namespace` |
| API routes | nouns only, plural, no verbs |
| Functions | max 20 lines, one purpose |
| Lint JS/TS | `@antfu/eslint-config` |
| Lint Python | `ruff` |
| Docker | multi-stage, non-root, pinned tags |
| Deploy | Helm charts on K8s/OpenShift |

## Available Scripts

- **`scripts/validate-branch.sh`** — Validates branch name format
  - Usage: `bash scripts/validate-branch.sh` (current branch)
  - Usage: `bash scripts/validate-branch.sh feat/my-feature#123`
  - Returns exit code 0 if valid, 1 if invalid
- **`scripts/check-folders.sh`** — Checks folder/file naming conventions
  - Usage: `bash scripts/check-folders.sh` (current directory)
  - Usage: `bash scripts/check-folders.sh src/`
  - Reports kebab-case violations and Vue PascalCase issues

Progress:
- [ ] `README.md` — prerequisites, quick start, scripts table
- [ ] `CONTRIBUTING.md` — if external contributors
- [ ] User docs — step-by-step guide, features, FAQ, contact

### README.md template

```markdown
# Project Name

> Short description

## Prerequisites

- Node.js 24.x (via proto)
- pnpm 10.x
- Docker

## Quick Start

pnpm install
pnpm dev

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Dev server |
| `pnpm build` | Build |
| `pnpm test` | Tests |
| `pnpm lint` | Lint |

## Architecture

See folder architecture conventions.
```

## Naming

### Git branches

```
<type>/<kebab-description>#<ticket>
```

Types: `feat`, `fix`, `hotfix`, `tech`, `docs`, `refactor`

Examples: `feat/worker-logs#353`, `refactor/reorganize-backend#360`

### Commit messages

Conventional Commits format. French is acceptable.

### Files and folders

**All files/folders**: `kebab-case`.
**Vue component files**: `PascalCase`, at least 2 words (except `App.vue`).

### Variables

- Boolean: `isXxx` or `hasXxx` in `camelCase`
- Date: `xxxDate` or `xxxAt` in `camelCase`
- Class: `PascalCase`
- Function/variable: `camelCase`
- Constant: `SCREAMING_SNAKE_CASE`

Names must be explicit. Avoid single-character names. Prefer English; French allowed when translation is confusing (`demarche`, `affaire`).

## Folder Architecture

### Vue.js (default)

```
src/
├── App.vue
├── components/          # Reusable across views
├── stores/              # Pinia stores
├── views/               # Page components (one folder each)
│   └── AppHome/
│       ├── AppHome.vue
│       ├── AppHome.cy.ts
│       ├── AppHome.spec.ts
│       └── components/  # View-specific
└── utils/
```

### Fastify

```
src/
├── index.ts             # Entry
├── app.ts               # Config
├── plugins/             # CORS, Swagger, Auth
├── routes/
│   └── cats/
│       ├── index.ts
│       ├── cats.schema.ts
│       └── cats.service.ts
└── utils/
test/routes/
```

### FastAPI

```
app/
├── main.py              # Entry
├── config.py            # Env vars
├── models/              # SQLAlchemy
├── schemas/             # Pydantic
├── routers/             # APIRouter
├── services/            # Business logic
└── utils/
tests/
```

### NestJS

```
src/modules/cats/
├── controllers/
├── providers/
├── entity/
└── cats.module.ts
```

## TypeScript

Progress:
- [ ] Enable strict mode
- [ ] No `enum`, no `namespace`
- [ ] No `any` (extremely rare)
- [ ] No `object` type
- [ ] Runtime validation with Zod

### Use unions instead of enums

```typescript
// ✅
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
```

### interface vs type

- `interface` — objects, API contracts, component props
- `type` — unions, intersections, utility types

### as const for literals

```typescript
const ROLES = ['admin', 'editor'] as const
type Role = typeof ROLES[number]
```

### Discriminated unions

```typescript
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }
```

### Runtime validation

See [stack-technique] for Zod examples.

## RESTful API

### Route naming

Nouns only, always plural, no verbs. HTTP method is the verb.

```
POST /cats           → create
GET /cats            → list
GET /cats/:id        → get
PUT /cats/:id        → update all
PATCH /cats/:id      → update partial
DELETE /cats/:id     → delete
```

### HTTP status codes — quick reference

| Code | When |
|------|------|
| `200` | Success (GET, PUT, PATCH, DELETE) |
| `201` | Created (POST only) |
| `400` | Bad request |
| `401` | Unauthorized — include `WWW-Authenticate: Bearer` |
| `403` | Forbidden (known identity, not authorized) |
| `404` | Not found |
| `409` | Conflict (resource exists) |
| `429` | Rate limited |
| `500` | Internal error |

### Logging

- stdout only (container collection, ELK)
- Log response time per request
- Log important actions (login, creation)
- Handle errors in one place
- Error messages: French or client-side dictionary keys

Levels: `verbose` (dev only), `debug` (dev only), `log` (always), `warn`, `error`.

### .rest files

Use VS Code REST Client for API testing. See [stack-technique] for format.

## Lint and Formatting

### EditorConfig (all projects)

`.editorconfig` at root:

```ini
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

### JS/TS: ESLint with antfu config

```shell
pnpm add -D eslint @antfu/eslint-config
```

`eslint.config.js`:

```js
import antfu from '@antfu/eslint-config'
export default antfu({
  rules: {
    'style/comma-dangle': ['error', 'always-multiline'],
    'no-irregular-whitespace': 'off',
  },
})
```

NestJS extras: `@typescript-eslint/no-unused-vars: 'warn'`, `@typescript-eslint/no-explicit-any: 'off'`.

Scripts: `"lint": "eslint ."` / `"format": "eslint . --fix"`.

### Python: Ruff

```shell
uv add --dev ruff
```

`ruff.toml`: `line-length = 88`, `target-version = "py312"`, select `["E", "W", "F", "I", "N", "UP", "B", "C4", "SIM"]`.

## Code Quality

Progress:
- [ ] Lines ≤ 120 (≤ 140 forbidden)
- [ ] Functions ≤ 20 lines
- [ ] One function = one purpose
- [ ] No silent error swallowing
- [ ] async/await over .then()
- [ ] Named constants, no magic numbers
- [ ] Early return over deep nesting
- [ ] Dependency evaluation checklist

### Never silently ignore errors

```typescript
try { await fetch() } catch (error) {
  logger.error(error, 'Failed to fetch')
  throw error
}
```

### Use typed errors

```typescript
class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`)
    this.name = 'NotFoundError'
  }
}
```

### Dependency evaluation checklist

Before adding any dependency:

- [ ] Latest stable major version (never `@latest`/`@master` in prod)
- [ ] Popular (downloads, stars)
- [ ] Actively maintained (commits in last 12 months)
- [ ] Security.md present
- [ ] Bundle size acceptable ([bundlephobia.com](https://bundlephobia.com))

**Security rule**: Never pin GitHub Actions to `@master` or `@main`. Always use version tags.

 ## POC → Production

Progress:
- [ ] Modular architecture, API decoupled from AI logic
- [ ] Pydantic validation (FastAPI) or Prisma (NestJS/Fastify)
- [ ] Async for I/O, queue for CPU-intensive
- [ ] CORS restricted, JWT/OAuth2 auth
- [ ] Docker: lightweight, multi-stage, non-root, healthchecks
- [ ] Unit + integration tests from day 1
- [ ] Structured JSON logs, request_id correlation
- [ ] Health endpoints: `/health`, `/readiness`
- [ ] OpenAPI/Swagger docs auto-generated
- [ ] Rollback plan documented
- [ ] DB migrations configured

## Gotchas

- **Vue components need 2+ words** — `BadgeTypeOrganisme.vue` not `Badge.vue` (except `App.vue`)
- **Folders are kebab-case but Vue files are PascalCase** — don't mix them
- **`enum` and `namespace` are banned** — they emit JS runtime code, breaking the "remove types = valid JS" philosophy
- **ESLint replaces Prettier** — with `@antfu/eslint-config`, don't install Prettier separately
- **Ruff replaces 4 tools** — black, flake8, isort, pyupgrade are all replaced by `ruff check` + `ruff format`
- **Never modify migration files manually** — always use `prisma migrate dev`
- **Branch naming must include ticket number** — `feat/description` is incomplete, use `feat/description#123`
- **Log messages in French for French projects** — but keep structured fields (keys) in English
- **Cloud Pi Native is the default target** — design for K8s/OpenShift rootless from day one
