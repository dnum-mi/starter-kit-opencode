# Workflows fabnum-cicd : quand et avec quelles permissions

Appel : `uses: dnum-mi/fabnum-cicd/.github/workflows/<nom>.yml@v0`. Entrées en `UPPER_CASE`, `RUNS_ON` (chaîne JSON) accepté partout.

| Workflow | Quand l'utiliser | Permissions à accorder |
|----------|------------------|------------------------|
| `lint-commits` | vérifier les Conventional Commits d'une PR | `contents: read`, `pull-requests: read` |
| `lint-helm` | lint des charts et doc helm-docs ; requiert `CT_CONF_PATH` | `contents: read` |
| `lint-helm-schema` | valider les values contre un JSON Schema | `contents: read` |
| `lint-yaml` | yamllint | `contents: read` |
| `test-helm` | `ct install` dans Kind | `contents: read` |
| `test-docker` | exécuter une commande dans une image | `contents: read`, `packages: read` |
| `build-docker` | build multi-arch, push optionnel ; sorties `digest`, `image` | `packages: write`, `contents: read` |
| `attest-docker` | provenance SLSA, SBOM, cosign ; incompatible `PUSH: false` | `packages: write`, `id-token: write`, `attestations: write` |
| `attest-helm` | signature des charts OCI publiés | idem |
| `scan-trivy` | image (`IMAGE`), config (`PATH`) ou tarball | `contents: read`, `security-events: write`, `pull-requests: write`, `packages: read` |
| `scan-gitleaks` | secrets dans l'historique | `contents: read`, `security-events: write`, `pull-requests: write` |
| `scan-sonarqube` | qualité du code ; requiert `SONAR_URL` | `contents: read`, `issues: write`, `pull-requests: write` |
| `release-app` | release-please ; sorties `release-created`, `version` | `contents: write`, `issues: write`, `pull-requests: write` |
| `update-helm-chart` | bump de `Chart.yaml` ; `RUN_MODE: local` (commit direct) ou `called` (PR) ; sortie `commit-sha` | `contents: write`, `pull-requests: write` |
| `release-helm-local` | publier le chart d'un monorepo en OCI | `contents: read`, `packages: write` |
| `release-helm` | dépôt de charts dédié (chart-releaser, GPG) | `contents: write`, `packages: write` |
| `dispatch-helm-chart` | déclencher la mise à jour d'un chart dans un autre dépôt (App/PAT requis) | `{}` (le token App/PAT porte les droits) |
| `sync-prerelease-branch` | resynchroniser `dev` après une release sur `main` (dernier job) | `contents: write` |
| `sync-cpin` | déclencher le pipeline `mirror` du GitLab CPiN | `{}` |
| `clean-cache` | supprimer les caches d'une PR fermée | `actions: write` |
| `clean-images` | supprimer les images de PR fermées sur ghcr.io | `packages: write` |
| `release-npm` | publier un paquet npm | `contents: read`, `id-token: write` |

Ordre de résolution des credentials : token App → `GH_PAT` → `GITHUB_TOKEN`.
Vérifier les entrées exactes dans le `on: workflow_call` du fichier source avant usage : elles évoluent (dépôt en 0.x).
