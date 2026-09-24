---
type: principes
title: Philosophie de Cloud Pi Native
description: Ce que la plateforme attend des applications et pourquoi - autonomie des équipes, chaîne secondaire, GitOps, conformité auditée, Build it You run it.
tags: [principes, cpin, gitops, kyverno]
---

# Philosophie de Cloud Pi Native

Source : documentation officielle (`cloud-pi-native/documentation`, site cloud-pi-native.fr), sections `agreement/`, `platform/`, `guide/`, `services/`.

## Offre et doctrine
Cloud π Native est une plateforme DevSecOps open source du ministère de l'Intérieur (offre interministérielle, implémentation du produit Hexaforge),
dans la doctrine « Cloud au centre ». Bénéficiaires : administrations et leurs ESN. Elle s'appuie sur des standards (Kubernetes, GitOps) pour rester **sécable**
et permettre le transfert vers d'autres hébergeurs Kubernetes.

## Principes directeurs
1. **Autonomie amont, contrôle aval** : les équipes utilisent leurs outils (GitHub, GitLab.com…) en développement ; la chaîne secondaire de l'État reconstruit et audite.
2. **Build it, You run it** : la Service Team *aide et fait monter en compétences*, mais **ne fait pas à la place**. Exploitation et MCO/MCS restent à l'équipe projet.
3. **Application cloud-native** : 12-factor, stateless, config par variables d'environnement (même image pour tous les environnements), logs stdout (GELF/JSON), ports > 1024.
4. **Conteneurs contraints** : rootless, système de fichiers en lecture seule, UID aléatoire (OpenShift).
5. **Tout est code** : Dockerfiles dans le dépôt, déploiement par Helm/Kustomize/manifests, dépôt d'infra = source de vérité (GitOps).
6. **Conformité par politique** : Kyverno applique des règles (AUDIT en dev/preprod, ENFORCE en prod).
7. **Provenance maîtrisée** : les images sont construites par la chaîne DSO (ou viennent d'un registre public reconnu), signées ; on ne `docker push` pas depuis un poste.
8. **La console pilote** : création de projets, dépôts, environnements, quotas, ArgoCD, rôles ; elle est la source de vérité et réconcilie (elle supprime ce qu'elle ne connaît pas).

## Ce que cela implique pour un projet
Vérifier l'éligibilité (`platform/compatibility.md`) avant tout : Linux, stateless, config par environnement, rootless, FS en lecture seule.
Voir [cloud-pi-native/contraintes-runtime.md](../cloud-pi-native/contraintes-runtime.md).
