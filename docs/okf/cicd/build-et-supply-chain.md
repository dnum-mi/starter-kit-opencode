---
type: référence
title: Build d'images, scans et attestations
description: Comportement de build-docker, scan-trivy, scan-gitleaks, scan-sonarqube et attest-docker - entrées clés, tags, sorties et pièges.
tags: [cicd, docker, trivy, attestation, supply-chain]
---

# Build, scans, attestations

## build-docker
- Requis : `IMAGE_NAME`, `IMAGE_TAG`, `IMAGE_DOCKERFILE`, `IMAGE_CONTEXT`. Utiles : `IMAGE_TARGET`, `BUILD_ARGS`, `LATEST_TAG`, `TAG_MAJOR_AND_MINOR`, `TAG_SHORT_SHA`, `CACHE`/`CACHE_MODE`, `BUILD_AMD64`/`BUILD_ARM64`, `USE_QEMU`, `PUSH`.
- Architecture : job `infos` → `build` par architecture (runners ARM natifs si `USE_QEMU: false`) → `merge` (manifest multi-arch).
- Sorties : `digest` (vide si `PUSH: false`), `image` (nom normalisé), `artifact-prefix`.
- `PUSH: false` exporte l'image en artefact tarball que `scan-trivy` et `test-docker` peuvent consommer.
- Métadonnées OCI (`org.opencontainers.image.*`) posées par défaut.
- Ne pas oublier `IMAGE_TARGET` si le dernier stage est `test`.

## scan-trivy
- Entrées : `IMAGE` ou `IMAGE_ARTIFACT` (scan d'image), `PATH` (config/fs), `FORMAT`, `SEVERITY`, `TIMEOUT`, `TRIVYIGNORES`, `CATEGORY`, `GITHUB_SECURITY_TAB`, `PR_NUMBER`, `FAIL_ON_ERROR` (**false** par défaut).
- Scanne `os,library` avec `ignore-unfixed: true`.
- `CATEGORY` distinct par leg de matrice, sinon les SARIF s'écrasent ; `TIMEOUT` (ex. `20m`) pour les grosses images, sinon abandon sans rapport.
- Sortie `table` → résumé du job (plafonné à 1 MiB) ; SARIF → onglet Security.

## scan-gitleaks
`FAIL_ON_LEAKS` (true), `FORMAT` sarif, `LOG_OPTS` (HEAD), version fixée par `GITLEAKS_VERSION`.

## scan-sonarqube
Requiert `SONAR_URL` et les secrets `SONAR_TOKEN`, `SONAR_PROJECT_KEY` ; import de couverture via artefact.

## attest-docker
`IMAGE_NAME` + `DIGEST` (requis), `PROVENANCE`, `SBOM`, `SIGN` (tous false par défaut). Incompatible avec `PUSH: false`, pas de matrice. `attest-helm` fait de même pour les charts OCI (`CHARTS` = sortie `published-charts` de `release-helm`).
