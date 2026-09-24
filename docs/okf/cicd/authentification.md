---
type: référence
title: Authentification des workflows
description: Ordre de résolution des credentials et effets pratiques ; le choix est détaillé dans la décision GitHub App vs PAT.
tags: [cicd, auth, github-app]
---

# Authentification

Résolution : **token App → `GH_PAT` → `GITHUB_TOKEN`**. Détails, matrice de choix et mise en place de l'App : [decisions/github-app-vs-pat.md](../decisions/github-app-vs-pat.md).

Utilisations concrètes dans `ocr-api` : l'App n'est passée qu'à `release`, `bump-chart` et `sync-cpin` ; `sync-cpin` reçoit en plus `GIT_MIRROR_TOKEN` (ici `secrets.GITLAB_TRIGGER_TOKEN`).
Pour un build Docker qui a besoin d'un credential, `BUILD_SECRET_GITHUB_TOKEN` prend `none` (défaut), `app`, `pat` ou `job-token` : le choix est explicite car la valeur est lisible par le Dockerfile.
