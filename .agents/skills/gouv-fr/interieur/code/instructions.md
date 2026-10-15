# Groupe `gouv-fr/interieur/code` : développement, qualité et outils

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["gouv-fr/interieur/code"]`) ou par URL : voir le README.

## Périmètre

Développement quotidien d'une application : installation du poste, structure de projet, conventions de code
et de revue, stack technique, monorepo, API REST, recettes front et back, CI de base, méthodo et
investigation de bug.

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `projet-structure` | Structurer un projet (layout, CLI, OpenCode, env) et initialiser un dépôt proprement |
| `conventions-cofabnum` | Conventions de nommage, architecture de dossiers, règles TypeScript et API RESTful |
| `code-quality` | Standards de code + grille de revue 3 niveaux ; lint ESLint/Ruff/EditorConfig |
| `stack-technique` | Stack recommandée (front Vue 3/DSFR, back Fastify/NestJS/FastAPI, TS strict, Prisma) |
| `monorepo-pnpm` | Monorepo pnpm workspaces + Turborepo |
| `outils-developpement` | Installer/configurer les outils du poste dev (Git, Docker, pnpm, proto, VS Code, uv, zsh) |
| `environnement-installation` | Installer le poste dev de zéro (Windows/WSL, macOS, Ubuntu) |
| `recettes-client` | Toute question front, client, Vue 3, Nuxt 3 ou DSFR (VueDsfr, composables, tests) |
| `recettes-serveur` | Toute question back, API ou serveur (NestJS, Fastify, FastAPI, routes, logs, erreurs) |
| `api-rest` | Conventions API RESTful, OpenAPI/Swagger, tests d'API |
| `deploiement` | Dockerfiles de prod durcis (multi-stage, rootless, lecture seule), `securityContext` Kubernetes, développement local |
| `ci-cd` | Poser un pipeline de base (lint, tests, build) et choisir entre pipeline sur mesure et workflows réutilisables |
| `adr` | Rédiger une Architecture Decision Record |
| `bug-investigation` | Forcer 2-3 hypothèses de cause + plan B avant tout fix de bug |
| `workflow-dev` | Workflow : plan mode, tâches, leçons, bug fixing |

## Règles

- **Le français l'emporte** pour les libellés, la documentation et les messages destinés aux utilisateurs.
- TypeScript en **mode strict** ; tests obligatoires, mis à jour avec le code.
- **Ne jamais écraser** un fichier existant : fusionner (`.gitignore`, `README.md`, configs).
- Les conventions de nommage et d'architecture CoFabNum font foi pour les projets du kit (skill
  `conventions-cofabnum`), en complément du socle `AGENTS.md`.
- La livraison sur **Cloud Pi Native** (console, chart Helm, `sync-cpin`) est hors de ce groupe : voir
  `gouv-fr/interieur/dso`.
