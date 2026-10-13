---
name: gouv-fr-monorepo-pnpm
description: "Architecture monorepo pnpm workspaces et Turborepo : structure, workspaces, turbo.json, cache, filters."
category: architecture
version: 0.2.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, monorepo, pnpm, turbo, workspace, shared, build-cache]
    related_skills: [gouv-fr-stack-technique, gouv-fr-projet-structure]
---

# Gouv-fr — Monorepo pnpm & Turborepo

Architecture monorepo avec pnpm workspaces et Turborepo pour les projets Fabrique Numérique.

## Quand utiliser
- Un projet avec client + serveur + bibliothèques partagées
- Partager du code TypeScript entre le frontend et le backend
- Centraliser le lint, les tests et le build

## Prérequis
- pnpm 10.x installé (`npm i -g pnpm` ou via proto)
- Node.js 24.x LTS (épinglé dans `.prototools`)
- git init dans le projet

## Comment lancer
- `pnpm install` — installe toutes les dépendances des workspaces
- `pnpm turbo build` — build tous les packages
- `pnpm turbo lint --filter=apps/client...` — lint uniquement les packages touchés

## Référence rapide — Structure

```
monorepo/
├── apps/                          # Applications
│   ├── client/                    # Vue 3 / Nuxt 3
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   └── server/                    # Fastify / NestJS / FastAPI
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
├── packages/                      # Packages partagés
│   ├── shared/                    # Types, utilitaires, DTOs
│   │   └── package.json
│   ├── eslint-config-fabnum/      # Config ESLint partagée
│   │   └── package.json
│   ├── tsconfig/                  # tsconfig partagé
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── pnpm-lock.yaml             # Lock unique global (à la racine)
├── pnpm-workspace.yaml            # Définition des workspaces
├── turbo.json                     # Config Turborepo
├── package.json                   # Dépendances racine (turborepo)
└── pnpm-lock.yaml                 # Lock unique global
```

## Référence rapide — pnpm workspaces

### `pnpm-workspace.yaml` (racine)

```yaml
packages:
  - "apps/**"
  - "packages/**"
```

Convention : `apps/` pour les applications, `packages/` pour le code partagé.

### Package partagé (`packages/shared/package.json`)

```json
{
  "name": "@monorepo/shared",
  "version": "0.0.0",
  "private": true,
  "types": "index.ts"
}
```

Les packages partagés doivent être **scopés** (`@scope/name`) et marqués `"private": true`.

### Référence entre workspaces (`apps/client/package.json`)

```json
{
  "dependencies": {
    "@monorepo/shared": "workspace:^"
  },
  "devDependencies": {
    "@monorepo/eslint-config-fabnum": "workspace:*"
  }
}
```

- `workspace:^` pour les dépendances de prod, `workspace:*` pour dev
- `pnpm install` à la racine installe tous les workspaces, pas par app

### Gotchas

- **Single lockfile** — `pnpm-lock.yaml` à la racine, pas par workspace
- **Scoped packages obligatoires** — format `@scope/name`
- **pnpm install à la racine** — pas de `pnpm install` par sous-package

## Référence rapide — Turborepo

### Installation

```bash
pnpm add -Dw turbo
```

### `turbo.json` (racine)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

### Scripts package.json racine

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

### Turborepo — flags utiles

- `turbo build --filter=apps/client` — build uniquement client
- `turbo build --filter=apps/server...` — build server et ses dépendances
- `turbo lint --filter=[HEAD~1]` — lint uniquement les fichiers modifiés
- `turbo build --filter=@dummy/api` — package spécifique

### Gotchas Turborepo

- **`.turbo` dans `.gitignore`** — c'est du cache local, jamais commité
- **`dependsOn: ["^build"]`** — le `^` signifie "build all internal dependencies first"
- **`cache: false` pour dev** — les dev servers ne doivent jamais être cachés
- **`persistent: true` pour dev** — indique à Turbo que la tâche tourne indéfiniment
- **Définir des `outputs` précis** — `dist/**` est le minimum, soyez spécifiques pour éviter les cache misses
- **Utiliser `--filter` en CI** — ne lancer que les packages affectés par la PR
- **Turborepo cache les résultats de build** — si les `outputs` sont mal définis, le cache sera incorrect

## Pièges
- `.turbo` et `.pnpm-store` doivent être dans `.gitignore`
- Les packages partagés doivent avoir `"private": true`
- Utiliser `workspace:^` pour les dépendances de prod, `workspace:*` pour dev
- Le lockfile est unique à la racine — pas de lock par workspace
- Turborepo cache les résultats de build — si les `outputs` sont mal définis, le cache sera incorrect

## Vérification
- `pnpm install` installe tous les workspaces sans erreur
- `pnpm turbo build` compile tous les packages dans le bon ordre
- `pnpm turbo test` lance les tests de tous les packages
- Le code partagé est accessible depuis les apps avec `@monorepo/shared`

## Références
- Monorepo template : [laruiss/template-monorepo](https://github.com/laruiss/template-monorepo)
- Helm template : [this-is-tobi/helm-charts/template](https://github.com/this-is-tobi/helm-charts/tree/main/template)
