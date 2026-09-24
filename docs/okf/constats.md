---
type: constats
title: Constats et lacunes
description: Écarts entre cette doc et les skills existants ci-cd et deploiement, et limites de ce qui a pu être vérifié dans les sources.
tags: [constats, lacunes, skills]
---

# Constats et lacunes

## Écarts avec les skills actuels (non corrigés à ce stade)
- `ci-cd` dit d'épingler fabnum-cicd sur `@main`, alors que `AGENTS.md` l'interdit et que l'usage réel est `@v0` (voir [decisions/pinning-versions.md](decisions/pinning-versions.md)).
- `ci-cd` ne couvre que GitHub Actions : il ignore `sync-cpin`, release-please, la GitHub App, le flux `dev`/`main`, `sync-prerelease-branch`, `attest-*`, `scan-gitleaks`.
- Nom du fichier de pipeline : `deploiement` cite `.gitlab-ci-dso.yaml`, comme la page « Démarrer » de la doc CPiN ; la page « Gestionnaire de sources » écrit `gitlab-ci-dso.yml` et ocr-api utilise `.gitlab-ci-dso.yml`. Incohérence de la doc officielle, pas une erreur du skill : à vérifier sur l'instance.
- `deploiement` présente `this-is-tobi/helm-charts/template` comme référence : c'est un squelette à copier, pas une dépendance (les charts publiés sont des utilitaires).
- `README.md` : le bloc de structure omet `deploiement`.

## Lacunes de cette doc
- Dépôt de values par environnement (« mirai-values ») et configuration ArgoCD effective d'ocr-api : non consultés.
- Route vs Ingress, classe d'ingress, valeurs chiffrées de quotas, adresses de proxy : non documentés dans les sources lues.
- Compatibilité de version du VSO du cluster avec `vso-utils` 2.0.0 : non vérifiée.
- Spécification formelle du format OKF : absente ; format déduit des wikis OpenWiki existants.
- Sections « Disponible prochainement » de la doc CPiN (exploitabilité : logs, métriques, sauvegarde, PRA).
- Sources non lues en détail : `guide/rbac/*`, `guide/tutorials.md`, `installation/*`, `certification`, docs fabnum-cicd `10`–`14`, `20`–`24`, `31`, `40`, `55`, `56`.
- Les versions citées (chart, workflows, console) sont celles observées à la date de rédaction ; les relire à l'usage.
