# Composer les pipelines — règles par fonction

Les règles ci-dessous nomment des **fonctions**, pas des fichiers. Pour chaque fonction, chercher
dans le catalogue lu au tag résolu le workflow qui la remplit, et prendre son chemin, ses inputs,
ses secrets et ses permissions dans ce qui a été lu. Une fonction sans workflow correspondant à ce
tag est **omise et signalée**, jamais remplacée par une action tierce choisie de mémoire. Seule
exception : le job de synthèse, qui est un job local fourni plus bas.

Adapter au projet un exemple de la documentation lue est attendu. Ce qui est exclu : recopier le
**contenu** d'un workflow de `fabnum-cicd` dans le projet au lieu de l'appeler.

## Détections préalables (à rapporter AVANT de composer)

Trois situations rendent le pipeline trompeur si on les ignore. Les chercher dans le projet cible
et les inscrire en tête du plan, avec la conséquence :

| Détection | Où regarder | Conséquence à écrire dans le plan |
|---|---|---|
| **Configuration d'environnement figée dans l'image** | `ARG` / `ENV` d'un Dockerfile portant une URL, un domaine, un identifiant SSO/OIDC, un realm (`*_URL`, `*_AUTHORITY`, `*_CLIENT_ID`, `*_REALM`, `*_DOMAIN`, `VITE_*`, `NUXT_PUBLIC_*`), surtout avec un rendu statique (`nuxt generate`, `vite build`) | l'image publiée ne vaut que pour UN environnement ; tant que la configuration n'est pas lue à l'exécution (fichier de config servi, substitution au démarrage), la release produit une image « générique » inutilisable telle quelle. Ne pas passer ces valeurs en `BUILD_ARGS`. |
| **Un workflow existant publie déjà** | `on: push: tags`, `docker/build-push-action`, `docker push`, `ghcr.io` dans `.github/workflows/` | release-please crée des tags `vX.Y.Z` : un workflow déclenché sur `tags: v*` publierait **en double** (souvent avec `latest`). Proposer de retirer ou désactiver l'ancien au moment de la bascule — ne jamais le laisser coexister en silence. |
| **Branche par défaut déjà rouge** | dernier run CI de la branche par défaut (`gh run list -b <défaut> -L 3`), ou lancer la commande de test fournie par l'humain | le premier pipeline sera rouge pour des raisons étrangères à la PR ; le dire, et proposer de rendre le job de test obligatoire seulement après réparation. |

## Choix à faire trancher par l'humain (dans le plan du `--check`)

Ne pas les deviner : les poser, avec le défaut proposé. `--setup` reprend les réponses données
dans la conversation ; une réponse absente = le défaut ci-dessous, rappelé dans le rapport.

| Choix | Défaut proposé |
|---|---|
| fichier cible déjà présent : fusion ou nom voisin | **nom voisin** (`ci-cpin.yml`, `cd-cpin.yml`) — jamais de fusion sans accord explicite |
| registre et nom de l'image | `ghcr.io/<owner>/<repo>` ; **poser la question** : si la plateforme reconstruit l'image depuis le miroir, le push côté GitHub est peut-être superflu |
| architectures de l'image | celle(s) réellement déployée(s). En pull request : **amd64 seul** suffit souvent (voir « Multi-architecture ») |
| seuil de blocage des scans | image : `CRITICAL` bloquant ; configuration : rapport **non bloquant** tant que le dépôt n'a pas eu sa passe de durcissement (voir « Scans ») |
| profil | générique ; ou **MirAI next** (voir la section du même nom) |
| tags d'image supplémentaires (`latest`, majeur/mineur, SHA court) | aucun |
| analyse qualité, tests dans l'image, automerge | non |
| attestation de l'image (provenance, SBOM, signature) | **oui** — c'est ce qui permet à l'exploitant de vérifier ce qu'il déploie |
| flux de pré-release | oui seulement si la branche de pré-release existe déjà sur le remote |
| synchronisation Cloud Pi Native | oui |

## Fichiers produits dans le projet cible

| Fichier | Rôle |
|---|---|
| `.github/workflows/ci.yml` | pipeline de pull request |
| `.github/workflows/cd.yml` | pipeline de release |
| config + manifeste release-please | voir plus bas |
| `renovate.json` (ou équivalent existant) | voir `renovate.md` |
| `.yamllint` | seulement si le lint YAML est retenu et qu'aucune config yamllint n'existe : la config par défaut (80 colonnes, `document-start`) rend rouge presque tout manifeste Kubernetes existant — écrire `extends: default` + `line-length: {max: 120}` + `document-start: disable` + `comments: {min-spaces-from-content: 1}` + `braces: {max-spaces-inside: 1}`, et le dire |
| `ct.yaml` | seulement si des charts sont présents : requis par le lint et le test Helm (`CT_CONF_PATH`) ; contenu minimal d'après la fiche lue |

## Pipeline de pull request

| Fonction | Condition d'inclusion |
|---|---|
| lint des messages de commit | toujours |
| recherche de secrets dans l'historique | toujours |
| lint YAML | si le dépôt contient du YAML hors workflows (charts, manifests, compose) |
| build de l'image **sans push** | un job par Dockerfile détecté |
| scan de vulnérabilités de l'image construite | pour chaque build, sur l'artefact produit |
| scan de configuration / système de fichiers | toujours |
| exécution des tests dans l'image | seulement si l'humain fournit la commande de test |
| lint et test d'installation des charts | si des charts Helm sont présents |
| analyse qualité | seulement si l'humain confirme disposer d'une instance et d'un projet |
| job de synthèse servant de *required status check* | toujours, en dernier |

- Déclencheur : `pull_request` vers la branche de release (et de pré-release s'il y en a une),
  **sans filtre `paths:`** — un *required check* qui ne démarre pas bloque la PR.
- `concurrency` indexée sur la PR, avec annulation des runs en cours.
- Un scan « sur l'artefact produit » : un build multi-architecture produit un artefact par
  architecture ; suivre la fiche pour leur nom et scanner chacun de ceux qui sont déployés.
- **Scans** : toujours passer `SEVERITY` et `FAIL_ON_ERROR` **explicitement** — le défaut du scan de
  vulnérabilités est de ne **jamais** bloquer (`FAIL_ON_ERROR: false`), un scan qui « passe » ne
  prouve alors rien. Passer aussi le numéro de PR aux workflows qui commentent (`PR_NUMBER`) :
  sans lui, un scan en échec bloque la PR **sans rien expliquer au contributeur**. Expression à
  utiliser, qui laisse le champ vide sur une PR venue d'un fork (voir « PR depuis un fork ») :
  `${{ github.event.pull_request.head.repo.full_name == github.repository && github.event.pull_request.number || '' }}`
- **Multi-architecture** : `PUSH: false` + `USE_QEMU: true` + amd64 **et** arm64 échoue d'emblée
  (l'exporteur ne sait pas écrire un tarball multi-plateforme). En PR : une seule architecture,
  ou runners natifs (`USE_QEMU: false`). Un artefact par architecture
  (`<artifact-prefix>-amd64`, `-arm64`) → un appel de scan par architecture, chacun avec sa
  `CATEGORY`.
- Un workflow appelé deux fois dans le même pipeline (ex. deux scans) : vérifier dans sa fiche
  qu'un input distingue les deux appels (catégorie, en-tête de commentaire) ; sinon le signaler.

Pipeline écrit sous un nom voisin d'un workflow existant : lui donner un `name:` distinct, et
signaler que le job de synthèse ne couvre pas les jobs de l'autre fichier — tant que les deux
coexistent, les deux checks sont à déclarer obligatoires, ou les fichiers à fusionner.

Job de synthèse — job **local**, à écrire tel quel en listant tous les jobs dans `needs:` :

```yaml
  all-jobs-passed:
    name: All jobs passed
    if: ${{ always() }}
    needs: [<tous les jobs du pipeline>]
    runs-on: ubuntu-24.04
    permissions: {}
    steps:
    - name: Vérifier le résultat des jobs
      env:
        NEEDS: ${{ toJson(needs) }}
      run: |
        echo "$NEEDS" | jq -e 'all(.[]; .result == "success" or .result == "skipped")'
```

## Pipeline de release

Fonctions, dans l'ordre :

1. **release applicative** (release-please) — produit « release créée » et la version ;
2. **build et push de l'image**, conditionné à « release créée », tag = version ;
3. **attestation de l'image** — par défaut oui. ⚠ Le workflow d'attestation a (au moins jusqu'à
   v0.19.3) **toutes ses options à `false`** : un appel sans `PROVENANCE: true`, `SBOM: true`,
   `SIGN: true` réussit en n'attestant rien. Les passer explicitement, et donner dans le rapport
   la commande de vérification : `gh attestation verify oci://<image>@<digest> --owner <org>
   --signer-repo dnum-mi/fabnum-cicd` (le signataire est le workflow réutilisable, pas le
   dépôt : sans `--signer-repo` la vérification échoue) ;
4. **mise à jour de la version du chart** — si un chart vit dans le dépôt ;
5. **synchronisation du miroir Cloud Pi Native** — conditionnée à « release créée » ;
6. **resynchronisation de la branche de pré-release** — seulement avec un flux de pré-release,
   placée en dernier.

- `needs:` et `if:` : **la fiche du workflow fait foi** quand elle les prescrit (c'est le cas de
  la resynchronisation, dont le `needs:` est défini précisément par sa fiche). À défaut : chaque
  fonction attend la dernière fonction **retenue** avant elle, plus tout job dont elle lit un
  output — la synchronisation attend donc le succès du build.
- Une fonction non retenue est **omise**, pas livrée en commentaire : un `uses:` commenté n'est
  pas monté par Renovate et diverge. Elle est citée dans le rapport comme ajout possible.
- Déclencheur : `push` sur la branche de release (et de pré-release le cas échéant).
  `concurrency` indexée sur la branche, **sans** annulation des runs en cours.
- Monorepo (plusieurs applications, ou chart aux côtés du code) : partir du guide monorepo lu au
  tag, en remplaçant chaque `uses: ./.github/workflows/<x>.yml` par la référence distante.

## Fichiers release-please

- Noms de fichiers et structure : ceux de la fiche du workflow de release lue au tag.
- `release-type` : d'après le marqueur de langage du projet (`package.json`, `pyproject.toml`,
  `go.mod`…) ; à défaut, `simple`.
- Version du manifeste : le dernier tag `vX.Y.Z` du projet ; à défaut la version du fichier de
  paquet ; à défaut `0.0.0`. Dire laquelle a été prise.
- Sans flux de pré-release : ne pas écrire les fichiers ni les clés propres aux pré-releases.
  Avec : écrire aussi la paire de fichiers de pré-release que décrit la fiche. Si la branche de
  pré-release n'existe pas encore, le signaler et dire ce que la fiche prévoit dans ce cas.
- Une configuration release-please déjà présente est **conservée** ; seul un écart bloquant avec
  ce qu'attend le workflow est signalé.

## Règles d'écriture

- **Référence** : `uses: dnum-mi/fabnum-cicd/.github/workflows/<fichier>@<tag exact>`, le même tag
  partout. Jamais `@main`, jamais de tag mobile.
- **Permissions** : `permissions: {}` au niveau du workflow. Par job appelant : l'**union** des
  `permissions:` déclarées par les jobs du workflow appelé (le YAML fait foi sur la fiche et sur
  les exemples). GitHub valide tous les jobs appelés, même ceux qu'un input désactive.
- **Inputs** : renseigner les requis, ceux dont le défaut ne convient pas au projet, et ceux que
  les **notes** de la fiche rendent nécessaires de fait même s'ils sont `required: false`. Chaque
  écart au défaut est justifié en une ligne dans le plan.
- **Secrets** : câblés un par un dans `secrets:`. Pas de `secrets: inherit` — il donnerait à un
  workflow tiers tous les secrets du dépôt.
- **Noms** des variables et secrets du projet : `vars.<NOM_DE_L_INPUT>` pour un input,
  `secrets.<NOM_DU_SECRET>` tel que déclaré dans le `workflow_call`. Aucune valeur littérale pour
  l'URL GitLab, l'ID du projet miroir, le nom du dépôt miroir ou le token.
- **Credential** : `GITHUB_TOKEN` par défaut. Ne câbler une GitHub App ou un PAT que si une
  fonction retenue l'exige d'après la doc d'authentification lue ; dire dans le rapport ce que le
  défaut implique. En particulier : si la doc lue indique qu'une PR ouverte avec `GITHUB_TOKEN`
  ne déclenche pas la CI, un *required status check* **bloquera la PR de release** — proposer
  alors une App ou un PAT, ou ne pas recommander le check obligatoire. Ne pas poser les deux.
- **Pas d'interpolation `${{ }}` dans un `run:`** : passer par `env:` — y compris si un exemple
  de la documentation lue fait autrement.
- Toute action tierce ajoutée hors `fabnum-cicd` est épinglée par SHA avec la version en commentaire.

## PR depuis un fork

Un contributeur externe travaille par fork. Sur une PR venue d'un fork, GitHub donne un jeton en
**lecture seule** et **aucun secret** ; les permissions `write` demandées sont rabaissées. En
conséquence :

- le build de PR doit rester `PUSH: false` (il l'est déjà) ;
- les commentaires de PR et l'envoi SARIF échouent → neutraliser `PR_NUMBER` pour les forks
  (expression de la section « Scans ») et ne pas activer l'onglet Security dans ce pipeline ;
- aucun input ne doit dépendre d'un secret dans le pipeline de PR ;
- prérequis humain à lister : *Settings > Actions > « Require approval for all outside
  collaborators »* (un mainteneur approuve le premier run d'un fork).

Ce comportement n'a pas encore été observé sur un vrai fork avec cette skill : le dire dans le
rapport tant que ce n'est pas le cas.

## Profil « MirAI next »

Pour les produits de la plateforme MirAI next (`IA-Generative/*`), en plus de ce qui précède :

| Point | Règle |
|---|---|
| registre et nom | `ghcr.io/ia-generative/<nom-de-l-image>` (nom en minuscules, un par Dockerfile) |
| synchronisation CPiN | **non** par défaut (produit bêta) ; oui seulement si l'humain dit que le produit vise la production Cloud Pi Native |
| architectures | amd64 (le cluster bêta est amd64) |
| credential de release | la GitHub App d'organisation prévue pour fabnum-cicd si elle est installée sur le dépôt (`APP_CLIENT_ID`/`APP_PRIVATE_KEY`), pour que la PR de release déclenche la CI ; sinon `GITHUB_TOKEN` et pas de check obligatoire |
| valeurs d'infrastructure | aucune dans l'image ni dans les workflows : pas d'URL SSO, de domaine, de namespace, de registre privé en `BUILD_ARGS` (détection « configuration figée ») |
| après la release | le dépôt de déploiement suit l'image par Renovate (voir `renovate.md`, « Côté dépôt de déploiement ») ; la skill ne touche pas à ce dépôt |
| tirage par le cluster | un paquet ghcr hérite de la visibilité du dépôt : dépôt `internal`/`private` → le cluster a besoin d'un pull secret (jeton `read:packages` d'un compte de service) ; dépôt public → rendre le paquet public, aucun secret |
