---
type: catalogue
title: Catalogue des workflows fabnum-cicd
description: Les 22 workflows réutilisables groupés par intention - quand les utiliser et leur rôle - avec renvoi vers la doc source.
tags: [cicd, fabnum-cicd, catalogue, workflows]
---

# Catalogue des workflows réutilisables

Source : `dnum-mi/fabnum-cicd`, `README.md` et `docs/workflows/NN-*.md`. Appel : `uses: dnum-mi/fabnum-cicd/.github/workflows/<nom>.yml@v0`.
Le dépôt contient 24 fichiers ; `ci.yml` et `cd.yml` sont ses propres pipelines, non réutilisables.

## Lint et validation
| Workflow | Rôle |
|---|---|
| `lint-commits` | Conventional Commits (config, types autorisés, scope obligatoire, longueur de sujet) |
| `lint-helm` | `chart-testing` (lint) et vérification de la doc helm-docs |
| `lint-helm-schema` | valide les values contre un JSON Schema (`check-jsonschema`) |
| `lint-yaml` | `yamllint` |

## Tests
| Workflow | Rôle |
|---|---|
| `test-helm` | installe les charts dans un cluster Kind (`ct install`) |
| `test-docker` | exécute une commande dans une image (registre ou tarball) |

## Build et supply-chain
| Workflow | Rôle |
|---|---|
| `build-docker` | build multi-arch (amd64/arm64) et push optionnel ; sorties `digest`, `image` |
| `attest-docker` | provenance SLSA, SBOM, signature cosign d'une image poussée |
| `attest-helm` | signature cosign et provenance des charts OCI publiés |

## Sécurité et qualité
| Workflow | Rôle |
|---|---|
| `scan-trivy` | images, config, filesystem ; SARIF, commentaire de PR |
| `scan-gitleaks` | secrets dans tout l'historique |
| `scan-sonarqube` | qualité du code |

## Release
| Workflow | Rôle |
|---|---|
| `release-app` | release-please (tags, changelog, prerelease rc, automerge optionnel) |
| `update-helm-chart` | bump de `Chart.yaml` (mode `local` ou `called`) + helm-docs |
| `release-helm-local` | publie un chart d'un monorepo applicatif (OCI) |
| `release-helm` | publie via chart-releaser (dépôt Helm et/ou OCI, signature GPG) |
| `dispatch-helm-chart` | déclenche la mise à jour d'un chart hébergé dans un autre dépôt |
| `release-npm` | publie un paquet npm |
| `sync-prerelease-branch` | resynchronise la branche de prerelease après une release |

## Utilitaires
| Workflow | Rôle |
|---|---|
| `clean-cache` | supprime les caches Actions d'une PR |
| `clean-images` | supprime les images de PR / orphelines sur ghcr.io |
| `sync-cpin` | déclenche la synchro vers le GitLab CPiN |

Guides : `01-introduction.md` (exemples de pipelines), `05-authentication.md`, `90-monorepo-release.md`.
