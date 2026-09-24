---
type: référence
title: Anatomie d'un chart (template tobi et ocr-api)
description: Fichiers d'un chart, structure de values.yaml, templates par composant, helpers et labels - et ce qu'il faut ajouter pour CPiN.
tags: [helm, chart, template, values]
---

# Anatomie d'un chart

Sources : `this-is-tobi/helm-charts/template/`, `IA-Generative/ocr-api/helm/`.

## Fichiers
| Fichier | Rôle |
|---|---|
| `Chart.yaml` | `apiVersion: v2`, `name`, `type: application`, `version` (chart), `appVersion`, `kubeVersion: ">=1.25.0-0"`, `dependencies` |
| `values.yaml` | contrat de configuration, commenté au format helm-docs |
| `values.schema.json` | schéma de validation |
| `README.md.gotmpl` → `README.md` | doc générée par helm-docs |
| `test-values*.yaml` | jeux de values pour `ct install` (`-daemonset`, `-statefulset` dans le template) |
| `templates/` | un dossier par composant + fichiers transverses |

## Clés de premier niveau de `values.yaml` (template)
`enabled`, `nameOverride`, `fullnameOverride`, `commonLabels`, `global`, `gateway`, `<servicename>` (le composant), `jobs`, `cronjobs`, `extraObjects`.

## Templates d'un composant
Workload (`deployment`, `statefulset`, `daemonset`), réseau (`service`, `ingress`, `httproute`, `grpcroute`, `networkpolicy`),
config (`configmap`, `secret`, `pullsecret`), échelle (`hpa`, `pdb`), RBAC (`serviceaccount`, `role`, `rolebinding`, `clusterrole`, `clusterrolebinding`), métriques (`servicemonitor`, `metrics`).
Transverses : `jobs.yaml`, `cronjobs.yaml`, `gateway.yaml`, `ingress.yaml`, `httproute.yaml`, `pullsecret.yaml`, `extra-objects.yaml`, `validation.yaml`, `_helpers.tpl`, `NOTES.txt`.
Helpers : `helper.fullname`, `helper.image`, `helper.component.podTemplate`, `helper.component.validate`.

## Labels
Labels standards `app.kubernetes.io/*` (`name`, `instance`, `component`, `version`, `managed-by`, `part-of`) + `commonLabels`.
Le template **n'ajoute pas** `app`, `env`, `tier` ni `criticality`/`component` au sens MIOM : à fournir par `commonLabels` ou `podLabels` pour respecter Kyverno `check-labels`
(voir [cloud-pi-native/contraintes-runtime.md](../cloud-pi-native/contraintes-runtime.md)).

## Créer un chart depuis le template
1. Copier `template/` vers `charts/<nom>`, remplacer `chartname` par le nom.
2. Renommer `templates/servicename/` et `servicename` dans les templates et les values ; répéter pour chaque composant supplémentaire (copie du dossier + bloc de values).
3. Un script existe (`this-is-tobi/tools`, `shell/helm-template.sh`, options `-c`, `-s`, `-a`) — non vérifié ici.
