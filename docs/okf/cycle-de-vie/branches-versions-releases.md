---
type: référence de processus
title: Branches, versions et releases
description: Conventional Commits, branche de prerelease (rc) et branche stable, versions app vs chart, tags d'images et nommage de branches.
tags: [cycle-de-vie, release-please, versions, branches]
---

# Branches, versions et releases

## Nommage et commits (AGENTS.md)
- Branche : `<type>/<kebab-desc>#<ticket>` (`feat`, `fix`, `hotfix`, `tech`, `docs`, `refactor`).
- Commits : Conventional Commits (validés par `lint-commits`, types par défaut `feat,fix,docs,style,refactor,perf,test,build,ci,chore,revert`).

## Deux branches, deux flux
| Branche | Rôle | Version produite | Config release-please |
|---|---|---|---|
| `dev` / `develop` (`PRERELEASE_BRANCH`, défaut `develop`) | prerelease | `X.Y.Z-rc.N` | `release-please-config-rc.json` (ocr-api : `…-prerelease.json`) |
| `main` (`RELEASE_BRANCH`) | stable | `X.Y.Z` | `release-please-config.json` |

Flux : commits conventionnels → release-please ouvre/met à jour une PR de release → un humain la fusionne (`AUTOMERGE_*` à `false` chez ocr-api) →
le CD du même push voit `release-created=true` et enchaîne build, chart, synchro. Promotion : PR `dev` → `main`.
Après une release sur `main`, **`sync-prerelease-branch` resynchronise `dev`** ; sinon `release-app` échoue sur `dev` (« is missing N commit(s) »).

## Versions
- **appVersion** : version de l'application, donnée par release-please.
- **version du chart** : suit sa propre ligne (ocr-api : app `0.20.2`, chart `0.2.2`).
  `update-helm-chart` en `UPGRADE_TYPE: auto` déduit le niveau de bump du delta d'appVersion, et choisit rc vs stable selon la forme d'`APP_VERSION`.
- **Tags d'images GitHub** : la version (`0.20.2`), `latest` uniquement sur `main`, parfois `X.Y` et `X` (`TAG_MAJOR_AND_MINOR`), jamais de SHA court (ocr-api).
- **Tags d'images Harbor (DSO)** : SHA court, slug de branche, appVersion lue dans `Chart.yaml`, `latest` si semver stable.
- `latest` est interdit par Kyverno (`disallow-latest`, enforce en prod) : ne pas le référencer dans un chart déployé.

## Précautions
- Le token de release-please doit être une **GitHub App** (ou PAT) pour que la PR de release déclenche la CI.
- Sur dépôt avec rulesets exigeant une PR, seul un App en bypass peut pousser le bump du chart.
- Dépôts à releases immuables : `draft: true`, `force-tag-creation: true` et `PUBLISH_DRAFT_RELEASE: true`.
