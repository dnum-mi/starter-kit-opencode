---
type: modèle conceptuel
title: Modèle mental code → image → chart → environnement
description: Vue d'ensemble des quatre artefacts d'un projet sur Cloud Pi Native et de l'acteur qui produit chacun (GitHub Actions, GitLab DSO, ArgoCD).
tags: [principes, architecture, gitops, cpin]
---

# Modèle mental : code → image → chart → environnement

Tout projet déployé sur Cloud Pi Native (CPiN) transforme un **commit** en **pods** par quatre artefacts successifs.
Comprendre qui produit quoi évite la plupart des erreurs de diagnostic.

| Artefact | Produit par | Stocké dans | Décrit par |
|---|---|---|---|
| Code versionné | l'équipe | dépôt **externe** (GitHub) | Conventional Commits |
| Image de conteneur | GitHub Actions (`build-docker`) **et/ou** GitLab DSO (Kaniko) | ghcr.io et/ou Harbor | `Dockerfile` (rootless) |
| Chart Helm | l'équipe, packagé par CI | OCI (ghcr.io, Harbor) ou dépôt d'infra | `Chart.yaml`, `values*.yaml` |
| Environnement | ArgoCD, piloté par la console DSO | namespace K8s/OpenShift | dépôt d'**infra** + `values-<env>.yaml` |

## Deux chaînes

CPiN sépare une **chaîne primaire** et une **chaîne secondaire** (`agreement/introduction.md`, cloud-pi-native/documentation) :

- **Primaire** : le socle d'intégration à la main des développeurs (GitHub, tests, lint, releases). L'équipe choisit ses outils.
- **Secondaire** : la chaîne étatique DSO. Elle **recompile** le code, analyse (Sonar, Trivy), signe et pousse dans Harbor, puis ArgoCD déploie.
  Elle contribue à l'homologation continue.

Le pont entre les deux est une **synchronisation** : la chaîne primaire déclenche le pipeline `mirror` du GitLab interne
(workflow `sync-cpin` de fabnum-cicd). Le flux part toujours du GitLab interne vers l'externe, jamais l'inverse.

## Conséquences pratiques

- Une image poussée sur ghcr.io **n'est pas** ce que CPiN déploie : la référence, c'est l'image reconstruite et signée dans Harbor par la chaîne secondaire.
  Voir [decisions/ghcr-vs-harbor.md](../decisions/ghcr-vs-harbor.md).
- Un changement sans **nouveau tag d'image** ne redéploie rien : ArgoCD ne voit aucun diff (`services/gitops.md`).
- La console est la source de vérité de la configuration de déploiement ; modifier l'application ArgoCD dans son interface est ignoré.

Voir le déroulé complet dans [cycle-de-vie/de-commit-a-environnement.md](../cycle-de-vie/de-commit-a-environnement.md).
