---
type: principes
title: Philosophie de fabnum-cicd
description: Les idées directrices des workflows GitHub Actions réutilisables de la Fabrique Numérique - composabilité, moindre privilège, supply-chain, idempotence.
tags: [principes, cicd, github-actions, fabnum-cicd]
---

# Philosophie de fabnum-cicd

Source : `dnum-mi/fabnum-cicd` (README, `docs/workflows/`). Le dépôt centralise des **workflows réutilisables** (`on: workflow_call`)
« pour maintenir la cohérence et la qualité du code dans tous les dépôts de la Fabrique Numérique ».

## 1. Composabilité plutôt que pipeline monolithe
22 workflows réutilisables, chacun avec **une seule responsabilité** (lint-commits, build-docker, scan-trivy, release-app…). Le projet appelant écrit son
propre `ci.yml` / `cd.yml` qui les assemble. Pas de composite actions : l'unité de réutilisation est le workflow entier
(`uses: dnum-mi/fabnum-cicd/.github/workflows/<nom>.yml@v0`).

## 2. Contrat explicite
Inputs en `UPPER_CASE`, valeurs par défaut sûres, outputs nommés. Les **permissions sont déclarées par l'appelant** :
un workflow appelé ne peut jamais dépasser ce que le job appelant lui accorde. Voir [cicd/contrat-des-workflows.md](../cicd/contrat-des-workflows.md).

## 3. Moindre privilège
- `permissions:` minimales par job ; jamais `secrets: inherit` (chaque secret est passé nommément).
- Ordre de résolution des credentials : **GitHub App → `GH_PAT` → `GITHUB_TOKEN`** ; on n'escalade que si nécessaire.
  Ajouter un credential n'enlève jamais une capacité. Voir [decisions/github-app-vs-pat.md](../decisions/github-app-vs-pat.md).
- Les tokens App sont **réduits par job** (`permission-*`), car un token non réduit hérite de toute l'installation.

## 4. Supply-chain
Actions tierces pinnées par SHA, attestations (provenance SLSA, SBOM, cosign), scans Trivy/Gitleaks, Renovate pour maintenir les pins.

## 5. Releases pilotées par les commits
Conventional Commits → release-please → version → images → chart. Une branche de prerelease (`dev`/`develop`, versions `-rc.N`)
et une branche stable (`main`). Voir [cycle-de-vie/branches-versions-releases.md](../cycle-de-vie/branches-versions-releases.md).

## 6. Idempotence et garde-fous
- `release` tourne à chaque push et ne fait rien s'il n'y a rien à publier ; les jobs suivants sont conditionnés à `release-created == 'true'`.
- Une **gate unique** (`all-jobs-passed`) sert de seul check requis, ce qui rend les jobs filtrés par chemin compatibles avec les règles de branche.
- Les échecs sont **explicites** : credentials incomplets, permissions insuffisantes ou branche de prerelease en retard font échouer le job avec un message,
  jamais un comportement dégradé silencieux.

## 7. Stabilité de version
Le dépôt est en `0.x` : un bump mineur peut casser. `@v0` est un tag flottant. Voir [decisions/pinning-versions.md](../decisions/pinning-versions.md).
