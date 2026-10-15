# Règle Renovate — suivre `fabnum-cicd` par PR

Les `uses:` sont épinglés sur un tag exact. Sans Renovate, le projet resterait figé ; avec cette
règle, chaque release de `fabnum-cicd` arrive comme **une seule PR** qui monte tous les appels
ensemble — relue, avec le changelog sous les yeux.

## Règle à fusionner dans `packageRules`

```json
{
  "description": "Workflows réutilisables fabnum-cicd : un seul tag pour tous les appels, montée groupée.",
  "matchManagers": ["github-actions"],
  "matchDepTypes": ["workflow"],
  "matchDepNames": ["dnum-mi/fabnum-cicd"],
  "groupName": "fabnum-cicd",
  "pinDigests": false
}
```

- Le gestionnaire `github-actions` de Renovate reconnaît un `uses:` de niveau job pointant sur
  `owner/repo/.github/workflows/<fichier>@<ref>` et lui donne le `depType` `workflow`.
  (Vérifié dans la documentation du gestionnaire le 2026-09-21 ; tout autre `uses:` garde le
  `depType` `action`.)
- `groupName` garantit l'invariant vérifié en fin de skill : le même tag partout.
- `pinDigests: false` garde le tag lisible même si le projet étend
  `helpers:pinGitHubActionDigests` pour ses actions.

## Fusion, pas remplacement

- `renovate.json`, `renovate.json5`, `.github/renovate.json`, `.renovaterc*` ou clé `renovate` de
  `package.json` : si l'un existe, **ajouter** l'entrée à son `packageRules` sans toucher au reste.
- S'il n'existe rien, créer `renovate.json` minimal :

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": []
}
```

- Si une règle existante désactive déjà `dnum-mi/fabnum-cicd` ou le gestionnaire
  `github-actions`, ne pas la contourner : le signaler et laisser l'humain décider.

## Tant que le dépôt amont est en `0.x`

Une version mineure peut changer un défaut sans marqueur *breaking*. Ne pas proposer
d'`automerge` sur ce groupe ; rappeler dans le rapport que la PR Renovate se relit avec le
`CHANGELOG.md` de `fabnum-cicd`.

## Variante : épinglage par SHA

Pour un projet qui l'exige, retirer `pinDigests: false` : Renovate réécrit alors
`@<sha> # vX.Y.Z`. C'est une décision du projet, pas le défaut de cette skill.

## Côté dépôt de déploiement (hors périmètre d'écriture de la skill)

La skill ne modifie pas le dépôt qui déploie l'image. Elle **propose** dans le rapport la règle à y
poser, pour que chaque release arrive comme une PR de montée de version relue par l'exploitant :

```json
{
  "description": "Images des produits publiées par leur CI : une PR par montée, jamais d'automerge.",
  "matchDatasources": ["docker"],
  "matchPackageNames": ["ghcr.io/<org>/<image>"],
  "automerge": false
}
```

Le gestionnaire `kustomize` de Renovate lit `images: [{name, newName, newTag}]` ; le gestionnaire
`helm-values` lit `image.repository` / `image.tag`. Un tag écrit ailleurs (script, variable) n'est
pas vu : le signaler. L'image doit être **lisible par Renovate** (paquet public, ou jeton
`read:packages` fourni à Renovate via `hostRules`).
