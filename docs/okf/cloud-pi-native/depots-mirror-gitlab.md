---
type: référence
title: Dépôts, mirror et GitLab interne
description: Dépôts externes/internes, types applicatif et infra, pipeline mirror et son déclenchement, fichier gitlab-ci-dso, variables prédéfinies, réconciliation par la console.
tags: [cpin, gitlab, mirror, dépôts, gitlab-ci-dso]
---

# Dépôts, mirror et GitLab interne

## Modèle
- **Dépôt externe** (GitHub, GitLab.com…, public ou privé, accessible depuis Internet) où l'équipe travaille ; **dépôt interne** = copie dans le GitLab de la plateforme.
- Le flux de synchronisation **part du GitLab interne** : le projet `mirror` tire les dépôts externes ; il est déclenché par une API (bouton « Lancer la synchronisation » ou commande curl des secrets du projet).
- La console crée un groupe `<ORG>/<PROJET>`, les dépôts déclarés et `mirror`.

## Types de dépôts
- **Applicatif** : code + `gitlab-ci-dso.yml` à la racine (le nom `.gitlab-ci-dso.yml` est utilisé dans ocr-api ; la doc CPiN écrit `gitlab-ci-dso.yml`). Analysé, construit, image scannée puis poussée dans Harbor.
- **Infra** (case à cocher) : manifests, Helm ou Kustomize ; crée automatiquement l'application ArgoCD.

## Déclencher la synchronisation
```
POST https://<gitlab>/api/v4/projects/<GIT_MIRROR_PROJECT_ID>/trigger/pipeline
  token=<GIT_MIRROR_TOKEN> ref=main
  variables[GIT_BRANCH_DEPLOY]=<branche> variables[PROJECT_NAME]=<nom du dépôt>
```
C'est ce que fait le workflow `sync-cpin` de fabnum-cicd. Manuellement : dépôt `mirror` → Build > Pipelines > Run pipeline avec `PROJECT_NAME` et `GIT_BRANCH_DEPLOY`.

## Variables prédéfinies (CI DSO)
Proxy (`http_proxy`, `https_proxy`, `NO_PROXY`…), `MVN_CONFIG_FILE`, `NPM_FILE`, `NEXUS_HOST_URL`, `REGISTRY_URL`, `SONAR_HOST_URL`, `VAULT_SERVER_URL`, `VAULT_AUTH_PATH`, `VAULT_AUTH_ROLE`, `CATALOG_PATH`.
Templates : `include: project: $CATALOG_PATH file: vault-ci.yml|kaniko-ci.yml|helm-ci.yml ref: main` ; jobs `.vault:read_secret`, `.kaniko:build`, `.kaniko:simple-build-push`, `.node:sonar`, `.java:build`.
L'étape `read_secret` est **obligatoire** pour construire.

## Réconciliation par la console
À chaque (re)provisionnement : recrée les dépôts techniques (`system-managed` : `mirror`, `infra-apps`, observabilité), met à jour les dépôts déclarés (`plugin-managed`),
**supprime** les `plugin-managed` non déclarés. Toujours créer/modifier/supprimer les dépôts **par la console**. Un dépôt manuel sans marqueur n'est pas touché mais n'est pas intégré aux chaînes.
