# Groupe `fr-gouv/interieur/code` : développement et qualité de code

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["fr-gouv/interieur/code"]`) ou par URL : voir le README.

## Périmètre

Développement quotidien d'une application : structure de projet et initialisation de dépôt, conventions de
code et de revue, lint et formattage, stack technique, monorepo, API REST, méthodo et investigation de bug.

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `gouv-fr-projet-structure` | Structurer un projet (layout, CLI, OpenCode, env) et initialiser un dépôt proprement |
| `gouv-fr-code-quality` | Standards de code + grille de revue 3 niveaux ; lint ESLint/Ruff/EditorConfig |
| `gouv-fr-stack-technique` | Stack recommandée (front Vue 3/DSFR, back Fastify/NestJS/FastAPI, TS strict, Prisma) |
| `gouv-fr-monorepo-pnpm` | Monorepo pnpm workspaces + Turborepo |
| `gouv-fr-outils-developpement` | Installer/configurer les outils du poste dev (Git, Docker, pnpm, proto, VS Code, uv, zsh) |
| `gouv-fr-api-rest` | Conventions API RESTful, OpenAPI/Swagger, tests d'API |
| `gouv-fr-adr` | Rédiger une Architecture Decision Record |
| `gouv-fr-bug-investigation` | Forcer 2-3 hypothèses de cause + plan B avant tout fix de bug |
| `gouv-fr-workflow-dev` | Workflow : plan mode, tâches, leçons, bug fixing |

## Règles

- **Le français l'emporte** pour les libellés, la documentation et les messages destinés aux utilisateurs.
- TypeScript en **mode strict** ; tests obligatoires, mis à jour avec le code.
- **Ne jamais écraser** un fichier existant : fusionner (`.gitignore`, `README.md`, configs).
- Les conventions de nommage et d'architecture CoFabNum font foi pour les projets du kit — voir le skill
  `conventions-cofabnum` (groupe `dev`) et le socle `AGENTS.md`.

Ce groupe est la variante « détail Fabrique Numérique » de `dev` : ne pas charger les deux jeux pour un même
sujet.
