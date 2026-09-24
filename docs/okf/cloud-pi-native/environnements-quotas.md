---
type: référence
title: Environnements et quotas
description: Ce qu'un environnement CPiN crée (namespace, pull secret, quotas, application ArgoCD), règles de quotas et synchronisation automatique.
tags: [cpin, environnements, quotas, namespace, argocd]
---

# Environnements et quotas

Un **environnement = un namespace** sur un cluster. Pour chaque environnement la console crée : le namespace, le pull secret Harbor du projet,
les quotas, et une application ArgoCD par dépôt d'infra.

- Le **type** (dev/staging/integration/prod) détermine les clusters accessibles et l'appartenance aux ressources **production** ou **hors production**.
- **Quotas** = CPU, RAM, GPU (0 si inutile), alignés sur la demande d'hébergement validée ; ils correspondent à la **somme des `resources.limits` de tous les pods** du namespace.
  Dimensionner les limits des charts (dépendances comprises) en conséquence.
- Consommation visible dans l'onglet ressources du projet.
- **Auto-sync** ArgoCD activé par défaut ; à désactiver au niveau de l'environnement en cas de dérive à traiter manuellement.
- Applications ArgoCD générées : `<proj>-<cluster>-<env>-root` (app-of-apps), `<proj>-<env>-<id>-env` (pull secret, quotas), `<proj>-<env>-<id>-<repo>-<id>` (le déploiement), `{prod|hprod}-<proj>-observability`.
