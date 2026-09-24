---
type: référence
title: Release applicative et publication des charts
description: Fonctionnement de release-app (release-please), update-helm-chart, release-helm(-local), dispatch-helm-chart et sync-prerelease-branch.
tags: [cicd, release-please, helm, sync-prerelease]
---

# Release et charts

## release-app
- Enveloppe release-please. Sorties : `release-created`, `version` (sans « v »), `major-tag`, `minor-tag`, `patch-tag`.
- Branches : `RELEASE_BRANCH` (main), `PRERELEASE_BRANCH` (develop) avec `ENABLE_PRERELEASE`. Config/manifest sélectionnés par `github.ref_name`.
- Token utilisé : `app-token || GH_PAT || github.token`. Le **checkout reste volontairement sur `GITHUB_TOKEN`** pour que ses pushs ne redéclenchent pas le CD : ne pas ajouter `token:`.
- Sur la branche de prerelease, vérifie via l'API compare que `dev` contient tout `main` sinon échoue (« is missing N commit(s) »). Relancer une fois le CD de `main` terminé.
- `AUTOMERGE_PRERELEASE`/`AUTOMERGE_RELEASE` exigent App ou PAT.

## update-helm-chart
- `RUN_MODE: local` (commit direct sur la branche courante) ou `called` (PR vers `BASE_BRANCH`). `UPGRADE_TYPE: auto|major|minor|patch|prerelease`.
- Sorties : `chart-version`, `previous-chart-version`, `commit-sha` (mode local). Régénère le README avec helm-docs.

## release-helm-local / release-helm
- `release-helm-local` : monorepo, OCI, package `CHECKOUT_REF`, `HELM_REPOS` (`nom=url,…`) pour les dépendances. Récupération : `helm pull oci://ghcr.io/<owner>/<repo>/<chart> --version <v>`.
- `release-helm` : dépôt de charts dédié, chart-releaser, `PUBLISH_OCI`, `SIGN_CHART`, `PAGES_BRANCH` (gh-pages) ; sortie `published-charts`.

## dispatch-helm-chart
Déclenche `update-helm-chart` dans un dépôt de charts séparé ; requiert App/PAT.

## sync-prerelease-branch
Rebase la branche de prerelease sur la branche de release ; **dernier job** du CD sur `main`, avec `needs` = tous les jobs qui y committent.

## sync-cpin
POST sur `$GITLAB_URL/api/v4/projects/$GIT_MIRROR_PROJECT_ID/trigger/pipeline` avec `ref=main`, `variables[PROJECT_NAME]`, `variables[GITHUB_COMMIT_SHA]`,
`variables[GIT_BRANCH_DEPLOY]` (ou `SYNC_ALL=true`) et `ADDITIONAL_VARIABLES` (JSON). Secret : `GIT_MIRROR_TOKEN`. `GITLAB_URL` doit être en `https://`.
Correspond à la commande curl fournie par la console CPiN dans les secrets du projet.
