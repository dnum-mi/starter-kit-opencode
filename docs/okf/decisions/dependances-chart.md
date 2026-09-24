---
type: décision
title: Dépendances d'un chart - embarquer, opérer ou externaliser
description: Choisir entre sous-chart embarqué (postgres, redis, s3), opérateur (CloudNativePG) et service externe, avec l'exemple ocr-api et les contraintes CPiN.
tags: [décision, helm, dépendances, cnpg, postgres]
---

# Dépendances d'un chart

## Option A — sous-chart embarqué (`dependencies` + `condition`)
ocr-api : `redis`, `postgres`, `rustfs` (charts **CloudPirates**, OCI `registry-1.docker.io/cloudpirates`) et `cluster` alias `cnpg` (CloudNativePG), chacun avec `alias` et `condition: <alias>.enabled`.
Avantage : un seul `helm install`. Limite : cycle de vie de la base lié à celui de l'application.
La FAQ CPiN accepte le pattern (exemple avec le chart Bitnami postgresql).

## Option B — opérateur / chart utilitaire
`cnpg-cluster` (tobi) ou le chart `cluster` de CNPG ; `enabled: false` par défaut chez ocr-api. Préférable pour du clustering/backup sérieux.
La FAQ CPiN recommande Helm ou un opérateur pour les déploiements « complexes ».

## Option C — service externe / géré
Le chart n'expose que la connexion (`DATABASE_URL` via `secretKeyRef`), la ressource est fournie ailleurs.

## Contraintes CPiN à vérifier
- Registre autorisé de la dépendance (docker.io/bitnami/ghcr.io… voir Kyverno `restrict-image-registry`).
- PVC < 1 Ti, `resources` requests+limits, probes, labels — s'appliquent aussi aux composants embarqués.
- Les quotas du namespace comptent la somme des `limits` de **tous** les pods, dépendances comprises.
- `helm dependency update` est exécuté par le pipeline DSO avant `helm package`.
