---
name: deploiement-cpin
description: Use when onboarding or deploying an application on Cloud Pi Native — DSO console (project, repositories, environments, quotas), mirror sync and tokens, .gitlab-ci-dso pipeline to Harbor, values files loaded by ArgoCD, Vault secrets, Kyverno rejections, and diagnosing a deployment that does not roll out (quota, wrong image, 404, 503)
allowed-tools: Bash Read Write
---

# Déployer sur Cloud Pi Native : runbook

Suivre les phases **dans l'ordre**. Chaque phase finit par une **porte** : ne pas passer à la suivante
tant qu'elle n'est pas franchie. Principe : **vérifier au PR, pas au déploiement**. Chaque aller-retour
« je déploie, je regarde, je corrige » coûte une release (vécu : 7 releases pour un hello world).

## Règles pour l'agent

- **Suivi visible, dès le départ, quel que soit l'agent** : avant toute autre action, `todowrite` avec six
  todos `Phase 0 — Éligibilité`, `Phase 1 — Console et jetons`, `Phase 2 — Valeurs vitales`,
  `Phase 3 — Chart et CI`, `Phase 4 — Livrer`, `Phase 5 — Vérifier` (c'est le panneau de droite
  d'OpenCode). Une seule `in_progress` ; passer à `completed` quand la porte est franchie, **avant** d'écrire
  la suite. Chaque message commence par `▶ Phase N/5 — <nom> · étape : <étape>`, puis : ce que je fais,
  pourquoi, ce que ça change (rien / ce qui est écrit et où), ce dont j'ai besoin de l'humain.
- **Ne jamais demander, lire, écrire ni afficher la valeur d'un token ou d'un secret.** L'humain les
  saisit dans la console CPiN, dans GitHub ou dans Vault ; l'agent vérifie seulement que le **nom** existe.
- **Ne jamais committer un secret/token dans Git** (même en « temporaire ») : un `github_pat_…` ou un token
  mirror (`glptt-…`) commité est un secret fuité à **révoquer** en fin de mise en service (voir phase 5).
- La **console** est la source de vérité (projets, dépôts, environnements). Ce qui est
  modifié dans l'UI ArgoCD ou dans le GitLab interne est ignoré ou écrasé.
- Pour **lire et configurer** la console, utiliser son API (swagger :
  `https://console.<instance>/swagger-ui`, ex. `console.sdid.cpin.numerique-interieur.com`), via
  `scripts/cpin-console/`. Elle s'authentifie par un **jeton API** (en-tête `x-dso-token`) que l'humain
  crée et place dans `.env.secrets`. Toute écriture se fait après un « oui » explicite de l'humain. Krakend, cité dans la doc CPiN, est un exemple d'API gateway pour *vos* API : il ne
  donne pas accès à la console.
- Une valeur critique (image, port, ingress, ressources) se vérifie sur le **rendu** `helm template`, pas sur `helm lint`.
- **Ne jamais proposer un CLI de cluster (`oc`, `kubectl`)** : l'agent n'y a pas accès. Lire l'état réel
  (pod, deployment, événements, secrets) via l'UI **ArgoCD DSO** (onglet application → Deployment/Pod/événements)
  ou la **console CPiN**. Demander à l'humain ce qu'il y voit, jamais une commande CLI.
- **Les instances n'ont pas toutes la même version de plateforme** (SDID répond **9.9.0** sur
  `/api/v1/version`, d'autres instances sont plus récentes). Une valeur documentée (chemin source ArgoCD, fichier de
  pipeline, auto-sync, « Déploiements »…) est un **exemple par instance**, pas un universel : relever la
  **version réelle de l'instance** (`/api/v1/version`) et vérifier chaque hypothèse contre
  elle avant de supposer un comportement.

## Phase 0 : éligibilité et architecture

1. L'application est-elle éligible ? Linux, **stateless**, configuration par variables d'environnement,
   **rootless**, système de fichiers en **lecture seule**, port > 1024, logs JSON sur stdout, Dockerfile dans le dépôt.
2. Noter le **port réellement écouté** par l'application (`EXPOSE` du Dockerfile, code de démarrage). Il sert aux phases 2 et 3.
3. Organisation recommandée : **un dépôt applicatif** (code, Dockerfile, `.gitlab-ci-dso.yml`) et **un
   dépôt d'infra privé** (chart ou values), déclarés tous deux dans la console (multi-dépôt ArgoCD).
   Plutôt qu'une branche par environnement, distinguer les environnements par les fichiers
   `values-<env>.yaml` : plus simple à maintenir (recommandation de la Service Team). Les branches par
   environnement restent possibles : la synchro peut porter sur toutes les branches, et les
   « Déploiements » (beta, console ≥ 9.25.0) acceptent une révision par environnement.
   La doc officielle propose les deux formes (dépôts séparés ou monorepo) dans ses tutoriels.
   Mise en place des deux dépôts (dispatch de la version, CI et CD du dépôt d'infra) : skill `cicd-fabnum`,
   `references/depot-infra.md`.

**Porte** : l'humain valide l'organisation des dépôts ; le port applicatif est connu.

## Phase 1 : console CPiN et GitHub, automatisés par API

L'agent crée lui-même ce qui est dans la console (script `scripts/cpin-console/console.mjs`, API
`console.<instance>/swagger-ui`). **L'humain répond aux questions et confirme : il ne clique pas dans la console.**

### 1. Prérequis humains (les seuls)

Le script est dans le kit installé par le plugin, pas dans le projet. `<kit>` est le chemin donné par
l'orchestrateur (« Où est quoi ») ; à défaut `../../../..` **depuis le dossier de ce skill**. Il ne faut
jamais supposer un dépôt `starter-kit-opencode` local : l'utilisateur n'en a pas. L'appeler par ce
chemin **absolu**, **depuis le dossier du projet** (c'est là que vit `.cpin/.env.secrets`). Ne jamais le
copier dans le projet : la copie ne suivrait pas les mises à jour.

**Prérequis** : ces scripts (`scripts/cpin-console`, `scripts/cpin-debug`) ne sont fournis que par
l'installation **plugin** (README §1) ou un clone complet du kit. Les installations par URL ou par copie du
seul skill ne les contiennent pas. Avant `init`, vérifier que `<kit>/scripts/cpin-console/console.mjs`
existe ; sinon **s'arrêter** et dire à l'humain d'installer le plugin (ou de cloner le kit et d'indiquer son
chemin), au lieu d'improviser une procédure manuelle.

- Le **jeton API de la console** : l'agent lance `node <kit>/scripts/cpin-console/console.mjs init`, qui **crée**
  `.cpin/.env.secrets` **dans le dossier du projet** (0600, valeurs vides, dossier auto-ignoré par git) et affiche son chemin réel. L'humain y colle
  `DSO_TOKEN=…` (console > profil > jetons). L'agent relance `init` pour vérifier « renseigné » / « vide » :
  jamais la valeur. Ne pas lui demander de créer ou d'éditer ce fichier à la main.
- **Un seul jeton GitHub** : un PAT **fine-grained** couvrant le dépôt applicatif **et** le dépôt d'infra
  (`GH_PAT`, plus `GH_USER`, l'identifiant du compte qui le possède). Il est utilisé **deux fois** :
  par la console pour cloner un dépôt **privé**, et comme secret `GH_PAT` des workflows (il **remplace la
  GitHub App**). L'humain le colle une fois dans `.env.secrets` ; `pat-push` le pose sur les deux dépôts.
  L'agent **constate** la visibilité au lieu de la demander (`git remote get-url origin`, puis
  `gh repo view <org>/<dépôt> --json isPrivate`) pour dire si la console en a besoin ; un dépôt qui
  n'existe pas encore : demander s'il sera privé. Le PAT reste nécessaire aux workflows même si les deux
  dépôts sont publics.

### Les jetons, un par un

Quand l'agent demande un jeton, il donne **toute** cette fiche (pas seulement le nom de la variable) et
précise lesquels sont demandés **maintenant** et lesquels viendront **plus tard**. Le chemin du fichier est
celui **affiché par `init`**, jamais un chemin reconstruit.

| Jeton | À quoi il sert | Où le créer | Droits / format | Où il va | Quand |
|-------|----------------|-------------|-----------------|----------|-------|
| `DSO_TOKEN` | Le script appelle l'API de la console **à ta place** : créer projet, environnements, dépôts ; lire les secrets du miroir | console > profil > jetons (ou `POST /api/v1/user/tokens`) : un nom, **une date d'expiration** (obligatoire) | Il a **tes droits** sur la console. Envoyé dans l'en-tête `x-dso-token`. La valeur n'est affichée **qu'une fois** à la création | `<projet>/.cpin/.env.secrets` | **maintenant**. Choisir une expiration courte (quelques jours), révoquer à la clôture (phase 5) |
| `GH_USER` | Compte GitHub qui possède le PAT ; transmis à la console avec lui pour un dépôt privé | — (ton identifiant GitHub) | Pas un secret | `.env.secrets` | maintenant |
| `GH_PAT` | **Un seul jeton GitHub pour tout** : (1) la console clone ton dépôt privé vers son miroir GitLab (`externalToken`) ; (2) secret des workflows : CI sur PR de release/bump, automerge, `dispatch-helm-chart` | github.com > Settings > Developer settings > **Fine-grained** personal access tokens | Resource owner = l'organisation ; **les deux dépôts** sélectionnés ; Contents, Pull requests, Actions : Read and write ; Metadata : Read ; expiration choisie. Un PAT classique ne suffit pas (pas de droits par dépôt) | `.env.secrets`, puis secret GitHub `GH_PAT` posé par `pat-push` sur les deux dépôts | maintenant. **Pas** révoqué à la clôture : il sert aux workflows ensuite (voir phase 5, rotation) |
| `GITLAB_TRIGGER_TOKEN` (`glptt-…`) | Le job `sync-cpin` de GitHub déclenche la synchro vers le miroir. **Pipeline trigger token**, pas un PAT `glpat-` | Récupéré **par le script** dans les secrets du projet (`secrets-push`) | — | secret GitHub, posé par `gh secret set` ; **tu ne le vois ni ne le tapes** | après `apply` |
| `ARGOCD_TOKEN`, `GITLAB_PAT`, `VAULT_TOKEN` | **Optionnels** : debug automatisé et alimentation du Vault (voir §6 et `references/api-debug.md`) | `ARGOCD_TOKEN` : écrit par le login Playwright ; `GITLAB_PAT` : GitLab > profil > jetons d'accès, scope `read_api` ; `VAULT_TOKEN` : service Vault > icône 👤 (en haut à droite) > **Copy token** | `GITLAB_PAT` : lecture seule ; `VAULT_TOKEN` : **tes** droits Vault, durée limitée (voir l'encadré ci-dessous) | `.cpin/.env.secrets` (le même fichier que les autres) | seulement si tu acceptes le debug automatisé |

**`VAULT_TOKEN` : ce que l'agent peut et ne peut pas faire.** Ce jeton porte tes droits dans Vault, donc il
pourrait techniquement lire tes secrets. Le kit l'empêche **dans le script**, pas par politesse :
`scripts/cpin-console/vault.mjs` n'appelle qu'une **liste fermée de routes** (qui est le jeton, mes droits,
noms des secrets, versions et dates, écriture). Il **n'existe aucune route de lecture du contenu** d'un
secret, et le garde-fou refuse tout le reste (testé : `vault.test.mjs`). L'agent ne peut pas non plus lire
`.cpin/.env.secrets` ni ton `.env` (refus dans `opencode.jsonc`), et ne lance que ce script. Une écriture
affiche seulement un numéro de version. Le jeton expire : à la clôture, ne rien révoquer, il suffit de ne
plus le recopier. Tu peux contrôler à tout moment : `vault.mjs whoami` (politiques, expiration).

L'agent **ne lit, n'affiche et ne demande jamais** une valeur : tu les colles toi-même dans le fichier,
il vérifie seulement « renseigné » / « vide » avec `init`. Aucun de ces jetons ne doit finir dans Git, dans
le chat ou dans un `values.yaml`.

### Expliquer ses choix

Chaque valeur que l'agent propose ou déduit est **accompagnée de sa raison** (« public, constaté par
`gh repo view` », « 2 déploiements ⇒ 2 × le quota du service », « port 8080 lu dans le Dockerfile »).
L'humain doit pouvoir corriger un choix en comprenant d'où il vient ; une valeur sans raison est une supposition.

- Les **secrets applicatifs** saisis dans le Vault du projet (mount `<organisation>-<projet>`).
- Pas de GitHub App par défaut : le PAT ci-dessus la remplace. Dans les workflows, `GH_PAT` prend la place
  de la paire `APP_CLIENT_ID`/`APP_PRIVATE_KEY` (skill `cicd-fabnum`, `references/depot-infra.md`). Si une App
  est déjà installée, elle l'emporte sur `GH_PAT` : c'est un choix, pas un prérequis.

### 2. Relever l'instance

`node <kit>/scripts/cpin-console/console.mjs version` (route publique) puis `catalog` (stages, clusters, zones).
Chaque comportement supposé se vérifie contre **cette version**, pas contre la doc générale.

### 3. Poser les questions, **en une seule liste**, puis attendre

Une question par paramètre des `POST` de l'API ; proposer une valeur par défaut déduite du dépôt quand c'est possible.

| Question | Contrainte (swagger 9.9.0) |
|----------|----------------------------|
| Nom du **projet** | 2 à 20 car., `[a-z0-9]` **uniquement, pas de tiret** (« translate-rt » est refusé). Ne change plus ensuite. Il fixe le nom du projet Harbor (`PROJECT_PATH`). |
| Description | 280 car. max |
| **Quels environnements ?** (stages de `catalog`, **hors `prod`** : dev, staging, integration…). Poser cette question **avant toute question de quota** | un stage par environnement. La **prod n'est pas prise en charge pour l'instant** : ne pas la proposer ni poser de question à son sujet |
| Pour chaque environnement : nom, cluster, cpu, gpu, mémoire | nom 2 à 11 car. `[a-z0-9]` ; cluster autorisé pour le stage |
| **Quota hors-prod du projet** : cpu, gpu, mémoire (ou `limitless`) | nombres ; relever l'unité affichée par la console. Le palier prod est envoyé à 0 par le script |
| **Dépôts** : nom interne, URL `https://….git`, public ou privé, applicatif ou infra | nom 2 à 20 car. `[a-z0-9-]` ; un dépôt privé exige `GH_USER`/`GH_PAT` |
| **Membres** à ajouter (e-mails) | optionnel |
| **Debug automatisé ?** vérifier ArgoCD, Harbor, GitLab et la console par API au lieu de l'UI (voir §6) | oui / non. **À poser ici, dans la même liste**, pas plus tard : c'est l'humain qui décide |

**Ordre des questions** : projet → environnements → quota hors-prod → dépôts → membres.
Ne jamais demander un quota ou un détail d'un palier dont l'humain n'a pas confirmé l'existence.
Rappeler au passage qu'on peut ajouter un environnement plus tard (la création est rejouable).

<!-- Prod, pas encore pris en compte. À réactiver plus tard :
     - proposer le stage `prod` et demander s'il y en a une, avant tout quota prod ;
     - quota prod (cpu, gpu, mémoire) demandé seulement si un environnement `prod` est confirmé ;
     - côté script : reprendre le bloc commenté de validatePlan dans scripts/cpin-console/console.mjs. -->

### 4. Simuler, faire confirmer, appliquer

1. Construire le plan JSON à partir des réponses, puis simuler :
   `node <kit>/scripts/cpin-console/console.mjs plan --plan '<json>'`. La simulation valide les contraintes
   ci-dessus et les couples stage/cluster, **sans rien écrire**.
2. Montrer la sortie à l'humain et obtenir un **« oui » explicite**.
3. `node <kit>/scripts/cpin-console/console.mjs apply --plan '<json>' --apply` crée projet, environnements,
   dépôts et membres (une commande déjà exécutée est rejouable : l'existant est réutilisé). Le script
   relit ensuite la console : c'est cette **relecture** (noms, quotas réels) qui alimente la fiche.
4. Relever le **nom du projet Harbor** réel (`PROJECT_PATH`) : il alimente `--expected-image` des
   phases 3/CI. Ne jamais le copier du nom du dépôt.

### 5. Secrets et variables GitHub (sur chaque dépôt, chacun avec son propre `GITLAB_PROJECT_NAME`)

1. `node <kit>/scripts/cpin-console/console.mjs secrets-list --project <nom>` : affiche les **noms** des secrets
   du projet (service puis clé), jamais les valeurs.
2. `… secrets-push --project <nom> --repo <org>/<dépôt> --secret GITLAB_TRIGGER_TOKEN=<service>.<clé>
   --var GITLAB_URL=<service>.<clé> --var GITLAB_MIRROR_ID=<service>.<clé>` : le script lit la valeur et la
   passe directement à `gh secret set` / `gh variable set`. `GITLAB_TRIGGER_TOKEN` est un pipeline trigger
   token `glptt-`, pas un PAT `glpat-`. Choisir la clé d'après son **nom** ; si aucune ne correspond,
   le dire à l'humain plutôt que deviner.
3. `GITLAB_PROJECT_NAME` n'est pas un secret de la console : c'est le nom du dépôt dans le miroir, à
   poser avec `gh variable set GITLAB_PROJECT_NAME -R <org>/<dépôt> --body <nom>` (valeur non sensible).
4. `node <kit>/scripts/cpin-console/console.mjs pat-push --repo <org>/<app> --repo <org>/<app>-infra` : pose
   `GH_PAT` sur les deux dépôts (valeur lue dans `.env.secrets`, jamais affichée).
5. Si `scan-sonarqube` est ajouté au `ci.yml` : secrets `SONAR_TOKEN` et `SONAR_PROJECT_KEY`, saisis par l'humain.

### 6. Debug automatisé (optionnel, **toujours proposé**)

La question est posée avec les autres (§3). Ne jamais la sauter : si l'humain n'a pas répondu, la poser avant
de quitter la phase 1, avec cette explication :

> Le debug automatisé vérifie par API l'état d'ArgoCD, Harbor, GitLab et de la console (statuts HTTP,
> jamais de jetons) au lieu de te demander ce que tu vois dans l'UI. Il demande une fois une connexion SSO
> dans un navigateur, et un jeton GitLab en lecture seule. Tu veux l'activer ?

- **Oui** → noter « debug : oui » dans la FICHE ; `GITLAB_PAT` est à coller dans le même
  `.cpin/.env.secrets` (`init` le liste comme optionnel). L'agent ne lit jamais le contenu. `ARGOCD_TOKEN`
  sera écrit plus tard par le login (phase 5).
- **Non** → debug manuel via l'UI uniquement. Rien n'est installé.

**Vault** : `VAULT_TOKEN` est optionnel et sert à deux choses, décrites dans
[`references/api-debug.md`](references/api-debug.md) : constater qu'un secret applicatif existe (nom, version,
date : jamais sa valeur) et l'alimenter depuis le `.env` de l'humain, après simulation et confirmation.

**À tout moment** : dès qu'une difficulté touche un service externe (synchro, image, ArgoCD, Harbor,
GitLab, console, jeton refusé, ressource introuvable) et que le debug n'est pas actif, le **proposer à ce
moment**, en disant quel check éclairerait ce symptôme (`references/depannage.md`, « Quel check de debug
éclaire quel symptôme ») et ce qu'un statut prouve ou non. Même un « non » antérieur n'interdit pas de
reproposer, **une seule fois par difficulté** ; après deux refus, ne plus insister et rester sur l'UI.

Les scripts sont dans `<kit>/scripts/cpin-debug/` et se lancent **depuis le dossier du projet**, comme
`console.mjs` : ils lisent `.cpin/.env.secrets` du dossier courant.

**Porte** : `gh secret list` et `gh variable list` montrent, sur chaque dépôt (`-R <org>/<dépôt>`),
`GITLAB_TRIGGER_TOKEN`, `GITLAB_URL`, `GITLAB_MIRROR_ID`, `GITLAB_PROJECT_NAME` (et `GH_PAT`, ou les secrets
de la GitHub App si elle est utilisée) ; la relecture de la console montre projet, environnements et dépôts attendus ; l'humain a
confirmé les secrets Vault.

## Phase 2 : valeurs vitales dans `values.yaml`

1. **Ne rien demander à l'humain de « déclarer »** : sur une console 9.9.0, le dépôt n'a aucun réglage de
   fichiers values (ni dans l'UI, ni dans l'API : `console.mjs version` le constate). Ne pas inventer ce
   réglage et ne pas poser la question. Si une autre instance l'expose (`version` répond « oui »), c'est
   l'humain qui le règle dans l'UI ; l'agent ne le suppose jamais.
2. Seul `values.yaml` est **garanti** chargé. Y mettre toutes les valeurs vitales : image Harbor,
   `registry-pull-secret`, ressources sous le quota, labels, port, ingress activé avec son host réel.
3. `values-<env>.yaml` n'est qu'un complément propre à l'environnement : son effet **se constate** au
   déploiement (phase 5), il n'est pas supposé acquis.

**Porte** : toutes les valeurs vitales sont dans `values.yaml` et le rendu `helm template -f values.yaml`
seul passe `check-cpin-rules.py`.

## Phase 3 : chart et CI, vérifiés avant la merge

1. Chart : skill `helm-chart-cpin` (squelette tobi, surcharge CPiN, checklist pré-PR).
2. Pipeline DSO : partir de [`references/gitlab-ci-dso.yml`](references/gitlab-ci-dso.yml) (le job `read_secret` reste en premier).
3. Rendre **avec les mêmes fichiers et le même ordre que la console**, puis vérifier :
   ```bash
   helm template <release> <chart> -f values.yaml -f values-cpin.yaml -f values-<env>.yaml \
     | uv run --with pyyaml scripts/check-cpin-rules.py \
         --quota-cpu <quota> --quota-memory <quota avec unité> --app-port <port> --require-ingress \
         --expected-image <registry>/<projet-harbor>/<repo>
   ```
   `--expected-image` = le chemin complet **sans tag** issu du `PROJECT_PATH` réel de la console (nom du
   projet Harbor). Il peut différer du nom du dépôt ou de l'app (ex. projet `icebreakerdemo`, dépôt
   `ice-breaker-demo`) : tout écart fait échouer le check plutôt qu'un `ImagePullBackOff` 401 au déploiement.
4. Ajouter cette commande en job CI bloquant (dans les `needs` de `all-jobs-passed`).

**Porte** : `check-cpin-rules.py` sort en 0 localement et en CI.

## Phase 4 : livrer

| Ce qui change | Ce qu'il faut faire |
|---------------|---------------------|
| Code (image) | nouveau **tag d'image** (version ou SHA court) → synchro → pipeline DSO (Kaniko, Trivy, Harbor) → tag reporté dans les values → ArgoCD. Tag inchangé ⇒ pas de redéploiement. |
| Code, avec un dépôt d'infra | release applicative → synchro du dépôt applicatif (image) → PR de bump d'`appVersion` ouverte dans le dépôt d'infra → l'humain la merge **une fois le pipeline DSO de l'image vert** → synchro du dépôt d'infra → ArgoCD. |
| Chart ou values seulement | commit dans le dépôt d'infra → synchro de ce dépôt → *REFRESH* puis *SYNC* ArgoCD. Aucune nouvelle image nécessaire *(à confirmer avec la Service Team : cas non documenté)*. |

Auto-sync désactivé ⇒ *SYNC* manuel dans ArgoCD (instance **ArgoCD DSO**).

## Phase 5 : vérifier après la synchro

1. ArgoCD : application `Synced` et `Healthy`.
2. **Lire l'état du pod via l'UI ArgoCD DSO** (jamais un CLI) : image attendue (Harbor, bon tag) et
   limits réelles. En cas de pull/start qui échoue, rapporter à l'humain le **message d'erreur exact** des
   événements (voir dépannage).
3. `curl -fsS https://<host>/<chemin de santé>` répond 200.
4. **Clôture de mise en service** : révoquer tout secret/token exposé ou d'essai (ex. `github_pat_…` commité,
   token mirror `glptt-…`, jetons jetables de test). Rappeler à l'humain la **Rotation** de ce qui a fuité ;
   l'agent ne manipule jamais ces valeurs, il vérifie seulement que la révocation est demandée/faite.
   **Exception : `GH_PAT`** reste utilisé après la mise en service (miroir d'un dépôt privé, release, chart).
   Ne le révoquer que **remplacé** : nouveau PAT collé dans `.env.secrets`, `pat-push` relancé sur les deux
   dépôts, valeur mise à jour dans la console, puis seulement l'ancien est révoqué. `DSO_TOKEN` et les jetons
   jetables, eux, se révoquent à la clôture.
5. **Debug automatisé** : reprendre la réponse donnée en phase 1 (§6). Si elle n'a pas été donnée, la
   **demander maintenant** ; ne jamais passer cette étape sous silence.

- **Ramification A — « oui »** :
  0. **Une fois** : installer Playwright et Firefox, au prix d'un téléchargement d'environ 100 Mo, avec
     l'accord de l'humain : `npm install --prefix <kit>/scripts/cpin-debug` puis
     `npx --prefix <kit>/scripts/cpin-debug playwright install firefox`.
  1. `node <kit>/scripts/cpin-debug/login.mjs` (depuis le dossier du projet). Le navigateur s'ouvre,
     l'humain se connecte via le SSO Keycloak (2FA possible). Le token OIDC est écrit dans
     `.cpin/.env.secrets` (0600), **jamais affiché**.
  2. Lancer les checks : `node <kit>/scripts/cpin-debug/check-argocd.mjs`, `check-harbor.mjs`,
     `check-gitlab.mjs`, `check-console.mjs`.
  3. Lire les **statuts HTTP** (jamais les tokens) et les rapporter à l'humain, avec ce que chacun prouve.
  4. **A1 — un check échoue** (ex. ArgoCD 401, Harbor 500) → consulter `references/depannage.md` et
     proposer un correctif, ou demander à l'humain ce qu'il voit dans l'UI.
- **Ramification B — « non » ou login refusé** : debug manuel via l'UI ArgoCD DSO. Demander à l'humain ce
  qu'il voit (statut pod, événements, image attendue).
- **Ramification C — login accepté mais jeton manquant pour un service** :
  - `ARGOCD_TOKEN` absent → relancer `login.mjs`.
  - `DSO_TOKEN` ou `GITLAB_PAT` vide → `init` le dit ; demander à l'humain de le coller, ou sauter le
    check de ce service en le signalant.

**Règle absolue** : ne jamais lire, écrire, afficher ni demander la **valeur** d'un token. Vérifier
seulement la **présence** des variables avec `console.mjs init` (« renseigné » / « vide »).

**Porte** : les quatre points sont OK (la révocation de la clôture est répertoriée). Sinon : [`references/depannage.md`](references/depannage.md) (symptôme → phase → correctif).

## Limites connues (à confirmer, ne rien inventer)

- **Route vs Ingress** : la doc ne rend jamais la Route obligatoire, et les tutoriels officiels (`cloud-pi-native/tuto-*-infra-helm`) utilisent un Ingress. L'Ingress fonctionne aussi sur l'instance SDID.
- **Fichiers values** : sur une console 9.9.0, le dépôt n'expose aucun réglage de fichiers values (swagger : champs `internalRepoName`, `externalRepoUrl`, `isPrivate`, `isInfra`, identifiants). Le chargement de `values-<env>.yaml` n'est donc pas établi ; seul `values.yaml` est supposé chargé, d'où la phase 2.
- **Token GitHub** : la doc demande un PAT avec le scope `repo`. Un token fine-grained en lecture seule a donné `403 Write access to repository not granted`. La Service Team suggère la lecture seule : le moindre privilège suffisant n'est pas établi. En cas de 403, passer au PAT `repo` documenté.
- **Registres Kyverno** : la doc liste `harbor.io/`, alors que le Harbor de chaque instance a son propre domaine (ex. `harbor.sdid.cpin.numerique-interieur.com`). `check-cpin-rules.py` accepte tout registre contenant `harbor`. À confirmer avant la prod, où la règle est bloquante.
- Nom du fichier de pipeline incohérent dans les docs CPiN (`.gitlab-ci-dso.yml`/`.yaml`), catalogues Kaniko variables selon l'instance.
- **Chemin source ArgoCD** : figé par la console sur notre instance (ex. `helm/`), il est un **exemple par
  instance**, pas un universel — et peut dépendre de la **version de la plateforme** (relever `/api/v1/version`).
  Se vérifier au cas par cas dans la console, jamais copié tels quel d'une autre instance.
- « Déploiements » (beta, console ≥ 9.25.0) : dès qu'il en existe un, il écrase la config des dépôts d'infra pour cet environnement.

## Pour aller plus loin

- Doc interne : `docs/okf/cloud-pi-native/` (plateforme, dépôts et mirror, GitOps, environnements, secrets, Kyverno).
- Source : [documentation officielle](https://cloud-pi-native.fr) ; exemple `IA-Generative/ocr-api`.
- Exemple capitalisé en conditions réelles : RETEX d'un premier déploiement complet — `IA-Generative/ice-breaker-demo-infra`, `docs/RETEX-deploiement.md` (blocages, leçons chemin Harbor, schéma dépôt d'infra + fine-grained PAT, opérations auto/manuel, clôture = révocation des secrets).
- Skills liés (groupe `gouv-fr/dso`) : `cicd-fabnum` (CI/CD GitHub, `sync-cpin`), `helm-chart-cpin` (chart et vérification).
