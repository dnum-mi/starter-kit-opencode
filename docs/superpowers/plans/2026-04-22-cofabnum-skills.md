# CoFabNum Agent Skills — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer 8 skills agents (OpenCode, Claude, Codex) à partir de la documentation Fabrique Numérique, avec 6 scripts d'accompagnement.

**Architecture:** Extraction et synthèse des docs transversal-doc (4900+ lignes) en 8 skills indépendants, chacun ≤ 500 lignes. Chaque skill contient un SKILL.md avec frontmatter standard et éventuellement des scripts dans `scripts/`.

**Tech Stack:** Markdown (SKILL.md), Bash (scripts), agentskills.io spec (frontmatter name/description/allowed-tools)

---

### Task 0: Initialiser la structure des skills

**Files:**
- Create: `.agents/skills/` (dossier racine)
- Create: `.agents/skills/conventions-cofabnum/` (dossier + scripts/)
- Create: `.agents/skills/recettes-serveur/` (dossier + scripts/)
- Create: `.agents/skills/recettes-client/` (dossier)
- Create: `.agents/skills/stack-technique/` (dossier)
- Create: `.agents/skills/monorepo/` (dossier)
- Create: `.agents/skills/ci-cd/` (dossier)
- Create: `.agents/skills/environnement-installation/` (dossier)
- Create: `.agents/skills/outils-dev/` (dossier + scripts/)

- [ ] **Step 1: Créer l'arborescence**

```bash
mkdir -p .agents/skills/{conventions-cofabnum/scripts,recettes-serveur/scripts,recettes-client,stack-technique,monorepo,ci-cd,environnement-installation,outils-dev/scripts}
```

- [ ] **Step 2: Vérifier la structure**

```bash
find .agents/skills -type d | sort
```

Expected output :
```
.agents/skills
.agents/skills/ci-cd
.agents/skills/conventions-cofabnum
.agents/skills/conventions-cofabnum/scripts
.agents/skills/environnement-installation
.agents/skills/monorepo
.agents/skills/outils-dev
.agents/skills/outils-dev/scripts
.agents/skills/recettes-client
.agents/skills/recettes-serveur
.agents/skills/recettes-serveur/scripts
.agents/skills/stack-technique
```

---

### Task 1: Créer le skill conventions-cofabnum

**Files:**
- Create: `.agents/skills/conventions-cofabnum/SKILL.md`
- Create: `.agents/skills/conventions-cofabnum/scripts/validate-branch.sh`
- Create: `.agents/skills/conventions-cofabnum/scripts/check-folders.sh`

**Context:** Ce skill contient les conventions générales : nommage branches/commits/fichiers, architecture dossier (Vue.js, Fastify, FastAPI, NestJS), TypeScript, REST API, lint, code quality, Docker, déploiement, POC→prod.

- [ ] **Step 1: Créer SKILL.md (393 lignes)**

Le fichier contient :
- Frontmatter : `name: conventions-cofabnum`, `description: Use when creating or reviewing Fabrique Numérique projects`, `allowed-tools: Bash Read`
- Quick reference table (10 lignes)
- Available scripts section avec validate-branch.sh et check-folders.sh
- README.md template (sections prerequisites, quick start, scripts, architecture)
- Naming (branches, commits, fichiers, variables)
- Folder Architecture (Vue.js, Fastify, FastAPI, NestJS — arbres complets)
- TypeScript (unions vs enums, interface vs type, as const, discriminated unions)
- RESTful API (routes, status codes, logging, .rest files)
- Lint (EditorConfig, ESLint antfu, Ruff)
- Code Quality (error handling, typed errors, dependency checklist)
- Deployment (Docker rules, K8s/Helm)
- POC → Production (checklist complète)
- Gotchas (8 rules critiques)

- [ ] **Step 2: Créer validate-branch.sh (76 lignes)**

Script bash qui :
- Prend un nom de branche en argument (ou utilise `git rev-parse --abbrev-ref HEAD`)
- Valide le format `<type>/<kebab-case>#<ticket>`
- Types valides : `feat fix hotfix tech docs refactor`
- Regex pour kebab-case et ticket numérique
- Retourne exit 0 (PASS) ou exit 1 (FAIL) avec message explicite

- [ ] **Step 3: Créer check-folders.sh (110 lignes)**

Script bash qui :
- Parcourt les dossiers/fichiers (argument = dossier cible ou cwd)
- Check kebab-case (skip hidden files, node_modules, dist, .git, *.vue)
- Check Vue PascalCase + 2+ words (skip App.vue)
- Affichage coloré (RED/YELLOW/GREEN)
- Retourne exit code = nombre d'erreurs

- [ ] **Step 4: Rendre les scripts exécutables**

```bash
chmod +x .agents/skills/conventions-cofabnum/scripts/*.sh
```

---

### Task 2: Créer le skill recettes-serveur

**Files:**
- Create: `.agents/skills/recettes-serveur/SKILL.md`
- Create: `.agents/skills/recettes-serveur/scripts/scaffold-nestjs.sh`
- Create: `.agents/skills/recettes-serveur/scripts/scaffold-fastify.sh`
- Create: `.agents/skills/recettes-serveur/scripts/scaffold-fastapi.sh`

**Context:** Recipes pour serveur NestJS, Fastify, FastAPI. Chaque section inclut scaffolding, structure projet, patterns de logging, error handling, OpenAPI, testing, gotchas.

- [ ] **Step 1: Créer SKILL.md (344 lignes)**

Le fichier contient :
- Frontmatter : `name: recettes-serveur`, `description: Use when building NestJS, Fastify, or FastAPI server projects`, `allowed-tools: Bash Read Write`
- 3 sections principales : NestJS, Fastify, FastAPI
- Pour chaque : scaffolding, project structure, logging, error handling, OpenAPI, testing, gotchas
- NestJS : nestjs-pino, exception filter, decorators tsconfig
- Fastify : plugin pattern, TypeBox validation, routes, pino logger, app.inject() tests
- FastAPI : Pydantic schemas, async routes, lifespan, ruff, pytest
- Gotchas cross-framework (status codes, JSON logs, error messages French)

- [ ] **Step 2: Créer scaffold-nestjs.sh (99 lignes)**

Script bash qui :
- Prend un nom de projet en argument
- `npx @nestjs/cli new` avec TypeScript et pnpm
- Ajoute nestjs-pino, @nestjs/swagger, prisma
- Configure eslint.config.js avec overrides NestJS
- Ajoute experimentalDecorators dans tsconfig.json
- Crée .editorconfig

- [ ] **Step 3: Créer scaffold-fastify.sh (250 lignes)**

Script bash qui :
- Initialise project pnpm avec fastify + typebox + swagger + cors
- Crée tsconfig.json complet
- Crée structure : src/{plugins,routes/cats,test/routes}
- Fichiers : index.ts, app.ts, plugins/cors.ts, routes/index.ts, routes/cats/index.ts, utils/logger.ts
- Test example avec vitest et app.inject()
- Scripts package.json : dev/build/start/lint/test/typecheck
- .editorconfig

- [ ] **Step 4: Créer scaffold-fastapi.sh (252 lignes)**

Script bash qui :
- `uv init <name>` avec fastapi[standard]
- Ajoute ruff, pytest, httpx
- Structure : app/{models,schemas,routers,services,utils}
- Fichiers : main.py (lifespan), config.py (pydantic Settings), schemas/cat.py, routers/cats.py, services/cats.py, models/cat.py, utils/logger.py
- Tests pytest avec TestClient
- pyproject.toml avec ruff config + pytest ini

- [ ] **Step 5: Rendre les scripts exécutables**

```bash
chmod +x .agents/skills/recettes-serveur/scripts/*.sh
```

---

### Task 3: Créer le skill recettes-client

**Files:**
- Create: `.agents/skills/recettes-client/SKILL.md`

**Context:** Vue 3 avec VueDsfr + Nuxt 3. Scaffolding, composable toaster (useToaster + AppToaster), testing stack (Vitest, Vue Testing Library, Jest DOM, Playwright).

- [ ] **Step 1: Créer SKILL.md (168 lignes)**

Le fichier contient :
- Frontmatter : `name: recettes-client`, `description: Use when building Vue 3 or Nuxt 3 frontend projects`, `allowed-tools: Read Write Bash`
- Vue 3 : scaffolding `create-vue-dsfr`, ce que le template inclut, additions recommandées (date-fns, Pinia, Vue Router, UnoCSS)
- Testing stack : Vitest, Vue Testing Library, Jest DOM, Playwright
- Nuxt 3 : quand l'utiliser (SEO, SSG, file-based routing)
- Toaster complet : composable `useToaster` (reactive, getRandomId, timeouts avec cleanup), component `AppToaster.vue` (transition-group, pointer-events), usage example
- Gotchas (6 rules) : DSFR mandatory, 2+ words, Jest DOM with Vitest, timeout cleanup, getRandomId, transition group CSS

---

### Task 4: Créer le skill stack-technique

**Files:**
- Create: `.agents/skills/stack-technique/SKILL.md`

**Context:** Outils recommandés : pnpm, proto, ESLint antfu, Prisma ORM, dates, REST Client. Résumé de la stack technique.

- [ ] **Step 1: Créer SKILL.md (171 lignes)**

Le fichier contient :
- Frontmatter : `name: stack-technique`, `description: Use when configuring recommended tools and libraries`, `allowed-tools: Bash Read`
- Package Manager : pnpm v10.x par défaut
- Version Management : proto, pin node 24.x, `engines` dans package.json
- ESLint : setup antfu, Vue overrides, French text rules, VS Code settings, scripts lint/format, gotchas
- Prisma ORM : setup, Prisma 7+ (output path), schema conventions, migrations, singleton pattern, seeding, gotchas
- Dates : UTC, ISO 8601 with ms, date-fns, validate client+server
- REST Client : VS Code extension
- Tool Summary table (pnpm, proto, ESLint, Ruff, Prisma, PostgreSQL, uv, frameworks, Vitest/Playwright, date-fns)

---

### Task 5: Créer le skill monorepo

**Files:**
- Create: `.agents/skills/monorepo/SKILL.md`

**Context:** pnpm workspaces + Turborepo. Setup workspaces, structure apps/packages, workspace dependencies, Turborepo tasks, gotchas.

- [ ] **Step 1: Créer SKILL.md (113 lignes)**

Le fichier contient :
- Frontmatter : `name: monorepo`, `description: Use when setting up a JavaScript/TypeScript monorepo`, `allowed-tools: Bash Read`
- pnpm Workspaces : pnpm-workspace.yaml config, structure apps/packages, workspace:^ dependencies, gotchas (scoped packages, single lockfile, pnpm install at root)
- Turborepo : setup, turbo.json tasks (build/dependsOn/^build, dev/cache:false/persistent:true, lint, test), root package.json scripts, gotchas (.turbo gitignore, ^build meaning, cache:false, persistent:true, precise outputs, --filter CI)
- Références : monorepo template, Helm template

---

### Task 6: Créer les skills ci-cd, environnement-installation, outils-dev

**Files:**
- Create: `.agents/skills/ci-cd/SKILL.md`
- Create: `.agents/skills/environnement-installation/SKILL.md`
- Create: `.agents/skills/outils-dev/SKILL.md`
- Create: `.agents/skills/outils-dev/scripts/check-environment.sh`

**Context:** 3 skills restants à créer en parallèle car indépendants.

- [ ] **Step 1: Créer ci-cd/SKILL.md (173 lignes)**

Le fichier contient :
- Frontmatter : `name: ci-cd`, `description: Use when setting up CI/CD pipelines`, `allowed-tools: Bash Read Write`
- Principles : GitHub Actions, SonarQube, Trivy
- CI Phase : lint → tests → build → E2E → quality
- CD Phase : CVE scan → release → deploy
- Pipeline checklist (lint, unit, build, E2E, Sonar, Docker, Trivy, Helm)
- Minimal CI template (lint/test/build jobs avec pnpm/action-setup et actions/setup-node)
- Reusable Workflows (fabnum-cicd) : 10 workflows listés, usage pattern, example CI complet
- Required Secrets (GH_PAT, SONAR_TOKEN, SONAR_PROJECT_KEY)
- Gotchas (8 rules) : reusable workflows mandatory, pin @main, Trivy post-build, Sonar permissions, frozen-lockfile, pnpm cache, node 24, v6 tags

- [ ] **Step 2: Créer environnement-installation/SKILL.md (153 lignes)**

Le fichier contient :
- Frontmatter : `name: environnement-installation`, `description: Use when setting up a developer machine`, `allowed-tools: Bash Read Write`
- Tools Matrix : proto, Git, pnpm, Docker, zsh, GitHub CLI, uv, Node 24
- Windows/WSL, macOS, Ubuntu : commandes d'installation complètes
- Proto setup : `.prototools` format
- Git configuration
- VS Code Settings : `.vscode/settings.json` (JS/TS, Python)
- Docker Compose template
- Gotchas (7 rules) : WSL mandatory, docker group re-login, proto over direct, WSL extension, pnpm cache CI, docker re-login, Noto fonts, WSL2 memory

- [ ] **Step 3: Créer outils-dev/SKILL.md (140 lignes)**

Le fichier contient :
- Frontmatter : `name: outils-dev`, `description: Use when working with developer tooling`, `allowed-tools: Bash Read`
- Available scripts : check-environment.sh
- Git : branch naming, commit messages, zsh aliases avec ding
- Docker : container rules, Docker Compose, Kubernetes local (Kind/k3d/Minikube)
- pnpm : install/add/store path
- proto : install node/python, ls, .prototools
- GitHub CLI : auth/login/pr/create/list/review
- uv (Python) : init/add/run/fastapi dev/pytest/ruff
- VS Code Extensions : ESLint, Prisma, Python, Docker, REST Client
- Gotchas (8 rules) : ticket in branch names, pnpm store path, docker group, proto precedence, .turbo ignore, GitHub Actions v6, WSL2 memory, Docker Compose default

- [ ] **Step 4: Créer check-environment.sh (128 lignes)**

Script bash qui :
- Vérifie les outils requis (git, node, pnpm, docker) avec versions
- Vérifie les outils optionnels (proto, zsh, gh, uv, ruff)
- Check docker group membership (Linux/macOS)
- WSL detection
- Option `--fix` avec commandes d'installation
- Affichage coloré (pass/fail/warn)
- Retourne exit code = nombre d'erreurs

- [ ] **Step 5: Rendre le script exécutable**

```bash
chmod +x .agents/skills/outils-dev/scripts/check-environment.sh
```

---

### Task 7: Créer README.md et commit

**Files:**
- Create: `README.md`
- Create: `docs/superpowers/specs/2026-04-21-cofabnum-skills.md` (copie depuis specs/)

- [ ] **Step 1: Créer README.md (77 lignes)**

Le fichier contient :
- Titre + description (skills pour agents OpenCode/Claude/Codex)
- Structure `.agents/skills/` avec 8 skills listés et descriptions
- Installation (depuis ce repo, depuis autre projet)
- Installation via opencode.json
- Scripts disponibles (table : 6 scripts avec skill + usage)
- Sécurité (permissions opencode.json)
- Source (docs.fabrique-numerique.fr)
- Références (agentskills.io, OpenCode, Fabrique Numérique)

- [ ] **Step 2: Copier le spec dans docs/superpowers/specs/**

```bash
mkdir -p docs/superpowers/specs
cp specs/2026-04-21-cofabnum-skills.md docs/superpowers/specs/
```

- [ ] **Step 3: Rendre les scripts exécutables**

```bash
chmod +x .agents/skills/*/scripts/*.sh
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add CoFabNum agent skills and project configuration

Add 8 operational skills for Fabrique Numérique projects:
- conventions-cofabnum, recettes-serveur, recettes-client, stack-technique
- monorepo, ci-cd, environnement-installation, outils-dev

Include 6 executable scripts (validation, scaffold, environment check).
Total: 2570 lines of skill docs + 915 lines of scripts."
```

---

### Notes d'implémentation

- **Frontmatter agentskills.io** : chaque SKILL.md commence par `name`, `description`, `allowed-tools`
- **allowed-tools** : `Bash Read` pour lecture seule, `Bash Read Write` pour écriture, `Read Write Bash` pour recipes
- **Cross-references entre skills** : utiliser `[skill-name]` dans le texte pour relier les skills entre eux
- **Scripts bash** : `set -euo pipefail` obligatoire, messages colorés avec escape codes, exit codes significatifs
- **Taille max** : chaque SKILL.md ≤ 500 lignes (vérifier avec `wc -l`)
- **Validation agentskills.io** : name unique, description explicite, allowed-tools cohérents
