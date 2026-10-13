---
name: gouv-fr-stack-technique
description: "Stack technique recommandée : Front (Vue 3, DSFR), Back (Fastify, NestJS, FastAPI), TS strict, Prisma, ESLint, monorepo. Outils de dev et versions."
category: architecture
version: 0.2.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, stack, framework, vue, nestjs, fastify, fastapi, prisma, eslint, typescript]
    related_skills: [gouv-fr-projet-structure, gouv-fr-monorepo-pnpm, gouv-fr-deployment-docker-k8s]
---

# Gouv-fr — Stack technique

La Fabrique Numérique (Mission Interministérielle) recommande une stack technique unifiée pour l'ensemble de ses
applications d'État. Cette stack garantit interopérabilité, maintenance à long terme et conformité aux standards du
numérique public.

## Quand utiliser

- Lancer un nouveau projet Fabrique Numérique
- Choisir une librairie ou un framework pour un projet existant
- Onboarding d'un développeur sur un projet

## Prérequis

- **pnpm** installé (`corepack enable pnpm` ou `npm i -g pnpm`)
- **proto** — gestionnaire de toolchain (Node, Python, Go, etc.)
- **uv** — gestionnaire Python (v0.4+)

## Comment lancer
| Stack | Commande |
|---|---|---|
| Vue 3 / DSFR | `pnpm create vue-dsfr mon-app` |
| FastAPI (Python) | `uv init mon-api` |
| NestJS (Node.js) | `pnpm create nest-app mon-api` |
| Fastify (Node.js) | `pnpm create fastify-app mon-api` |

## Référence rapide — Stack recommandée

### Front

| Catégorie | Choix |
|---|---|
| Framework | Vue 3 ou Nuxt 3 |
| DSFR | `@gouvminint/vue-dsfr` (portage Vue actif) |
| Router | VueRouter |
| State | Pinia |
| Build | Vite |
| Icônes | oh-vue-icons ou UnoCSS |
| Style | UnoCSS |
| Tests unitaires | Vitest + Vue Testing Library + Jest DOM |
| Tests e2e | Playwright |
| UI / Design | Storybook |
| Dates | date-fns — toujours UTC en interne, conversion locale à l'affichage |

### Back — Node.js

| Catégorie | Choix |
|---|---|
| Framework | Fastify (préféré) ou NestJS |
| ORM | Prisma (type-safe, migrations intégrées) |
| Validation | `@sinclair/typebox` (JSON Schema + inférence TS) |
| Logging | pino (Fastify) ou nestjs-pino (NestJS) |
| OpenAPI | `@fastify/swagger` + `@fastify/swagger-ui` (Fastify) ou `@nestjs/swagger` (NestJS) |

### Back — Python

| Catégorie | Choix |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy ou Tortoise |
| Validation | Pydantic v2 |
| Gestionnaire | uv (fichiers `pyproject.toml` + `uv.lock`) |

### TypeScript (obligatoire, strict)

- **`enum` proscrit** — utiliser les unions de littéraux à la place (génère du JS inutile)
- **`namespace` proscrit**
- **`any` proscrit** — privilégier `Record<string, unknown>` à `object`
- **`as const`** pour les littéraux immuables
- **Zod** pour la validation runtime (entrées API, variables d'environnement)
- **Interface** pour les contrats objet, **type** pour les unions et types utilitaires

### Monorepo

- **pnpm workspaces** — structure `apps/` (applications) + `packages/` (librairies partagées)
- **Turborepo** — orchestration des tâches avec cache distribué
- **Partagé** — `eslint-config`, `tsconfig`, types partagés dans `packages/`

### Outils de dev

| Outil | Usage |
|---|---|
| proto | Gestionnaire de versions (Node, Python, Go…) — remplace nvm / pyenv |
| pnpm | Gestionnaire de paquets (v10.x) |
| uv | Gestionnaire Python (v0.4+) |
| Docker | Conteneurisation |
| GitHub CLI (`gh`) | PR, issues, repos |
| VS Code | Éditeur recommandé (extension ESLint indispensable) |
| zsh + oh-my-zsh | Shell |

### Versions recommandées

| Langue / Outil | Version |
|---|---|
| Node.js | 24.x LTS (épinglé via `.prototools`) |
| pnpm | 10.x |
| TypeScript | dernier stable, mode `strict` |
| Python | 3.12+ |

## Stack détaillée

### Package Manager

**pnpm** (v10.x) est le par défaut. Voir [gouv-fr-outils-developpement] pour l'installation.

### Version Management

**proto** — multi-language version manager. Pin Node à 24.x LTS.

```shell
proto install node@24.13.1
```

Toujours spécifier `"engines"` dans `package.json` :

```json
{ "engines": { "node": "24.x" } }
```

### ESLint

#### Setup

```shell
pnpm add -D eslint @antfu/eslint-config
```

#### Vue project config

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

#### Rules à surcharger pour le français

```js
'no-irregular-whitespace': 'off',
'vue/no-irregular-whitespace': 'off',
```

#### VS Code settings

```json
{
  "editor.codeActionsOnSave": { "source.fixAll": "explicit" },
  "eslint.format.enable": true,
  "eslint.validate": ["javascript", "typescript", "vue"]
}
```

#### Scripts

```json
{ "lint": "eslint .", "format": "eslint . --fix" }
```

#### Gotchas ESLint

- **ESLint remplace Prettier** avec `@antfu/eslint-config` — ne pas installer Prettier séparément
- **Flat config par défaut** depuis ESLint v9 — pas de `.eslintrc`
- **Préfix de règles changé** — les règles stylistiques utilisent `style/` au lieu de `@stylistic/`
- **NestJS a besoin de règles supplémentaires** : `@typescript-eslint/no-unused-vars: 'warn'`, `@typescript-eslint/no-explicit-any: 'off'`

### Prisma (ORM)

#### Setup

```shell
pnpm add prisma -D
pnpm add @prisma/client
npx prisma init
```

Crée `prisma/schema.prisma` + `.env` avec `DATABASE_URL`.

#### Prisma 7+

Le générateur par défaut est `prisma-client` (l'ancien `prisma-client-js` est déprécié). Chemin `output` explicite
requis. Génère du TypeScript directement dans le projet (pas dans `node_modules`).

#### Schema conventions

- **Models** : `PascalCase` singulier (`Cat`, `User`)
- **Fields** : `camelCase` en code, `snake_case` via `@map`
- **Tables** : `snake_case` pluriel via `@@map`

```prisma
model Cat {
  id   Int   @id @default(autoincrement())
  name String
  breed String?
  createdAt DateTime @default(now()) @map("created_at")
  @@map("cats")
}
```

#### Migrations

```shell
npx prisma migrate dev --name init   # Create migration
npx prisma migrate deploy             # Apply in production
```

**Ne jamais éditer manuellement les fichiers de migration.**

#### Singleton pattern

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
```

#### Seeding

`prisma/seed.ts` + `"prisma": { "seed": "tsx prisma/seed.ts" }` dans `package.json`. Puis `npx prisma db seed`.

#### Gotchas Prisma

- **Prisma 7 `output` path** — le nouveau generator écrit dans votre projet, pas dans `node_modules`. Pointer correctement.
- **Ne pas modifier les fichiers de migration** — utiliser uniquement `prisma migrate dev`
- **Single instance** — toujours utiliser le singleton pour éviter les fuites de connexion
- **Extension VS Code** — installer l'extension Prisma pour la coloration du schema

### Dates

Pour les projets manipulants des dates :

1. Stocker/manipuler en **UTC** en interne
2. Convertir en local uniquement pour l'affichage
3. Utiliser **ISO 8601 avec millisecondes** : `2018-10-09T08:19:16.999+02:00`
4. Utiliser [date-fns](https://date-fns.org/) pour la conversion timezone
5. Valider côté client ET serveur

### REST Client

Extension VS Code : [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client).

Créer des fichiers `.rest` pour le test d'API. Voir [gouv-fr-conventions-nommage] pour le format.

## Pièges
- Ne pas utiliser `enum` TypeScript — il génère du JavaScript inutile. Privilégier les unions de littéraux.
- Toujours épingle les versions dans `.prototools`, `package.json` et `pyproject.toml` / `uv.lock`.
- Utiliser `pnpm` et **jamais** `npm` (cohérence Fabrique Numérique).
- Les dates : toujours stockées et comparées en UTC, conversion locale uniquement à l'affichage.
- **Prisma 7+** : le générateur par défaut est `prisma-client` (l'ancien `prisma-client-js` est déprécié) ; le chemin `output` dans `schema.prisma` doit être explicite.
- **ESLint remplace Prettier** — ne pas installer les deux avec `@antfu/eslint-config`
- **Flat config** depuis ESLint v9 — pas de `.eslintrc`

## Vérification
1. **Projet Vue** : `pnpm create vue-dsfr` crée un projet fonctionnel avec Vue 3 + VueDsfr
2. **TypeScript** : `npx tsc --noEmit` ne renvoie aucune erreur en mode strict
3. **Prisma** : `npx prisma validate` passe sans erreur
