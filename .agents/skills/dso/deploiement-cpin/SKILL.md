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
- La **console** est la source de vérité (projets, dépôts, environnements, fichiers values). Ce qui est
  modifié dans l'UI ArgoCD ou dans le GitLab interne est ignoré ou écrasé.
- Pour **lire** la configuration de la console, utiliser son API (swagger :
  `https://console.<instance>/swagger-ui`, ex. `console.sdid.cpin.numerique-interieur.com`). Elle
  s'authentifie par un **jeton API** (en-tête `x-dso-token`) que l'humain crée et place dans une variable
  d'environnement. Krakend, cité dans la doc CPiN, est un exemple d'API gateway pour *vos* API : il ne
  donne pas accès à la console.
- Une valeur critique (image, port, ingress, ressources) se vérifie sur le **rendu** `helm template`, pas sur `helm lint`.

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

## Phase 1 : prérequis, à faire par l'humain AVANT le premier run

Présenter cette checklist à l'humain et attendre qu'il confirme chaque ligne :

- [ ] Projet créé dans la console (le nom ne change plus), équipe et rôles ajoutés.
- [ ] Dépôts applicatif et infra déclarés **dans la console** (un dépôt `plugin-managed` inconnu d'elle est supprimé au reprovisionnement).
- [ ] Environnement créé (dev/staging/integration/prod). **Quota relevé avec son unité** : CPU en `m`, mémoire en `Mi` ou `Gi` (ex. « 0.2 » de mémoire = `0.2Gi` ≈ `205Mi`).
- [ ] **Si le dépôt GitHub est privé** : informations d'accès saisies dans le formulaire du dépôt de la
      console. La doc officielle demande un PAT avec le scope `repo`.
- [ ] `GIT_MIRROR_TOKEN` (pipeline trigger token `glptt-`, pas un PAT `glpat-`) **récupéré dans la
      console** (secrets du projet, commande curl de synchro), avec l'id du projet `mirror` et l'URL GitLab.
- [ ] Côté GitHub (job `sync-cpin`, skill `cicd-fabnum`) : secret `GITLAB_TRIGGER_TOKEN` et variables `GITLAB_URL`, `GITLAB_MIRROR_ID`, `GITLAB_PROJECT_NAME`.
- [ ] GitHub App installée, secrets `APP_CLIENT_ID` et `APP_PRIVATE_KEY` (ou `GH_PAT`) : sans elle, la CI ne tourne pas sur les PR de release ni de bump, et ni l'automerge ni `dispatch-helm-chart` ne marchent.
      **Avec un dépôt d'infra** : tout ce qui précède sur les deux dépôts, chacun avec son propre `GITLAB_PROJECT_NAME`.
- [ ] Si `scan-sonarqube` est ajouté au `ci.yml` : secrets `SONAR_TOKEN` et `SONAR_PROJECT_KEY` (requis par le workflow).
- [ ] Secrets applicatifs saisis **par l'humain** dans le Vault du projet (mount `<organisation>-<projet>`).

**Porte** : `gh secret list` et `gh variable list` montrent tous les noms cochés ci-dessus (sur chaque dépôt, avec `-R <org>/<dépôt>`), et l'humain a confirmé les autres lignes.

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
         --quota-cpu <quota> --quota-memory <quota avec unité> --app-port <port> --require-ingress
   ```
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
2. Le pod tourne avec l'image attendue (Harbor, bon tag) et ses limits réelles.
3. `curl -fsS https://<host>/<chemin de santé>` répond 200.

**Porte** : les trois points sont OK. Sinon : [`references/depannage.md`](references/depannage.md) (symptôme → phase → correctif).

## Limites connues (à confirmer, ne rien inventer)

- **Route vs Ingress** : la doc ne rend jamais la Route obligatoire, et les tutoriels officiels (`cloud-pi-native/tuto-*-infra-helm`) utilisent un Ingress. L'Ingress fonctionne aussi sur l'instance SDID.
- **Fichiers values** : sur `dso-demo`, seul `values.yaml` semblait pris en compte. Cause probable : `values-cpin.yaml` et `values-dev.yaml` non déclarés dans la console (d'où la porte de la phase 2).
- **Token GitHub** : la doc demande un PAT avec le scope `repo`. Un token fine-grained en lecture seule a donné `403 Write access to repository not granted` sur `dso-demo`. La Service Team suggère la lecture seule : le moindre privilège suffisant n'est pas établi. En cas de 403, passer au PAT `repo` documenté.
- **Registres Kyverno** : la doc liste `harbor.io/`, alors que le Harbor de chaque instance a son propre domaine (ex. `harbor.sdid.cpin.numerique-interieur.com`). `check-cpin-rules.py` accepte tout registre contenant `harbor`. À confirmer avant la prod, où la règle est bloquante.
- Nom du fichier de pipeline incohérent dans les docs CPiN (`.gitlab-ci-dso.yml`/`.yaml`), catalogues Kaniko variables selon l'instance.
- « Déploiements » (beta, console ≥ 9.25.0) : dès qu'il en existe un, il écrase la config des dépôts d'infra pour cet environnement.

## Pour aller plus loin

- Doc interne : `docs/okf/cloud-pi-native/` (plateforme, dépôts et mirror, GitOps, environnements, secrets, Kyverno).
- Source : [documentation officielle](https://cloud-pi-native.fr) ; exemples `IA-Generative/ocr-api`, `IA-Generative/dso-demo`.
- Skills liés (groupe `dso`) : `cicd-fabnum` (CI/CD GitHub, `sync-cpin`), `helm-chart-cpin` (chart et vérification).
