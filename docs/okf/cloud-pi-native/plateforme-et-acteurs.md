---
type: référence
title: Plateforme, console et acteurs
description: Composants de la plateforme CPiN, rôle de la console et de ses plugins, organisations, projets, zones, clusters, rôles et IAM Keycloak.
tags: [cpin, plateforme, console, iam, rôles]
---

# Plateforme, console et acteurs

Source : `platform/`, `administration/`, `guide/roles.md`, `guide/projects-management.md` (cloud-pi-native/documentation).

## Composants
| Service | Rôle | Obligatoire |
|---|---|---|
| ArgoCD | déploiement GitOps | oui |
| Harbor / Trivy | registre d'images / scan | oui |
| GitLab | code + CI/CD | oui |
| Kubernetes (OpenShift) | ressources | oui |
| Nexus | artefacts (instance par projet obligatoire, usage libre) | oui |
| SonarQube | qualité de code | oui |
| Vault | secrets (chaîne) | oui |
Observabilité : Prometheus, Loki, Grafana, AlertManager (voir [exploitation-observabilite.md](exploitation-observabilite.md)).

## Console DSO
Application web « cerveau » : elle crée projets, membres, environnements, dépôts, et provisionne les services. Architecture **core/plugins** : chaque plugin
(keycloak, vault, harbor, argocd, gitlab…) s'abonne aux hooks du cycle de vie (création de projet, d'environnement, de dépôt, ajout de membre). Configuration de plugin
au niveau global (Administration/Plugins) ou projet (« Mes services »).

## Hiérarchie
- **Organisation** = ministère (label + nom technique en minuscules, < 10 caractères, sans caractères spéciaux) ; un projet appartient à une seule organisation.
- **Projet** = espace cloisonné pour **une** application : équipe, dépôts, environnements.
- **Zone** = datacenter : *Usuelle* (sensibilité moindre) ou *Restreinte* (plus contraignant côté flux). Sur OVH : « Zone Défaut ».
- **Cluster** = ensemble de nœuds (Kubernetes, OpenShift, Rancher…) piloté par la console (elle n'installe pas de cluster) ; public (partagé) ou dédié.
- **Type d'environnement** = dev/staging/integration/prod, lié à des quotas et à des clusters.

## Rôles et IAM
- Auth OIDC via **Keycloak** ; jeton API `x-dso-token` pour l'usage non interactif ; autorisation calculée côté serveur (bitmasks), permissions **cumulées** entre rôles.
- Groupes Keycloak maintenus par la console : `/<projectSlug>/console/…/<environnement>/RO|RW`.
- Rôles **plateforme** (scope console) et rôles **projet** (par défaut « Tout le monde » : reprovisionner, voir environnements, voir dépôts).
  Permissions projet : gérer le projet, les rôles, les membres, afficher les secrets, reprovisionner, gérer/voir environnements, dépôts (et déploiements en beta).
- Correspondance GitLab par défaut : `/console/admin` → Administrateur ; `/console/readonly` → Auditeur ; `…/console/admin` → Maintainer ; `devops` et `developer` → Developer ; `readonly` → Reporter ; propriétaire → Owner.
- **Changement cassant** : les rôles sont provisionnés de manière **autoritaire** dans GitLab ; les membres non tracés par la console sont supprimés, les modifications manuelles écrasées.
- La création/suppression d'utilisateurs se fait dans Keycloak.

## Éligibilité et accompagnement
Prérequis techniques : Linux, stateless, config par environnement, rootless, FS en lecture seule ; organisationnels : compte Keycloak, PAT `repo` si dépôt privé.
Accompagnement par la **Service Team** (ticketing et Mattermost) : aider sans faire à la place. Voir [exploitation-observabilite.md](exploitation-observabilite.md).
