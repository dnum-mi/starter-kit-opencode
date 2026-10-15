---
name: stack-technique
description: Use when configuring recommended tools and libraries for Fabrique Numérique projects — ESLint antfu config, Prisma ORM, REST Client, date-fns, pnpm, proto, or any tool from the official CoFabNum stack
allowed-tools: Bash Read
---

# CoFabNum Recommended Stack

Official recommended tools for Fabrique Numérique projects.

## Package Manager

**pnpm** (v10.x) is the default. See [environnement-installation] for installation.

## Version Management

**proto** — multi-language version manager. Pin Node to 24.x LTS.

```shell
proto install node@24.13.1
```

Always also specify `"engines"` in `package.json`:

```json
{ "engines": { "node": "24.x" } }
```

## ESLint

### Setup

```shell
pnpm add -D eslint @antfu/eslint-config
```

### Vue project config

```js
import antfu from '@antfu/eslint-config'
export default antfu({}, [{
  rules: {
    'style/operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
    'style/space-before-function-paren': ['error', 'always'],
    'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
    'curly': ['error', 'all'],
    'import/order': [1, { newlines-between: 'always' }],
    'style/comma-dangle': ['error', 'always-multiline'],
  },
}])
```

### Rules to override for French text

```js
'no-irregular-whitespace': 'off',
'vue/no-irregular-whitespace': 'off',
```

### VS Code settings

```json
{
  "editor.codeActionsOnSave": { "source.fixAll": "explicit" },
  "eslint.format.enable": true,
  "eslint.validate": ["javascript", "typescript", "vue"]
}
```

### Scripts

```json
{ "lint": "eslint .", "format": "eslint . --fix" }
```

### Gotchas

- **ESLint replaces Prettier** with `@antfu/eslint-config` — don't install Prettier separately
- **Flat config is default** since ESLint v9 — no `.eslintrc` files
- **Rule prefix changed** — stylistic rules now use `style/` instead of `@stylistic/`
- **NestJS needs extra rules**: `@typescript-eslint/no-unused-vars: 'warn'`, `@typescript-eslint/no-explicit-any: 'off'`

## Prisma (ORM)

### Setup

```shell
pnpm add prisma -D
pnpm add @prisma/client
npx prisma init
```

Creates `prisma/schema.prisma` + `.env` with `DATABASE_URL`.

### Prisma 7+

Default generator is `prisma-client` (not deprecated `prisma-client-js`). Requires explicit `output` path. Generates TypeScript directly in project (not `node_modules`).

### Schema conventions

- **Models**: `PascalCase` singular (`Cat`, `User`)
- **Fields**: `camelCase` in code, `snake_case` via `@map`
- **Tables**: `snake_case` plural via `@@map`

```prisma
model Cat {
  id   Int   @id @default(autoincrement())
  name String
  breed String?
  createdAt DateTime @default(now()) @map("created_at")
  @@map("cats")
}
```

### Migrations

```shell
npx prisma migrate dev --name init   # Create migration
npx prisma migrate deploy             # Apply in production
```

**Never manually edit migration files.**

### Singleton pattern

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
```

### Seeding

`prisma/seed.ts` + `"prisma": { "seed": "tsx prisma/seed.ts" }` in `package.json`. Then `npx prisma db seed`.

### Gotchas

- **Prisma 7 `output` path** — the new generator writes to your project, not `node_modules`. Point it correctly.
- **Never modify migration files** — use `prisma migrate dev` only
- **Single instance** — always use the singleton pattern to avoid connection leaks
- **VS Code extension** — install the Prisma extension for schema highlighting

## Dates

For projects handling dates:

1. Store/manipulate in **UTC** internally
2. Convert to local only for display
3. Use **ISO 8601 with milliseconds**: `2018-10-09T08:19:16.999+02:00`
4. Use [date-fns](https://date-fns.org/) timezone conversion
5. Validate client AND server side

## REST Client

VS Code extension: [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client).

Create `.rest` files for API testing. See [conventions-cofabnum] for format.

## Tool Summary

| Category | Tool |
|----------|------|
| Package manager | pnpm 10.x |
| Version manager | proto |
| Lint JS/TS | ESLint + @antfu/eslint-config |
| Lint Python | ruff |
| ORM | Prisma |
| DB | PostgreSQL |
| Python manager | uv |
| Frameworks | Fastify, NestJS, FastAPI, Vue 3, Nuxt 3 |
| Testing | Vitest, Playwright |
| Date library | date-fns |
