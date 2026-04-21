---
name: monorepo
description: Use when setting up a JavaScript/TypeScript monorepo for Fabrique Numérique — pnpm workspaces, Turborepo caching, or the standard monorepo template
allowed-tools: Bash Read
---

# CoFabNum Monorepo Guide

pnpm workspaces + Turborepo.

## pnpm Workspaces

### Setup

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/**"
  - "apps/**"
```

Convention: `apps/` for applications, `packages/` for shared code.

### Structure

```
apps/
├── client/package.json        # "name": "@dummy/client"
└── server/package.json        # "name": "@dummy/server"
packages/
├── shared/package.json        # "name": "@dummy/shared"
├── tsconfig/package.json      # "name": "@dummy/tsconfig"
├── eslint-config/package.json
├── pnpm-lock.yaml             # Single lockfile at root
└── pnpm-workspace.yaml
```

### Workspace dependencies

```json
{
  "dependencies": { "@dummy/shared": "workspace:^" },
  "devDependencies": { "@dummy/tsconfig": "workspace:^" }
}
```

### Gotchas

- **Shared packages must be scoped** — `@scope/name` format is mandatory
- **Single lockfile** — `pnpm-lock.yaml` at root, not per-package
- **`workspace:^` prefix** — required to link local packages, not a version number
- **`pnpm install` at root** — installs all workspace packages, not per-app

## Turborepo

[Intelligent build system](https://turbo.build/repo) for monorepos.

### Setup

```shell
pnpm add -Dw turbo
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["build"] }
  }
}
```

### Commands

```shell
pnpm turbo build              # Build all packages
pnpm turbo dev                # Dev on all packages
pnpm turbo lint --filter=...[HEAD^1]  # Only changed packages
pnpm turbo build --filter=@dummy/api     # Specific package
```

### Root package.json

```json
{
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test"
  }
}
```

### Gotchas

- **`.turbo` in `.gitignore`** — this is local cache, never commit it
- **`dependsOn: ["^build"]`** — the `^` means "build all internal dependencies first"
- **`cache: false` for dev** — dev servers should never be cached
- **`persistent: true` for dev** — tells Turbo the task runs indefinitely
- **Define precise `outputs`** — `dist/**` is the minimum, be specific to avoid cache misses
- **Use `--filter` in CI** — only run affected packages per PR

## References

- Monorepo template: [laruiss/template-monorepo](https://github.com/laruiss/template-monorepo)
- Helm template: [this-is-tobi/helm-charts/template](https://github.com/this-is-tobi/helm-charts/tree/main/template)
