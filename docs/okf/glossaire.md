---
type: glossaire
title: Glossaire CI/CD, Helm et CPiN
description: Termes et sigles utilisés dans la doc - DSO, CPiN, mirror, dépôt d'infra, appVersion, rc, SCC, VSO, Kyverno, chaîne primaire/secondaire.
tags: [glossaire, cpin, helm, cicd]
---

# Glossaire

| Terme | Définition |
|---|---|
| **CPiN / Cloud π Native** | Offre PaaS DevSecOps interministérielle du ministère de l'Intérieur |
| **DSO** | DevSecOps : nom courant de la plateforme et de sa console |
| **Console (DSO)** | Application web qui provisionne projets, dépôts, environnements, ArgoCD, rôles (architecture core/plugins) |
| **Chaîne primaire / secondaire** | Outils de l'équipe / chaîne étatique qui reconstruit, audite et déploie |
| **Dépôt externe / interne** | Dépôt de travail de l'équipe / copie dans le GitLab de la plateforme |
| **mirror** | Dépôt technique du GitLab interne dont la pipeline synchronise les dépôts externes |
| **Dépôt applicatif / d'infra** | Code à construire / manifests, Helm ou Kustomize à déployer |
| **PAX** | Plateforme d'accompagnement hors réseaux interministériels, pour les premiers tests |
| **Service Team** | Équipe d'accompagnement (aide, ne fait pas à la place) |
| **MIOM** | Ministère de l'Intérieur et des Outre-mer (labels et politiques) |
| **Kaniko** | Constructeur d'images sans démon utilisé par la CI DSO |
| **Harbor** | Registre d'images, scan Trivy, signatures |
| **ArgoCD** | Outil GitOps de déploiement |
| **Kyverno** | Moteur de politiques (AUDIT / ENFORCE) |
| **SCC (restricted-v2)** | Contrainte de sécurité OpenShift : UID alloué par namespace |
| **VSO** | Vault Secrets Operator (`VaultStaticSecret`, `VaultAuth`…) |
| **SOPS / age** | Chiffrement de secrets dans Git / clé publique du cluster |
| **CNPG** | CloudNativePG, opérateur PostgreSQL |
| **appVersion / version (chart)** | Version de l'application / version du chart Helm |
| **rc** | Release candidate (`-rc.N`), produite sur la branche de prerelease |
| **release-please** | Automatisation des releases à partir de Conventional Commits |
| **Gate `all-jobs-passed`** | Job de synthèse servant de check requis unique |
| **App GitHub** | Identité applicative produisant des tokens courts et réduits |
| **helm-docs** | Génère le README d'un chart à partir des values commentées |
| **OCI (chart)** | Chart stocké dans un registre de conteneurs (`oci://…`) |
