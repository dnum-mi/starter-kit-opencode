---
type: décision
title: Chart dans le monorepo applicatif ou dans un dépôt dédié
description: Choisir entre release-helm-local, release-helm (chart-releaser) et dispatch-helm-chart selon l'emplacement du chart.
tags: [décision, helm, release, monorepo]
---

# Chart dans le dépôt applicatif ou dépôt dédié ?

| Situation | Workflows | Publication |
|---|---|---|
| Chart **dans le dépôt applicatif** (ocr-api) | `update-helm-chart` (`RUN_MODE: local`) + `release-helm-local` | OCI uniquement, `oci://ghcr.io/<owner>/<repo>/<chart>` |
| Chart dans un **dépôt de charts dédié** | `release-helm` (chart-releaser) | dépôt Helm (GitHub Pages) et/ou OCI, signature GPG possible |
| Application dans un dépôt, chart dans un autre | `dispatch-helm-chart` côté app → `update-helm-chart` (`RUN_MODE: called`) côté charts | PR de bump ouverte dans le dépôt de charts |

## Repères
- En **monorepo**, l'espace de tags est partagé entre applications et chart : la détection automatique de chart-releaser est peu fiable, d'où `release-helm-local`
  (il package exactement `CHECKOUT_REF`). Guide : `90-monorepo-release.md`.
- Un **release-please unique** donne la même version aux images et au chart.
- `update-helm-chart` en `local` pousse directement (`git pull --rebase` puis push) ; en `called` il ouvre une PR vers `BASE_BRANCH`.
- Dispatch cross-repo : nécessite un token App ou PAT (`actions: write` sur le dépôt du chart).
