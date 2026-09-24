---
type: référence de processus
title: Livraison continue (CD)
description: Graphe de jobs d'un cd.yml fabnum-cicd - release, build d'images, bump et publication du chart, synchro CPiN, resynchronisation de la prerelease.
tags: [cycle-de-vie, cd, release-please, sync-cpin]
---

# Livraison continue

Patron de `ocr-api/.github/workflows/cd.yml` et de `fabnum-cicd/docs/workflows/90-monorepo-release.md`.

## Déclencheur et concurrence
`push` sur `dev`/`main` (+ `workflow_dispatch`), `cancel-in-progress: false` : on met en file, on n'annule **jamais** une release.

## Graphe
```
release (release-app)
 ├─ build-docker (matrice services)            si release-created == 'true'
 │    └─ attest-docker (une paire par composant, pas de matrice)   [option]
 ├─ bump-chart (update-helm-chart, RUN_MODE=local)
 │    ├─ sync-cpin
 │    └─ release-chart (release-helm-local, CHECKOUT_REF = commit du bump)
 └─ sync-prerelease-branch (uniquement main, needs = jobs qui committent sur main)
```

## Points d'attention
- **Secrets** passés nommément : `APP_CLIENT_ID`/`APP_PRIVATE_KEY` à `release`, `bump-chart` et `sync-cpin` uniquement.
- `release-chart` package **exactement** le commit de bump (`CHECKOUT_REF`) pour que le chart publié corresponde au dépôt.
- `sync-cpin` a `permissions: {}` ; l'URL GitLab est une **variable** (`vars.`), pas un secret, car un secret ne peut pas être passé en `with:`.
- `sync-prerelease-branch` liste dans `needs` **tous** les jobs qui poussent sur `main`, mais pas `build-docker`.
- Attestation : pas de matrice (`needs.<job>.outputs` s'effondre en une seule valeur) ; une paire build/attest par composant.
- Un CD relancé sur le commit de bump ne trouve rien à publier et s'arrête à `release` (boucle évitée).
