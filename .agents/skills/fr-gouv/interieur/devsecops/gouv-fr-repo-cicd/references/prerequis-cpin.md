# Prérequis humains — ce que la skill ne fait pas

La skill écrit des fichiers. Tout ce qui suit reste à la main de l'équipe ; la liste rendue est
**adaptée au projet** (ne garder que les lignes utiles aux fonctions retenues) et ne contient
**aucune valeur réelle** — uniquement des noms et des `<placeholders>`.

## Côté dépôt GitHub

| À faire | Quand | Où |
|---|---|---|
| Créer les **variables** de dépôt attendues par la synchronisation CPiN (URL GitLab, ID du projet miroir, nom du dépôt) | si la synchronisation est retenue | *Settings > Secrets and variables > Actions > Variables* |
| Créer le **secret** du token de synchronisation | idem | *… > Secrets* |
| Choisir le credential : `GITHUB_TOKEN` (rien à créer), GitHub App (deux secrets) ou PAT (un secret) | selon le tableau de décision de la doc d'authentification lue | *… > Secrets* |
| Activer *Allow auto-merge* | seulement si l'automerge des PR de release est demandé | *Settings > General* |
| Déclarer le job de synthèse comme *required status check* | après le premier run vert | *Settings > Branches / Rulesets* |
| Créer la branche de pages | seulement si des charts sont publiés par le canal classique | voir la fiche du workflow |
| Activer Renovate sur le dépôt | si ce n'est pas déjà fait | application Renovate de l'organisation |
| Exiger l'approbation des runs venus d'un fork | toujours, si le dépôt accepte des contributions externes | *Settings > Actions > General > Fork pull request workflows* |
| Décider de la visibilité du paquet d'image | au premier push : il hérite de la visibilité du dépôt | *Packages > <image> > Package settings* |
| Donner au cluster un moyen de tirer l'image | si le paquet n'est pas public : jeton `read:packages` d'un **compte de service** (pas un jeton personnel), posé en pull secret | côté exploitation — hors dépôt |

Les noms exacts suivent la règle de `composition.md` : une variable porte le nom de l'input
qu'elle alimente, un secret le nom déclaré dans le `workflow_call` lu au tag résolu.

Le *required status check* et le credential se décident ensemble : avec `GITHUB_TOKEN` seul, la
PR de release ne déclenche pas la CI et resterait bloquée par un check obligatoire.

## Côté Cloud Pi Native

La synchronisation ne fait qu'une chose : déclencher, par *trigger token*, le pipeline du **dépôt
miroir** sur le GitLab de la plateforme. Doivent donc préexister, et ne sont **pas** générés :

- le projet créé dans la console Cloud Pi Native, avec son dépôt déclaré (source = le dépôt GitHub) ;
- le dépôt miroir GitLab correspondant, et son **ID de projet** ;
- un **trigger token** de pipeline sur ce miroir, stocké en secret GitHub ;
- côté plateforme : le pipeline du miroir, le registre d'images, le dépôt d'infrastructure et le
  déploiement. Leur configuration relève de la documentation Cloud Pi Native, pas de cette skill.

Si l'un de ces éléments manque, le pipeline de release reste utilisable : proposer de livrer le
job de synchronisation **conditionné à la présence de la variable** (`if:` sur `vars.<NOM>`
non vide), et le dire — pas en commentaire : un `uses:` commenté n'est pas monté par Renovate.

## Ce que le rapport doit toujours rappeler

- aucun secret n'a été créé, aucune variable n'a été posée ;
- rien n'a été poussé, aucune PR n'a été ouverte, aucun pipeline n'a été déclenché ;
- le premier run de release créera une PR de release : c'est attendu, pas une anomalie.
