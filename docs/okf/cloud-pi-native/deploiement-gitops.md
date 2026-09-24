---
type: référence
title: Déploiement GitOps avec ArgoCD
description: Principe GitOps de CPiN, configuration ArgoCD pilotée par la console (révision, chemin, values-<env>), fonctionnalité Déploiements beta et règle du tag d'image.
tags: [cpin, gitops, argocd, helm, values]
---

# Déploiement GitOps

## Principe
Le dépôt d'infra est la **source de vérité** ; ArgoCD met le namespace en conformité. Formats : manifests, Kustomize, Helm.
Pour redéployer : nouveau tag d'image → dépôt d'infra mis à jour → synchro → ArgoCD applique.
**Si le tag n'est pas modifié, aucun diff, aucun redéploiement.** Automatisation conseillée : tag = `CI_COMMIT_SHORT_SHA`, mise à jour automatique des values/kustomize, trigger depuis la chaîne primaire.

## Ce qui se règle dans la console (pas dans l'UI ArgoCD)
Révision (branche/tag), chemin (défaut `.`), fichiers de values. Un placeholder `<env>` dans le chemin ou le nom est remplacé par le nom de l'environnement (`values-<env>.yaml`).
Les modifications faites dans l'interface ArgoCD sont **ignorées**. Autres sources que le GitLab CPiN : exceptionnel, par les administrateurs après validation.

## Fonctionnalité « Déploiements » (beta, console ≥ 9.25.0)
- Associe **un** environnement à un ou plusieurs dépôts d'infra, avec révision, chemin et **sources de values** ordonnées par dépôt.
- Sources : *interne* (fichier du dépôt déployé) ou *externe* (fichier d'un autre dépôt du projet, une seule par dépôt, `ref` unique). **La dernière source gagne.** Sans source : `values.yaml`.
- Cas d'usage : multi-branches (integration = `develop`, staging = `release`, prod = tag/commit), multi-dépôts (manifests communs + chart + config).
- **Attention** : dès qu'un déploiement existe, il devient l'unique source de configuration ; la config des dépôts d'infra est écrasée pour cet environnement et les autres environnements ne sont plus régénérés. Reporter toute la config existante avant de créer le premier déploiement, et en créer un par environnement.
- Droits : « Voir les déploiements » / « Gérer les déploiements » à activer dans les rôles projet.

## Repérage ArgoCD
Plusieurs entrées : **ArgoCD DSO** (à utiliser en priorité) et éventuellement une instance par zone. Voir [environnements-quotas.md](environnements-quotas.md) pour les applications générées.
