---
type: référence de processus
title: Intégration continue (CI sur pull request)
description: Composition type d'un ci.yml fabnum-cicd - filtres de chemins, variables partagées, lint, scans, build par matrice et gate unique.
tags: [cycle-de-vie, ci, github-actions, trivy]
---

# Intégration continue

Patron observé dans `ocr-api/.github/workflows/ci.yml`. Il s'applique à tout projet.

## Déclencheurs et concurrence
`pull_request` (opened, reopened, synchronize, ready_for_review) + `workflow_dispatch` ; `concurrency` par workflow+ref avec `cancel-in-progress: true`
(en CI on annule les runs obsolètes, contrairement au CD).

## Briques, dans l'ordre logique
1. **path-filter** (dorny/paths-filter) : détecte serveur/client/sdk/helm/ci et construit une **matrice `services` JSON** ; un changement dans `.github/workflows/**` reconstruit tout.
2. **expose-vars** : centralise `IMAGE_BASE=ghcr.io/${GITHUB_REPOSITORY,,}` (minuscules, obligatoire pour ghcr) et `IMAGE_TAG=pr-<N>`.
3. **Contrôles statiques** : `lint-commits`, `scan-gitleaks`, `scan-trivy` en mode config (`PATH`), `lint-helm` (docs et charts), lint/tests applicatifs locaux.
4. **build-docker** en matrice, gardé par `if: services != '[]'` (une matrice vide est une erreur). `IMAGE_TARGET` obligatoire si le dernier stage du Dockerfile est `test`.
5. **scan-trivy** des images en matrice (`FORMAT: sarif`, `GITHUB_SECURITY_TAB: true`, `CATEGORY` distinct par service, `TIMEOUT: 20m`).
6. **all-jobs-passed** : `if: always()`, échoue si un `needs` n'est ni `success` ni `skipped`. **C'est le seul check requis** de la protection de branche.

## Règles à retenir
- Toute nouvelle étape doit être ajoutée aux `needs` de la gate.
- Permissions : `scan-gitleaks` et `scan-trivy` exigent `security-events: write` et `pull-requests: write` côté appelant, même si l'onglet Security et les commentaires sont désactivés.
- Les booléens passés depuis `env`/outputs sont des chaînes : comparer avec `== 'true'`.
- `CACHE_MODE: min` si les couches sont lourdes (le cache GitHub est plafonné à 10 Go).
- ocr-api n'exécute pas `test-helm` (install dans kind) dans son CI, seulement `lint-helm` ; `test-helm` reste disponible dans fabnum-cicd si on veut tester l'installation.
