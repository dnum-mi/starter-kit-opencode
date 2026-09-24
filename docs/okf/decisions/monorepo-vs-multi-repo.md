---
type: décision
title: Monorepo ou plusieurs dépôts
description: Ce que le choix change pour la CI (path-filter, matrice), la release (version unique) et le chart (un chart pour plusieurs services).
tags: [décision, monorepo, path-filter, matrice]
---

# Monorepo ou multi-repo

## Monorepo (patron ocr-api : api, worker, frontend + un chart)
- **path-filter** → matrice `services` dynamique (build/scan seulement ce qui a changé) ; garde `!= '[]'`.
- **Une version** release-please pour tout le dépôt ; `extra-files` liste les manifestes à bumper (`pyproject.toml`, `package.json`…).
- **Un chart** déployant tous les composants ; `release-helm-local`.
- Une paire build/attest par composant (pas de matrice pour l'attestation).
- Gate `all-jobs-passed` indispensable, car des jobs seront `skipped`.

## Multi-repo
- Une CI/CD et une release par dépôt ; chart soit dans chaque dépôt, soit dans un dépôt de charts (`dispatch-helm-chart`).
- Plus simple à lire, plus de secrets/droits à répliquer (une App installée sur chaque dépôt).

## Côté CPiN
Un projet peut avoir plusieurs dépôts applicatifs et plusieurs dépôts d'infra (Helm et Kustomize côte à côte) dans un même namespace.
Le monorepo n'impose donc rien : la console voit des dépôts, pas une structure.
