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

- **Ne jamais demander, lire, écrire ni afficher la valeur d'un token ou d'un secret.** L'humain les
  saisit dans la console CPiN, dans GitHub ou dans Vault ; l'agent vérifie seulement que le **nom** existe.
- **Ne jamais committer un secret/token dans Git** (même en « temporaire ») : un `github_pat_…` ou un token
  mirror (`glptt-…`) commité est un secret fuité à **révoquer** en fin de mise en service (voir phase 5).
- La **console** est la source de vérité (projets, dépôts, environnements, fichiers values). Ce qui est
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

- Le **jeton API de la console** : l'agent lance `node scripts/cpin-console/console.mjs init`, qui **crée**
  `scripts/cpin-console/.env.secrets` (0600, valeurs vides) et affiche son chemin réel. L'humain y colle
  `DSO_TOKEN=…` (console > profil > jetons). L'agent relance `init` pour vérifier « renseigné » / « vide » :
  jamais la valeur. Ne pas lui demander de créer ou d'éditer ce fichier à la main.
- **Identifiants d'un dépôt privé** (`INFRA_REPO_USER`, `INFRA_REPO_TOKEN` : PAT GitHub, scope `repo`) :
  **ne les demander que si un dépôt déclaré est privé**. L'agent le **constate** au lieu de poser la question :
  `git remote get-url origin` pour le dépôt applicatif, puis `gh repo view <org>/<dépôt> --json isPrivate`.
  Un dépôt qui n'existe pas encore (erreur `gh`) : demander à l'humain s'il sera privé. Un dépôt public
  n'a besoin d'aucun identifiant : le dire, ne pas les réclamer.

### Expliquer ses choix

Chaque valeur que l'agent propose ou déduit est **accompagnée de sa raison** (« public, constaté par
`gh repo view` », « 2 déploiements ⇒ 2 × le quota du service », « port 8080 lu dans le Dockerfile »).
L'humain doit pouvoir corriger un choix en comprenant d'où il vient ; une valeur sans raison est une supposition.

- Les **secrets applicatifs** saisis dans le Vault du projet (mount `<organisation>-<projet>`).
- La **GitHub App** installée sur les dépôts (secrets `APP_CLIENT_ID` et `APP_PRIVATE_KEY`, ou `GH_PAT`) :
  sans elle, pas de CI sur les PR de release/bump, ni d'automerge, ni de `dispatch-helm-chart`.

### 2. Relever l'instance

`node scripts/cpin-console/console.mjs version` (route publique) puis `catalog` (stages, clusters, zones).
Chaque comportement supposé se vérifie contre **cette version**, pas contre la doc générale.

### 3. Poser les questions, **en une seule liste**, puis attendre

Une question par paramètre des `POST` de l'API ; proposer une valeur par défaut déduite du dépôt quand c'est possible.

| Question | Contrainte (swagger 9.9.0) |
|----------|----------------------------|
| Nom du **projet** | 2 à 20 car., `[a-z0-9]` **uniquement, pas de tiret** (« translate-rt » est refusé). Ne change plus ensuite. Il fixe le nom du projet Harbor (`PROJECT_PATH`). |
| Description | 280 car. max |
| Quotas du projet, **hors-prod** et **prod** : cpu, gpu, mémoire (ou `limitless`) | nombres ; relever l'unité affichée par la console |
| **Environnements** : nom, stage, cluster, cpu, gpu, mémoire | nom 2 à 11 car. `[a-z0-9]` ; stage et cluster pris dans `catalog` ; cluster autorisé pour le stage |
| **Dépôts** : nom interne, URL `https://….git`, public ou privé, applicatif ou infra | nom 2 à 20 car. `[a-z0-9-]` ; un dépôt privé exige `INFRA_REPO_USER`/`INFRA_REPO_TOKEN` |
| **Membres** à ajouter (e-mails) | optionnel |

### 4. Simuler, faire confirmer, appliquer

1. Construire le plan JSON à partir des réponses, puis simuler :
   `node scripts/cpin-console/console.mjs plan --plan '<json>'`. La simulation valide les contraintes
   ci-dessus et les couples stage/cluster, **sans rien écrire**.
2. Montrer la sortie à l'humain et obtenir un **« oui » explicite**.
3. `node scripts/cpin-console/console.mjs apply --plan '<json>' --apply` crée projet, environnements,
   dépôts et membres (une commande déjà exécutée est rejouable : l'existant est réutilisé). Le script
   relit ensuite la console : c'est cette **relecture** (noms, quotas réels) qui alimente la fiche.
4. Relever le **nom du projet Harbor** réel (`PROJECT_PATH`) : il alimente `--expected-image` des
   phases 3/CI. Ne jamais le copier du nom du dépôt.

### 5. Secrets et variables GitHub (sur chaque dépôt, chacun avec son propre `GITLAB_PROJECT_NAME`)

1. `node scripts/cpin-console/console.mjs secrets-list --project <nom>` : affiche les **noms** des secrets
   du projet (service puis clé), jamais les valeurs.
2. `… secrets-push --project <nom> --repo <org>/<dépôt> --secret GITLAB_TRIGGER_TOKEN=<service>.<clé>
   --var GITLAB_URL=<service>.<clé> --var GITLAB_MIRROR_ID=<service>.<clé>` : le script lit la valeur et la
   passe directement à `gh secret set` / `gh variable set`. `GITLAB_TRIGGER_TOKEN` est un pipeline trigger
   token `glptt-`, pas un PAT `glpat-`. Choisir la clé d'après son **nom** ; si aucune ne correspond,
   le dire à l'humain plutôt que deviner.
3. `GITLAB_PROJECT_NAME` n'est pas un secret de la console : c'est le nom du dépôt dans le miroir, à
   poser avec `gh variable set GITLAB_PROJECT_NAME -R <org>/<dépôt> --body <nom>` (valeur non sensible).
4. Si `scan-sonarqube` est ajouté au `ci.yml` : secrets `SONAR_TOKEN` et `SONAR_PROJECT_KEY`, saisis par l'humain.

### 6. Debug automatisé (optionnel)

> Veux-tu configurer le debug automatisé des services internes (scripts `scripts/cpin-debug/`) ?
> Cela permet de vérifier ArgoCD, Harbor, GitLab et la console par API au lieu de l'UI.

- **Oui** → vérifier que `scripts/cpin-debug/.env.secrets` existe (0600) et **demander** à l'humain d'y
  ajouter `DSO_TOKEN` (console) et `GITLAB_PAT` (GitLab). L'agent ne lit jamais le contenu. Le token OIDC
  (`ARGOCD_TOKEN`) sera ajouté plus tard par `login.mjs` (phase 5).
- **Non** → debug manuel via l'UI uniquement. Rien n'est installé.

**Porte** : `gh secret list` et `gh variable list` montrent, sur chaque dépôt (`-R <org>/<dépôt>`),
`GITLAB_TRIGGER_TOKEN`, `GITLAB_URL`, `GITLAB_MIRROR_ID`, `GITLAB_PROJECT_NAME` (et les secrets de la
GitHub App) ; la relecture de la console montre projet, environnements et dépôts attendus ; l'humain a
confirmé les secrets Vault et la GitHub App.

## Phase 2 : fichiers values chargés par ArgoCD

1. La console applique **la liste de fichiers values qu'on y déclare, dans l'ordre déclaré** : chaque
   fichier surcharge les précédents. `<env>` est remplacé par le nom de l'environnement. Sans fichier
   déclaré (Déploiements), seul `values.yaml` est pris. Convention du starter-kit : déclarer
   `values.yaml`, `values-cpin.yaml`, `values-<env>.yaml`.
2. Faire vérifier par l'humain (console > dépôt d'infra > fichiers values, ou swagger) que **ces fichiers
   sont bien déclarés**. Si un fichier n'est pas déclaré, il est ignoré sans erreur.
3. Tant que ce n'est pas confirmé, mettre les valeurs vitales **dans `values.yaml`** : image Harbor,
   `registry-pull-secret`, ressources sous le quota, labels, port, ingress activé avec son host réel.
   Ne mettre dans `values-<env>.yaml` que ce qui est propre à l'environnement.

**Porte** : la liste des fichiers déclarés dans la console est connue et recopiée dans la PR.

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
5. **Debug automatisé (optionnel)** — **demander** à l'humain :

> Veux-tu te logger (login Playwright) pour activer le debug automatisé des services ? Une fenêtre
> navigateur s'ouvrira pour te connecter via le SSO Keycloak. Sinon, on vérifie via l'UI ArgoCD DSO.

- **Ramification A — Login accepté** :
  1. Lancer `npm run login` (dans `scripts/cpin-debug/`). Le navigateur s'ouvre, l'humain se connecte via
     SSO Keycloak (2FA possible). Le token OIDC est écrit dans `.env.secrets` (0600), **jamais affiché**.
  2. Lancer les checks : `check:argocd`, `check:harbor`, `check:gitlab`, `check:console`.
  3. Lire les **statuts HTTP** (jamais les tokens) et les rapporter à l'humain.
  4. **A1 — un check échoue** (ex. ArgoCD 401, Harbor 500) → consulter `references/depannage.md` et
     proposer un correctif, ou demander à l'humain ce qu'il voit dans l'UI.
- **Ramification B — Login refusé** : debug manuel via l'UI ArgoCD DSO (comportement actuel, inchangé).
  Demander à l'humain ce qu'il voit (statut pod, événements, image attendue).
- **Ramification C — Login accepté mais token manquant pour un service** :
  - `ARGOCD_TOKEN` absent → relancer `login.mjs`.
  - `DSO_TOKEN` ou `GITLAB_PAT` absent → **demander** à l'humain de les ajouter dans `.env.secrets`, ou
    sauter le check de ce service en le signalant.

**Règle absolue** : ne jamais lire, écrire, afficher ni demander la **valeur** d'un token. Vérifier
seulement la **présence** des variables dans `.env.secrets` (ex. `grep -c '^ARGOCD_TOKEN='`).

**Porte** : les quatre points sont OK (la révocation de la clôture est répertoriée). Sinon : [`references/depannage.md`](references/depannage.md) (symptôme → phase → correctif).

## Limites connues (à confirmer, ne rien inventer)

- **Route vs Ingress** : la doc ne rend jamais la Route obligatoire, et les tutoriels officiels (`cloud-pi-native/tuto-*-infra-helm`) utilisent un Ingress. L'Ingress fonctionne aussi sur l'instance SDID.
- **Fichiers values** : sur un premier déploiement, seul `values.yaml` semblait pris en compte. Cause probable : `values-cpin.yaml` et `values-dev.yaml` non déclarés dans la console (d'où la porte de la phase 2).
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
- Skills liés (groupe `dso`) : `cicd-fabnum` (CI/CD GitHub, `sync-cpin`), `helm-chart-cpin` (chart et vérification).
