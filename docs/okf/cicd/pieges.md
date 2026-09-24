---
type: pièges
title: Pièges fabnum-cicd
description: Liste consolidée des erreurs fréquentes des workflows réutilisables (tokens, permissions, matrices, images, prerelease, release).
tags: [cicd, pièges, gotchas]
---

# Pièges

1. **Minuscules** : `IA-Generative/…` est en casse mixte ; calculer `ghcr.io/${GITHUB_REPOSITORY,,}` une fois et le propager.
2. **`IMAGE_TARGET`** obligatoire si le dernier stage du Dockerfile est `test`.
3. **Matrice vide** = erreur : garder avec `!= '[]'`.
4. **`GITHUB_TOKEN`** ne déclenche pas la CI sur les PR de release : utiliser l'App. Jamais `secrets: inherit`.
5. **Permissions** : l'appelant doit accorder l'union (`security-events`, `pull-requests` même si non utilisés).
6. **Booléens** en chaîne ; **outputs de matrice** écrasés ; pas de matrice pour l'attestation.
7. **Prerelease en retard** : `release-app` échoue sur `dev` si `main` a des commits en plus ; toujours `sync-prerelease-branch` après un job qui committe sur `main`.
8. `release` est idempotent ; gater build/bump/chart sur `release-created == 'true'`.
9. **Trivy** : `TIMEOUT`, `CATEGORY` distinct, `FAIL_ON_ERROR` informatif par défaut.
10. `CACHE_MODE: min` pour respecter le budget 10 Go (couches lourdes).
11. Variables CPiN : dans ocr-api la variable est réellement nommée `GILTAB_PROJECT_NAME` (faute) ; `GITLAB_URL` est une `vars.`, pas un secret.
12. **Rulesets** exigeant une PR : seule l'App peut pousser le bump du chart ; la gate `all-jobs-passed` gère les checks requis des jobs filtrés.
13. **Releases immuables** : `draft: true`, `force-tag-creation: true`, `PUBLISH_DRAFT_RELEASE: true`.
14. Config locale des charts : `ci/configs/ct.yaml` (chart-dirs, target-branch, chart-repos).
