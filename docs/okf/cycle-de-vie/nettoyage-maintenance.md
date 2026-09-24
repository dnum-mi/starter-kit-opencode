---
type: référence de processus
title: Nettoyage et maintenance
description: Suppression des caches et images de PR, orphelins ghcr.io, maintenance des pins par Renovate, hygiène CPiN (dépôts, quotas).
tags: [cycle-de-vie, maintenance, clean-images, renovate]
---

# Nettoyage et maintenance

## Côté GitHub
- `clean-cache` (`PR_NUMBER`, `BRANCH_NAME`) supprime les caches Actions d'une PR fermée.
- `clean-images` (`IMAGE`, `CLEAN_TAGGED`, `CLEAN_ORPHANED`, `PROTECTED_TAGS`) supprime les tags de PR sur ghcr.io. Il supprime **tout tag qu'on lui donne** : ne lui passer que des PR fermées.
  Les tags de forme version sont toujours protégés.
- Patron ocr-api : workflow **planifié** (01:00 UTC + dispatch, `LOOKBACK_DAYS` défaut 3) qui liste les PR récemment fermées avec `gh pr list`, plus un balayage d'orphelins
  (`CLEAN_TAGGED: false`, `CLEAN_ORPHANED: true`, `PROTECTED_TAGS: latest,main,dev,staging,preprod`).
  Choix d'un cron plutôt que `pull_request: closed` pour éviter une course avec le build de la PR.

## Pins et dépendances
Renovate est configuré dans fabnum-cicd (`renovate.json`) ; toutes les actions tierces y sont pinnées par SHA.
Le tag `@v0` de fabnum-cicd suit les bumps mineurs : voir [decisions/pinning-versions.md](../decisions/pinning-versions.md).

## Côté CPiN
- Créer/supprimer les dépôts **par la console** ; un reprovisionnement supprime les dépôts `plugin-managed` non déclarés.
- Les `Jobs` reçoivent un TTL et les CronJobs des limites d'historique (Kyverno `add-ttl`, `job-history`).
- Quotas Harbor et robots : par ticket à la Service Team.
