---
type: principes
title: Philosophie des charts Helm (this-is-tobi)
description: Principes de conception des charts - un chart par application, values comme contrat, composants activables, échappatoire extraObjects, publication signée.
tags: [principes, helm, charts, template]
---

# Philosophie des charts Helm

Sources : `this-is-tobi/helm-charts` (README, `template/`, `charts/*`) et `IA-Generative/ocr-api/helm`.

## 1. Le chart est un contrat de `values`
Le chart ne code pas un déploiement : il expose des `values` documentés (helm-docs, `values.schema.json`) que l'appelant surcharge par environnement.
Le schéma JSON valide ce contrat (`lint-helm-schema` dans fabnum-cicd).

## 2. Composants activables, sortie vide possible
Chaque composant (api, frontend, worker…) est un bloc de `values` avec son jeu complet de templates
(workload, service, ingress/httproute, configmap, secret, hpa, pdb, networkpolicy, RBAC, servicemonitor).
`enabled: false` ne rend **rien** — utile pour garder une application ArgoCD enregistrée sans déployer.

## 3. `global` partagé, surcharge locale
Le bloc `global` (`env`, `envFrom`, `envCm`, `envSecret`, `imageRegistry`, `imagePullSecrets`, `ingress`, `httpRoute`) s'applique à tous les composants ; chaque composant peut préciser.

## 4. Échappatoire : `extraObjects`
Tout ce que le chart ne modélise pas (Secret synchronisé par Vault, SopsSecret, CRD) passe par `extraObjects` plutôt que par un fork du chart.

## 5. Le `template/` est un squelette à copier
Dans le dépôt tobi, `template/` est un **point de départ** : `ocr-api` l'a copié, renommé (`chartname` → `ocr`) et étendu.
Il n'est pas consommé comme dépendance. Les 3 charts publiés (`backup-utils`, `cnpg-cluster`, `vso-utils`) sont des **utilitaires** (sauvegarde, base CNPG, objets Vault Secrets Operator)
que l'on peut, eux, déclarer en `dependencies`.

## 6. Sécurité par défaut
`runAsNonRoot`, `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, `readOnlyRootFilesystem: true`, `seccompProfile: RuntimeDefault`, avec des `emptyDir` pour les chemins inscriptibles.
Sur OpenShift, ne pas figer `runAsUser`/`fsGroup`. Voir [helm/securite-et-openshift.md](../helm/securite-et-openshift.md).

## 7. Publication reproductible et vérifiable
Versionner (`version` du chart, distincte d'`appVersion`), régénérer le README (helm-docs), publier en **OCI**, signer (GPG pour `.tgz`, cosign keyless pour OCI).
Voir [helm/publication-et-signature.md](../helm/publication-et-signature.md).
