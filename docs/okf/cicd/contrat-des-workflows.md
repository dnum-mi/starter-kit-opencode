---
type: référence
title: Contrat commun des workflows fabnum-cicd
description: Conventions d'inputs, secrets, outputs et permissions communes, et pièges de passage de booléens, de matrices et de runners.
tags: [cicd, contrat, permissions, inputs]
---

# Contrat commun

- **Inputs** en `UPPER_CASE`. Tous les workflows acceptent `RUNS_ON`, une **chaîne JSON** (défaut `'["ubuntu-24.04"]'`).
- **Secrets** listés nommément, jamais `secrets: inherit`. Groupes courants : `APP_CLIENT_ID`+`APP_PRIVATE_KEY` (à fournir ensemble), `GH_PAT`, `REGISTRY_USERNAME`/`REGISTRY_PASSWORD`.
- **Permissions** : le job appelant doit accorder l'union de ce que les jobs appelés déclarent, sinon le run échoue avant de démarrer.

| Workflow | Permissions minimales côté appelant |
|---|---|
| `lint-*`, `test-helm` | `contents: read` |
| `build-docker` | `packages: write`, `contents: read` |
| `attest-docker` | `packages: write`, `id-token: write`, `attestations: write` |
| `scan-trivy` | `contents: read`, `security-events: write`, `packages: read`, `pull-requests: write` |
| `scan-gitleaks` | `security-events: write`, `contents: read`, `pull-requests: write` |
| `release-app` | `contents`, `issues`, `pull-requests`: `write` |
| `update-helm-chart` | `contents: write`, `pull-requests: write` |
| `release-helm-local` | `contents: read`, `packages: write` |
| `release-helm` | `contents: write`, `packages: write` |
| `clean-images` | `packages: write` |
| `clean-cache` | `actions: write` |
| `sync-cpin` | `{}` |

## Pièges de forme
- Les valeurs issues d'`env` ou d'outputs sont des **chaînes** : `${{ x == 'true' }}` pour un input booléen.
- Une matrice vide (`fromJSON('[]')`) est une erreur : garder avec `if: … != '[]'`.
- `needs.<job>.outputs.<x>` d'un job en matrice s'effondre en **une seule valeur** : pas de matrice pour `attest-*`.
- Un secret ne peut pas être passé en `with:` : les URLs et identifiants non sensibles vont dans des `vars.`.
- Le nom d'image doit être en **minuscules** (`${GITHUB_REPOSITORY,,}`) ; `scan-trivy` et `clean-images` ne le normalisent pas.
