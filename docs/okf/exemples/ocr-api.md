---
type: exemple travaillé
title: Cas complet - IA-Generative/ocr-api
description: Projet monorepo (api, worker, frontend) déployé sur CPiN - ce qu'il illustre de la doc et ses particularités locales à ne pas généraliser.
tags: [exemple, ocr-api, monorepo, cd, chart]
---

# Exemple : ocr-api (branche `dev`)

Dépôt : `IA-Generative/ocr-api`. Il applique tous les patrons de cette doc. Ce qui lui est **propre** est marqué (⚠).

## Vue d'ensemble
- Trois images : `api`, `worker` (PaddleOCR), `frontend`, poussées sur `ghcr.io/ia-generative/ocr-api/{api,worker,frontend}`.
- Un chart unique `helm/` (nom `ocr`, version `0.2.2`, appVersion `0.20.2`) — copie du `template/` tobi, **pas** une dépendance tobi.
- Branches `dev` (rc) et `main` (stable), release-please en deux configs (`.github/releases/`), fichiers bumpés : `apps/server/pyproject.toml`, `apps/client/package.json`, `sdk/python/pyproject.toml`.

## CI (`ci.yml`) — voir [integration-continue.md](../cycle-de-vie/integration-continue.md)
`path-filter` → matrice `services` ; `expose-vars` ; `lint-commits`, `scan-gitleaks`, `scan-trivy` (config), `lint-helm` ×2 ; `build-docker` matrice (`IMAGE_TAG: pr-N`, cibles `builder`/`prod`, `CACHE_MODE: min`) ; `scan-trivy` images ; gate `all-jobs-passed`.
⚠ `CACHE_MODE: min` à cause des couches Paddle ; `BUILD_ARM64: false`.

## CD (`cd.yml`) — voir [livraison-continue.md](../cycle-de-vie/livraison-continue.md)
`release` → `build-docker` (matrice) ; `bump-chart` (`RUN_MODE: local`) → `sync-cpin` et `release-chart` (`CHECKOUT_REF` = commit du bump, OCI `ghcr.io/ia-generative/ocr-api/ocr`) → `sync-prerelease-branch` (main seulement).
`AUTOMERGE_*` à `false` : la PR de release est fusionnée à la main. Un `dso-auto-sync.yaml` manuel permet de forcer la synchro.
⚠ Variable de dépôt `GILTAB_PROJECT_NAME` (faute dans le nom, héritée).

## Côté DSO (`.gitlab-ci-dso.yml`)
Inclut `vault-ci.yml`, `kaniko-ci.yml`, `helm-ci.yml` depuis `$CATALOG_PATH` ; étapes `read-secret`, `docker-build`, `helm-package`.
Kaniko pousse `ocr-api`, `ocr-worker` (+ ancien nom `ocr-service-paddle-2.10.0`), `ocr-frontend` dans Harbor, avec `--build-arg DOCKERHUB_MIRROR_URL`.
`helm-package-push` (alpine/helm) : `helm dependency update`, package, push OCI Harbor, sur `tags`, `main`, `dev`.
La sélection des charts modifiés se fait par `git diff` entre `CI_COMMIT_BEFORE_SHA` et `CI_COMMIT_SHA`.

## Chart — voir [helm/](../helm/index.md)
Dépendances (`condition: <alias>.enabled`) : `redis`, `postgres`, `rustfs` (CloudPirates, OCI docker.io) et `cnpg` (`cluster`, CloudNativePG). `runAsUser`/`fsGroup` à retirer sur OpenShift (documenté en commentaire dans `values.yaml`).
⚠ `service.nodePort: 31000` par défaut : à ne pas utiliser (Kyverno `restrict-nodeport`), rester en ClusterIP.
⚠ Le chart n'ajoute pas les labels `app/env/tier` requis par Kyverno.

## Nettoyage
`clean-cache.yml` quotidien (01:00 UTC) : PR fermées → `clean-cache` et `clean-images` (matrice PR × service) + balayage d'orphelins.

## Ce qu'on ne voit pas dans le dépôt
Le dépôt de values par environnement (« mirai-values » cité en commentaire) et la configuration ArgoCD effective ; les environnements épinglent une version de chart.
