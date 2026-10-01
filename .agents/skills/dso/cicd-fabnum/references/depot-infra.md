# Dépôt d'infra séparé

Organisation recommandée par la Service Team (skill `deploiement-cpin`, phase 0) : le **dépôt applicatif**
porte le code, le Dockerfile et `.gitlab-ci-dso.yml` ; le **dépôt d'infra privé** porte le chart et les
`values-<env>.yaml`. Les deux sont déclarés dans la console.

Le dépôt applicatif ne touche jamais le chart : à chaque release, il envoie la version au dépôt d'infra
(`dispatch-helm-chart`). Le dépôt d'infra ouvre alors sa propre PR de bump (`update-helm-chart` en
`RUN_MODE: called`).

```
dépôt applicatif                          dépôt d'infra (privé)
release → sync-cpin (image DSO → Harbor)
        → dispatch-helm-chart ──────────► update-app-version.yml → PR « appVersion X »
                                          CI : check-cpin-rules sur la PR
                                          merge (humain) → CD : sync-cpin → ArgoCD
```

Sources : `dnum-mi/fabnum-cicd`, `docs/workflows/54-dispatch-helm-chart.md` et `53-update-helm-chart.md` (`@v0`).

## Côté dépôt applicatif : `cd.yml`

Partir de [`cd.yml`](cd.yml), **retirer** `bump-chart`, `release-chart` et `lint-helm`/`check-cpin-rules` de la CI
(il n'y a plus de chart ici). Retirer aussi `bump-chart` des `needs` de `sync-cpin` et de
`sync-prerelease-branch`. Ajouter :

```yaml
  # Rien n'est fait sur ce dépôt : tout passe par le token App vers CHART_REPO.
  dispatch-chart:
    uses: dnum-mi/fabnum-cicd/.github/workflows/dispatch-helm-chart.yml@v0
    needs: [release, sync-cpin]
    if: ${{ needs.release.outputs.release-created == 'true' }}
    permissions: {}
    with:
      CHART_REPO: <org>/<app>-infra
      CHART_DIR: charts
      CHART_NAME: <app>
      APP_VERSION: ${{ needs.release.outputs.version }}
      # La merge attend que le pipeline DSO ait poussé l'image dans Harbor (voir Pièges).
      AUTOMERGE_PRERELEASE: false
      AUTOMERGE_RELEASE: false
    secrets:
      # L'App doit être installée sur le dépôt d'infra, pas seulement sur celui-ci.
      APP_CLIENT_ID: ${{ secrets.APP_CLIENT_ID }}
      APP_PRIVATE_KEY: ${{ secrets.APP_PRIVATE_KEY }}
```

`sync-cpin` reste dans ce dépôt : c'est lui qui déclenche le pipeline DSO qui construit l'image.

## Côté dépôt d'infra

### `.github/workflows/update-app-version.yml` : reçoit le dispatch

Le nom par défaut attendu par `dispatch-helm-chart` est `update-app-version.yml` (sinon passer `WORKFLOW_NAME`).
Il doit déclarer **tous** les inputs du contrat : un input en trop côté appelant fait rejeter le dispatch (422).

```yaml
name: Update app version

on:
  workflow_dispatch:
    inputs:
      RUN_MODE: { required: false, default: called }
      APP_VERSION: { required: false }
      CHART_NAME: { required: true }
      CHART_DIR: { required: false, default: charts }
      UPGRADE_TYPE: { required: false, default: auto }
      PRERELEASE_IDENTIFIER: { required: false, default: rc }
      AUTOMERGE_PRERELEASE: { required: false, default: "false" }
      AUTOMERGE_RELEASE: { required: false, default: "false" }
      AUTOMERGE_METHOD: { required: false, default: auto }

jobs:
  update-chart:
    uses: dnum-mi/fabnum-cicd/.github/workflows/update-helm-chart.yml@v0
    permissions:
      contents: write
      pull-requests: write
    with:
      RUN_MODE: called
      CHART_NAME: ${{ inputs.CHART_NAME }}
      CHART_DIR: ${{ inputs.CHART_DIR }}
      APP_VERSION: ${{ inputs.APP_VERSION }}
      UPGRADE_TYPE: ${{ inputs.UPGRADE_TYPE }}
      PRERELEASE_IDENTIFIER: ${{ inputs.PRERELEASE_IDENTIFIER }}
      AUTOMERGE_PRERELEASE: ${{ inputs.AUTOMERGE_PRERELEASE == 'true' }}
      AUTOMERGE_RELEASE: ${{ inputs.AUTOMERGE_RELEASE == 'true' }}
      AUTOMERGE_METHOD: ${{ inputs.AUTOMERGE_METHOD }}
    # App : une PR ouverte avec GITHUB_TOKEN ne déclenche pas la CI ci-dessous.
    secrets:
      APP_CLIENT_ID: ${{ secrets.APP_CLIENT_ID }}
      APP_PRIVATE_KEY: ${{ secrets.APP_PRIVATE_KEY }}
```

### `.github/workflows/ci.yml` : porte sur chaque PR (bump compris)

Copier `scripts/check-cpin-rules.py` du skill `helm-chart-cpin` dans `ci/scripts/`. Un job par environnement
déclaré, avec **les fichiers values et l'ordre déclarés dans la console** (skill `deploiement-cpin`, phase 2) :

```yaml
name: CI

on:
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check-cpin-rules:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    strategy:
      matrix:
        env: [dev]   # un élément par environnement créé dans la console
    steps:
    - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1  # v7.0.1
    - uses: azure/setup-helm@9bc31f4ebc9c6b171d7bfbaa5d006ae7abdb4310  # v5.0.1
    - uses: astral-sh/setup-uv@c18668ad3cf93ea998bef934396af7bb5c839dc7  # v10.2.0
    - name: Rendre et vérifier
      run: |-
        helm template <app> charts/<app> \
          -f charts/<app>/values.yaml -f charts/<app>/values-cpin.yaml -f charts/<app>/values-${{ matrix.env }}.yaml \
          | uv run --with pyyaml ci/scripts/check-cpin-rules.py \
              --quota-cpu <quota> --quota-memory <quota avec unité> --app-port <port> --require-ingress
```

Rendre ce job obligatoire (ruleset de `main`).

### `.github/workflows/cd.yml` : synchro après merge

```yaml
name: CD

on:
  push:
    branches: [main]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false

jobs:
  sync-cpin:
    uses: dnum-mi/fabnum-cicd/.github/workflows/sync-cpin.yml@v0
    permissions: {}
    with:
      GITLAB_URL: ${{ vars.GITLAB_URL }}
      GIT_MIRROR_PROJECT_ID: ${{ vars.GITLAB_MIRROR_ID }}
      # Nom du dépôt d'infra tel que déclaré dans la console, pas celui du dépôt applicatif.
      REPOSITORY_NAME: ${{ vars.GITLAB_PROJECT_NAME }}
      BRANCH_TO_SYNC: ${{ github.ref_name }}
    secrets:
      GIT_MIRROR_TOKEN: ${{ secrets.GITLAB_TRIGGER_TOKEN }}
```

Pas de `release-app` ni de publication OCI : ArgoCD lit le chart directement dans ce dépôt (via son mirror).

## Secrets, variables et App

| Où | Nom | Remarque |
|----|-----|----------|
| les deux dépôts | `APP_CLIENT_ID`, `APP_PRIVATE_KEY` | une seule App, **installée sur les deux dépôts** |
| les deux dépôts | `GITLAB_TRIGGER_TOKEN`, `GITLAB_URL`, `GITLAB_MIRROR_ID` | mêmes valeurs (niveau projet console) |
| chaque dépôt | `GITLAB_PROJECT_NAME` | le nom **de ce dépôt** dans la console |
| console | accès au dépôt d'infra privé | informations d'accès saisies dans le formulaire du dépôt (phase 1 de `deploiement-cpin`) |

L'humain crée ces valeurs ; l'agent ne vérifie que les noms (`gh secret list -R <org>/<app>-infra`, `gh variable list -R …`).

## Pièges

1. **Image absente de Harbor** : `sync-cpin` ne fait que déclencher le pipeline DSO, qui construit l'image
   de façon asynchrone. Merger le bump avant la fin de ce pipeline fait déployer un tag inexistant
   (`ImagePullBackOff`). D'où `AUTOMERGE_*: false` : l'humain merge quand le pipeline DSO est vert.
2. **Tag figé** : si `image.tag` est renseigné dans les values, le bump d'`appVersion` ne change pas
   l'image. Le laisser vide (repli sur `appVersion`), sauf pour épingler un environnement (skill `helm-chart-cpin`).
3. **App non installée sur le dépôt d'infra** : le token App est émis pour `CHART_REPO` seulement ; le dispatch échoue.
4. **Branche par défaut ≠ `main`** : passer `BASE_BRANCH`, sinon le dispatch échoue sur `defaultBranchRef`.
5. **Dispatch asynchrone** : le job applicatif est vert dès que le dispatch est accepté ; vérifier le run
   `update-app-version` côté infra (`gh run list -R <org>/<app>-infra`).
6. **`GITLAB_PROJECT_NAME` recopié du dépôt applicatif** : la synchro du dépôt d'infra resynchronise
   l'applicatif, et ArgoCD ne voit jamais le bump.
