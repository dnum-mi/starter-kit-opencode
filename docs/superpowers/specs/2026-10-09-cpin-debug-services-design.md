# Design : debug automatisé des services CPiN

Date : 2026-10-09
Issue : #39 (POC Playwright token ArgoCD via OIDC)
Branche : `feat/argocd-token-poc#39`

## Contexte

Le POC Playwright (issue #39) a validé que le token OIDC capturé via le flux navigateur (login SSO
Keycloak) donne accès aux API de plusieurs services internes CPiN :

| Service | Endpoint testé | Résultat |
|---|---|---|
| ArgoCD | `GET /api/v1/applications` | 200 |
| Harbor | `GET /api/v2.0/projects` | 200 |
| GitLab | `GET /api/v4/user` | 401 (auth distincte, PAT requis) |

Ce design industrialise ce POC en scripts de debug réutilisables, documente les URLs des instances, et
intègre le login optionnel dans le runbook de déploiement.

## Objectifs

1. Fournir des scripts prêts à l'emploi pour interroger les routes des services internes (debug).
2. Documenter les URLs des instances (Scaleway + Cloud Pi) dans un fichier dédié.
3. Sécuriser le stockage des tokens (fichier unique 0600, gitignoré, bloqué opencode).
4. Expliquer dans le runbook `deploiement-cpin` ce qui se passe, avec un login Playwright **optionnel**
   mais conseillé pour le debug.

## Architecture

### 1. Tableau des URLs — `docs/okf/cloud-pi-native/urls-instances.md` (nouveau)

Tableau des URLs par instance, référencé dans `docs/okf/cloud-pi-native/index.md` :

| Service | Scaleway (sdid) | Cloud Pi |
|---|---|---|
| Console | `console.sdid.cpin.numerique-interieur.com` | `console.<instance>` |
| ArgoCD | `argocd.sdid.cpin.numerique-interieur.com` | `argocd.<zone>` |
| Harbor | `harbor.sdid.cpin.numerique-interieur.com` | `harbor.<zone>` |
| GitLab | `gitlab.sdid.cpin.numerique-interieur.com` | `<gitlab>` |
| Keycloak | `keycloak.sdid.cpin.numerique-interieur.com/realms/dso` | idem |

Note : les URLs Cloud Pi sont des exemples par instance (les instances n'ont pas toutes la même version
de plateforme — ex. Scaleway 9.9.0 vs RIE ≥ 9.11). Relever la version réelle de l'instance avant de
supposer un comportement.

### 2. Secrets unifiés — `.env.secrets` (0600, gitignoré, bloqué opencode)

Un seul fichier à la racine de `scripts/cpin-debug/` contenant les 3 tokens :

| Variable | Source | Écrit par |
|---|---|---|
| `ARGOCD_TOKEN` | token OIDC (session) | `login.mjs` après capture Playwright |
| `DSO_TOKEN` | `x-dso-token` console | l'humain |
| `GITLAB_PAT` | PAT GitLab | l'humain |

Format : `KEY=value` (une ligne par token), chargé par les scripts de check.

### 3. Scripts de debug — `scripts/cpin-debug/` (nouveau dossier)

Un script par service, chacun lit son token depuis `.env.secrets` :

| Fichier | Service | Endpoint | Token |
|---|---|---|---|
| `login.mjs` | login Playwright (optionnel) | — | écrit `ARGOCD_TOKEN` |
| `check-argocd.mjs` | ArgoCD | `GET /api/v1/applications` | `ARGOCD_TOKEN` |
| `check-harbor.mjs` | Harbor | `GET /api/v2.0/projects` | `ARGOCD_TOKEN` |
| `check-gitlab.mjs` | GitLab | `GET /api/v4/user` | `GITLAB_PAT` |
| `check-console.mjs` | Console | `GET /api/v1/me` | `DSO_TOKEN` |

- `package.json` : dépendance `playwright`, scripts npm (`login`, `check:argocd`, `check:harbor`, `check:gitlab`, `check:console`).
- `.gitignore` : exclut `.env.secrets` et `node_modules/`.
- Chaque script affiche le statut HTTP et un résumé lisible, **jamais la valeur du token** (masquée).

### 4. Sécurisation

- `.gitignore` : `.env.secrets` exclu (racine repo + dossier `scripts/cpin-debug/`).
- `opencode.jsonc` : règle de permission bloquant la lecture/écriture de `.env.secrets` par l'agent
  (l'humain seul y accède). Le token n'est jamais demandé, lu, écrit ni affiché par l'agent (règle skill
  `deploiement-cpin`).

### 5. Runbook — `.agents/skills/dso/deploiement-cpin/SKILL.md`

Nouvelle étape dans la phase 5 (vérifier après la synchro) : l'agent **propose** à l'utilisateur de se
logger (login Playwright) pour activer le debug automatisé des services internes ; si refus, debug
manuel via l'UI ArgoCD DSO. Expliquer ce qui se passe : token capturé en 0600 (`.env.secrets`), jamais
affiché, services interrogés (ArgoCD, Harbor, GitLab, Console).

## Flux d'utilisation

1. L'humain crée `.env.secrets` (0600) et y ajoute `DSO_TOKEN` et `GITLAB_PAT` (ou lance `login.mjs`).
2. `npm run login` : ouvre le navigateur, l'humain se connecte via SSO Keycloak, le token OIDC est
   écrit dans `.env.secrets` (0600).
3. `npm run check:argocd` / `check:harbor` / `check:gitlab` / `check:console` : interroge le service et
   affiche le statut.
4. Dans le runbook, l'agent propose le login à l'utilisateur ; si accepté, il lance les checks pour
   aider au debug.

## Hors périmètre

- Token API ArgoCD dédié (Service Team) — reste la solution de production pour la skill `provision-cpin`.
- Automatisation du remplissage du login (identifiants) — login humain interactif uniquement.
- Test des autres services (Nexus, SonarQube, Vault) — non couverts par ce design.

## Fichiers

| Fichier | Action |
|---|---|
| `docs/okf/cloud-pi-native/urls-instances.md` | créer |
| `docs/okf/cloud-pi-native/index.md` | modifier (référence) |
| `scripts/cpin-debug/package.json` | créer |
| `scripts/cpin-debug/.gitignore` | créer |
| `scripts/cpin-debug/.env.secrets` | créer (vide, 0600, gitignoré) |
| `scripts/cpin-debug/login.mjs` | créer |
| `scripts/cpin-debug/check-argocd.mjs` | créer |
| `scripts/cpin-debug/check-harbor.mjs` | créer |
| `scripts/cpin-debug/check-gitlab.mjs` | créer |
| `scripts/cpin-debug/check-console.mjs` | créer |
| `opencode.jsonc` | modifier (règle permission `.env.secrets`) |
| `.agents/skills/dso/deploiement-cpin/SKILL.md` | modifier (étape phase 5) |
