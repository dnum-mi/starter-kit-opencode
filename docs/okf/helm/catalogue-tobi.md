---
type: catalogue
title: Catalogue des charts this-is-tobi
description: Les trois charts utilitaires publiés (backup-utils, cnpg-cluster, vso-utils), le template à copier et les modes de consommation.
tags: [helm, catalogue, tobi, vso, cnpg]
---

# Charts this-is-tobi/helm-charts

| Chart | Version lue | Usage |
|---|---|---|
| `backup-utils` | 2.5.4 | CronJobs de sauvegarde (postgres, mariadb, mongo, etcd, vault, qdrant, s3) vers S3 |
| `cnpg-cluster` | 2.3.0 | cluster CloudNativePG, pooler, sauvegardes |
| `vso-utils` | 2.0.0 | objets Vault Secrets Operator ; dépend du chart `vault-secrets-operator` (alias `vso`, `condition: vso.enabled`) |

Chaque chart a `values.schema.json`, `README.md.gotmpl`, `test-values.yaml`, `templates/extra-objects.yaml`.

## Consommer un chart
- **Dépendance** (`Chart.yaml`) : `repository: "oci://ghcr.io/this-is-tobi/helm-charts"` (recommandé) ou `https://this-is-tobi.github.io/helm-charts`, puis `helm dependency update`.
- **ArgoCD** : `repoURL: ghcr.io/this-is-tobi/helm-charts`, `chart`, `targetRevision`, `helm.releaseName`.
- **Installation directe** : `helm install <release> oci://ghcr.io/this-is-tobi/helm-charts/<chart> --version <v>`.

Ces versions changent : relire `charts/*/Chart.yaml` avant usage.
`template/` n'est pas un chart publié : c'est un squelette à copier (voir [anatomie-chart.md](anatomie-chart.md)).
