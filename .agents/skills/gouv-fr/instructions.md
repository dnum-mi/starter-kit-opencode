# Groupe `gouv-fr` : catalogue de skills de la Fabrique Numérique

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["gouv-fr"]`) ou par URL : voir le README.

## Périmètre

43 skills, tous préfixés `gouv-fr-`, qui couvrent la conception, l'implémentation, l'audit et le
déploiement d'une application de l'État : architecture et conventions, frontend Vue/React + DSFR,
backend, qualité et conformité (RGAA/RGPD), sécurité et audit, CI/CD Cloud Pi Native, données ouvertes.

## Relation avec les groupes `dev` et `dso`

Ces skills **recouvrent partiellement** `dev` et `dso` (mêmes sujets, contenus plus détaillés, noms
`gouv-fr-*` explicites). Les deux catalogues coexistent sans collision de noms, mais pour un même sujet
un seul jeu doit faire foi pour le projet : ne pas charger `gouv-fr` **et** `dev`/`dso` en même temps sur
le même poste. Correspondance des noms : voir `UPSTREAM.md` du dépôt `ynotopec/gouv-fr-skills`.

## Invariants

- **Les skills sont autonomes** : un skill `gouv-fr-*` se lit sans supposer qu'un groupe `dev` ou `dso`
  est installé. Le cas échéant, il renvoie par URL vers sa source, jamais par un chemin relatif entre groupes.
- **Noms uniques** : les noms `gouv-fr-*` sont distincts de ceux de `dev`/`dso` (OpenCode les télécharge
  tous dans un même cache).

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `gouv-fr-code-index` | Index de l'ensemble des skills gouv-fr — point d'entrée pour trouver le bon skill |
| `gouv-fr-stack-technique` | Stack recommandée : front Vue 3/DSFR, back Fastify/NestJS/FastAPI, TS strict, Prisma, ESLint, monorepo |
| `gouv-fr-monorepo-pnpm` | Monorepo pnpm workspaces + Turborepo — structure, workspaces, turbo.json, cache, filters |
| `gouv-fr-projet-structure` | Structure projet, CLI, config OpenCode et variables d'environnement |
| `gouv-fr-conventions-nommage` | Conventions de nommage et d'architecture (dossiers, fichiers, TypeScript, API) — scripts `check-folders.sh`, `validate-branch.sh` |
| `gouv-fr-adr` | Rédiger une Architecture Decision Record (format IA-Generative) |
| `gouv-fr-bug-investigation` | Forcer 2-3 hypothèses de cause + plan B avant tout fix de bug |
| `gouv-fr-workflow-dev` | Workflow : plan mode, tâches, leçons, bug fixing |
| `gouv-fr-repo-init` | Démarrer un repo proprement et sans fuite (git, `.gitignore` durci) |
| `gouv-fr-outils-developpement` | Installer/configurer les outils dev (Git, Docker, pnpm, proto, VS Code, GitHub CLI, uv, zsh) |
| `gouv-fr-api-rest` | Conventions API RESTful, OpenAPI/Swagger et tests d'API |
| `gouv-fr-backend-fastify` | Serveur Fastify / NestJS / FastAPI — échafaudage (`scaffold-*.sh`), structure, logs, OpenAPI |
| `gouv-fr-frontend-vue3` | Frontend Vue 3 / Nuxt 3 — conformité DSFR, échafaudage VueDsfr, composables |
| `gouv-fr-composants-vue` | Installer et utiliser VueDsfr (composants Vue 3 DSFR) |
| `gouv-fr-react-dsfr` | React DSFR (`@codegouvfr/react-dsfr`), setup Next.js App Router |
| `gouv-fr-lasuite-ui-kit` | Interfaces React LaSuite (`@gouvfr-lasuite/ui-kit`, Cunningham) |
| `gouv-fr-design-system` | Installer et vérifier le DSFR (design system de l'État) — script `verify_dsfr.py` |
| `gouv-fr-graphiques-dsfr` | Graphiques DSFR en web-components Vue.js (line, bar, pie…) |
| `gouv-fr-pictogrammes-dsfr` | Pictogrammes, icônes et visuels officiels du DSFR |
| `gouv-fr-templates-email` | Templates email DSFR |
| `gouv-fr-cookies-rgpd` | Cookies d'un site DSFR avec Tarte au Citron (RGPD) |
| `gouv-fr-compliance-rgaa` | Conformité État : RGAA, DSFR, RGPD |
| `gouv-fr-lint-eslint` | Lint et formattage ESLint, Ruff et EditorConfig |
| `gouv-fr-code-quality` | Qualité de code au quotidien et grille de revue (code généré par IA) |
| `gouv-fr-audit-conformite` | Audit de conformité d'une application |
| `gouv-fr-securite` | Sécurité : secrets, gitleaks, SQL, TLS, isolation VM |
| `gouv-fr-audit-safety` | Vérifier qu'une base de code peut être ouverte/travaillée sans risque avant de s'y plonger |
| `gouv-fr-audit-pentest` | Audit & durcissement sécurité avant pen-test (OWASP Top 10 + OWASP LLM) |
| `gouv-fr-audit-redteam` | Campagne red-team / prompt-injection (OWASP LLM01) contre un service LLM |
| `gouv-fr-audit-openwebui` | Identité SSO des outils per-user derrière OpenWebUI (ou passerelle LLM/MCP) |
| `gouv-fr-anssi-guides` | Trouver et consulter le bon guide ANSSI (API MesServicesCyber) — catalogue |
| `gouv-fr-dat-homologation` | Pré-remplir un document d'homologation DAT (MirAI) depuis le code et les manifestes |
| `gouv-fr-dat-word` | Rendu `.docx` ministériel du DAT — script `render_docx.py` |
| `gouv-fr-github-actions-ci` | CI GitHub Actions de base (lint, tests, build) — choix entre workflow maison et réutilisable |
| `gouv-fr-github-actions-reusable` | Workflows réutilisables `dnum-mi/fabnum-cicd` (lint, Trivy/Gitleaks, build, release-please, sync-cpin) |
| `gouv-fr-repo-cicd` | Poser une CI/CD « Cloud Pi Native » sur un projet GitHub existant en appelant les workflows réutilisables |
| `gouv-fr-deployment-docker-k8s` | Dockerfiles de prod, durcissement (rootless, lecture seule), tags, K8s local |
| `gouv-fr-deployment-cloud-pi-native` | Onboarder et déployer sur Cloud Pi Native (console DSO, pipeline Harbor, ArgoCD, Vault) |
| `gouv-fr-helm-chart` | Chart Helm CPiN (gabarit this-is-tobi, values par env, Kyverno) — `check-cpin-rules.py` |
| `gouv-fr-service-names` | Anti-régression des anciens noms de services (rebranding) |
| `gouv-fr-smoke-test` | Smoke-test rapide d'un pipeline (gateway + auth + ingester) |
| `gouv-fr-datagouv-apis` | APIs data.gouv.fr (catalogue, datasets, organisations, téléchargement) |
| `gouv-fr-donnees-ouvertes` | Données ouvertes publiques du SIG (schémas, JSONL) |
