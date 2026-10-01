---
name: cicd-fabnum
description: Use when writing or reviewing GitHub Actions ci.yml/cd.yml with the reusable workflows of dnum-mi/fabnum-cicd — lint, Trivy/Gitleaks scans, Docker build, release-please, Helm chart bump and publish, GitHub App credentials, and the sync-cpin trigger toward Cloud Pi Native
allowed-tools: Bash Read Write
---

# CI/CD avec fabnum-cicd

Assembler les workflows réutilisables de [`dnum-mi/fabnum-cicd`](https://github.com/dnum-mi/fabnum-cicd) en un `ci.yml` (pull request) et un `cd.yml` (release + livraison vers Cloud Pi Native).
Les gabarits de `references/` sont validés contre les entrées et secrets réels des workflows (`@v0`).

## Avant d'écrire : 5 questions

| Question | Conséquence |
|----------|-------------|
| Une seule image ou plusieurs (monorepo) ? | plusieurs : `path-filter` + matrice `services` + une paire build/attest par composant |
| Un chart Helm, et où ? | dans le dépôt : `update-helm-chart` (`RUN_MODE: local`) + `release-helm-local` ; **dépôt d'infra séparé** (recommandé sur CPiN) : `dispatch-helm-chart`, recette [`references/depot-infra.md`](references/depot-infra.md) ; dépôt de charts publié : `release-helm` |
| Branches `dev` (rc) et `main` (stable) ? | `ENABLE_PRERELEASE: true` + `sync-prerelease-branch` en dernier job |
| Déploiement sur CPiN ? | job `sync-cpin` **après** le bump du chart |
| Le dépôt exige-t-il une PR pour tout push (ruleset) ? | oui : GitHub App obligatoire pour le bump du chart |

## Démarrer

1. Partir de [`references/ci.yml`](references/ci.yml) et [`references/cd.yml`](references/cd.yml), remplacer les `<APP>` et chemins.
2. Retirer les jobs sans objet, mais **garder `all-jobs-passed` à jour** : tout job ajouté ou retiré se répercute dans son `needs`.
3. Créer les secrets et variables du tableau ci-dessous.
4. Vérifier : `actionlint`, puis une PR de test ; contrôler que la CI se lance sur la PR de release.

## Règles

- **Version** : `@v0` (tag flottant, dépôt en `0.x` : un bump mineur peut casser ; `@v0.20` ou un SHA pour figer). **Jamais `@main`** (règle du repo).
- **Permissions** par job, au minimum ; l'appelant doit accorder l'union de ce que le workflow appelé déclare (voir `references/workflows.md`).
- **Jamais `secrets: inherit`** : passer chaque secret nommément.
- **Credential** : `GITHUB_TOKEN` d'abord ; **GitHub App** (`APP_CLIENT_ID` = Client ID `Iv23li…`, pas l'App ID ; `APP_PRIVATE_KEY` = `.pem` complet) dès qu'une PR de release doit déclencher la CI, pour l'automerge, le dispatch inter-dépôts ou un ruleset. PAT en dernier recours. Fournir un seul des deux secrets App fait échouer le job.
- **Image en minuscules** : `ghcr.io/${GITHUB_REPOSITORY,,}` calculé une fois dans `expose-vars`.
- **Booléens** issus d'`env`/outputs : comparer avec `== 'true'`.
- **Concurrence** : `cancel-in-progress: true` en CI, `false` en CD.
- **Actions tierces** pinnées par SHA avec commentaire de version ; jamais `@main`/`@master`/`@latest`.

## Secrets et variables

| Nom | Type | Utilisé par |
|-----|------|-------------|
| `APP_CLIENT_ID`, `APP_PRIVATE_KEY` | secrets | `release-app`, `update-helm-chart`, `dispatch-helm-chart` (les deux ensemble : un seul fait échouer le job ; `GH_PAT` en alternative) |
| `GITLAB_TRIGGER_TOKEN` (→ `GIT_MIRROR_TOKEN`) | secret | `sync-cpin` : **pipeline trigger token `glptt-`** du projet `mirror`, lu dans la console (secrets du projet), pas un PAT `glpat-` |
| `GITLAB_URL`, `GITLAB_MIRROR_ID`, `GITLAB_PROJECT_NAME` | **variables** (`vars.`) | `sync-cpin` : un secret ne peut pas être passé dans `with:` |
| `SONAR_TOKEN`, `SONAR_PROJECT_KEY` | secrets | `scan-sonarqube` |

L'URL GitLab, l'id du projet `mirror` et le token viennent de la console CPiN (secrets du projet).
**Avant** d'activer `sync-cpin`, l'humain crée ces secrets et variables (l'agent ne manipule jamais leur valeur) ; porte : `gh secret list` et `gh variable list` affichent tous les noms utilisés par les gabarits retenus (les 4 de `sync-cpin`, plus `APP_*` et `SONAR_*` selon les jobs). Sinon le premier run échoue avec `GITLAB_URL must be a single https:// URL, got ''`.
Ajouter aussi au `ci.yml` le job bloquant `check-cpin-rules` (rendu `helm template` + `check-cpin-rules.py`, skill `helm-chart-cpin`) dans les `needs` de `all-jobs-passed`.

## Pièges

1. Matrice vide (`fromJSON('[]')`) = erreur : garder avec `if: … != '[]'`.
2. `IMAGE_TARGET` obligatoire si le dernier stage du Dockerfile est `test`.
3. `scan-trivy` : `CATEGORY` distinct par leg de matrice, `TIMEOUT` pour les grosses images, `FAIL_ON_ERROR` est `false` par défaut (informatif).
4. Pas de matrice pour `attest-docker` : les outputs d'un job matricé s'effondrent en une seule valeur.
5. `sync-prerelease-branch` : `needs` = exactement les jobs qui committent sur `main` (`release`, `bump-chart`). Sinon `release-app` échoue sur `dev` (« is missing N commit(s) »).
6. `sync-cpin` avant le bump du chart : GitLab voit l'ancien état.
7. Cache : `CACHE_MODE: min` si les couches sont lourdes (budget 10 Go du cache GitHub).
8. `clean-images` supprime tout tag qu'on lui donne : ne lui passer que des PR fermées.

## Pour aller plus loin

- Catalogue et permissions par workflow : [`references/workflows.md`](references/workflows.md).
- Dépôt applicatif + dépôt d'infra séparé (dispatch, CI et CD du dépôt d'infra, App sur les deux dépôts) : [`references/depot-infra.md`](references/depot-infra.md).
- Doc interne : `docs/okf/cicd/` (contrat des workflows, release et charts, pièges), `docs/okf/decisions/github-app-vs-pat.md`, `docs/okf/cycle-de-vie/`.
- Sources : `dnum-mi/fabnum-cicd/docs/workflows/`, exemple complet `IA-Generative/ocr-api` (`ci.yml`, `cd.yml`).
- Déploiement du chart et contraintes CPiN : skills `helm-chart-cpin` et `deploiement-cpin` (groupe `dso`).
