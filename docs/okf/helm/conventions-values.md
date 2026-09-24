---
type: référence
title: Conventions de values
description: Comment configurer un chart de la famille tobi/ocr-api - global, env, envCm, envSecret, extraObjects, enabled, images et probes.
tags: [helm, values, conventions]
---

# Conventions de values

- **`enabled: false`** au niveau du chart ne rend rien (garde l'application ArgoCD sans ressources).
- **`global`** : `envFrom`, `env`, `envCm`, `envSecret`, `imageRegistry`, `imagePullSecrets`, `ingress`, `httpRoute` — appliqué à tous les composants.
- **Variables d'environnement** : `env` accepte une **map ou une liste**, avec `valueFrom` ; `envCm`/`envSecret` sont des maps rendues en ConfigMap/Secret générés.
  Exemple ocr-api : `DATABASE_URL` depuis `secretKeyRef ocr-postgres/uri`.
- **`extraObjects`** : n'importe quel manifeste (VaultStaticSecret, SopsSecret, CRD).
- **Image** : `image.registry`, `repository`, `tag` (vide par défaut ; l’image est surchargée par environnement dans ocr-api).
- **Type de workload** : `deploymentType: Deployment | StatefulSet`.
- **Service** : ClusterIP par défaut ; **ne pas utiliser NodePort** (Kyverno `restrict-nodeport`).
- **Exposition** : `ingress`, `httpRoute`, `grpcRoute` désactivés par défaut ; l'API Gateway est prise en charge.
- **Probes** : startup/readiness/liveness (ocr-api : `/api/health`, `failureThreshold: 60` sur startup).
- **Ressources** : requests **et** limits (ocr-api : 1Gi/125m → 2Gi/500m).
- **Optionnels off par défaut** : `autoscaling`, `pdb`, `networkPolicy.create`.
- **Jobs/hooks** : job de migration en hook Helm (`post-install`, `post-upgrade`, `before-hook-creation,hook-succeeded`).
- **Écriture** : `readOnlyRootFilesystem: true` + `emptyDir` sur `/tmp`, `/app/.cache`, `/app/.tmp`.
- **Un fichier par environnement** : `values-<env>.yaml` (CPiN remplace le placeholder `<env>` par le nom de l'environnement).
