---
type: référence
title: Versionner, documenter, publier et signer un chart
description: Cycle de publication d'un chart - version vs appVersion, helm-docs, OCI ghcr.io/Harbor, signatures GPG et cosign, vérification.
tags: [helm, publication, oci, cosign, gpg]
---

# Publication et signature

## Versionner
`version` (chart) ≠ `appVersion` (application). Dans un dépôt de charts dédié, **bump manuel** avant merge sur `main`, sinon la release échoue sur version dupliquée (tobi).
Dans un dépôt applicatif, `update-helm-chart` bumpe automatiquement (voir [cicd/release-et-charts.md](../cicd/release-et-charts.md)).

## Documenter
`README.md.gotmpl` + commentaires `# --` dans `values.yaml` → helm-docs. `lint-helm` (`LINT_DOCS`) vérifie que le README est à jour.

## Publier
- **Dépôt tobi** : chart-releaser (`ci/configs/cr.yaml` : `sign: true`, `skip-existing: true`) → GitHub Pages + `helm push` vers `ghcr.io/this-is-tobi/helm-charts/<chart>`.
- **Application (ocr-api)** : `release-helm-local` → `oci://ghcr.io/<owner>/<repo>/<nom du chart>` (le nom vient de `Chart.yaml`, ici `ocr`).
- **CPiN** : le pipeline DSO fait `helm dependency update`, `helm package` puis `helm push … oci://${IMAGE_REPOSITORY}` (Harbor), sur `tags`, `main`, `dev`.

## Signer et vérifier
- `.tgz` : GPG (`helm verify`, `helm install --verify`).
- OCI : cosign keyless OIDC, vérifié par `cosign verify --certificate-identity-regexp … --certificate-oidc-issuer https://token.actions.githubusercontent.com`.
- Côté fabnum-cicd : `release-helm` (`SIGN_CHART`, GPG) et `attest-helm` (cosign + provenance).
- Côté CPiN : signature d'images cosign avec vérification possible par politique Kyverno `verifyImages`.
