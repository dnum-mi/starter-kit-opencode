---
type: décision
title: Épingler les workflows et actions
description: Choisir entre @v0 flottant, @v0.X et SHA pour fabnum-cicd et les actions tierces, et le conflit avec la règle AGENTS.md sur @main.
tags: [décision, versions, supply-chain, fabnum-cicd]
---

# Épingler les versions

| Cible | Recommandation | Raison |
|---|---|---|
| `fabnum-cicd` | `@v0` (usage d'ocr-api) ; `@v0.20` ou un SHA pour plus de stabilité | dépôt en `0.x` : un **bump mineur peut casser** et `@v0` suit `v0.20.x` puis suivants |
| Actions tierces dans ses propres workflows | SHA + commentaire de version, maintenu par Renovate | fabnum-cicd le fait pour toutes ses actions |
| `@main` / `@master` | **interdit** | règle `AGENTS.md` (« Never pin GitHub Actions to `@master` or `@main` ») |

Tags publiés par `release-app` (`TAG_MAJOR_AND_MINOR: true`) : `vX.Y.Z`, `vX.Y` et `vX` flottants.
Voir [constats.md](../constats.md) : le skill `ci-cd` actuel dit `@main`, à corriger.
