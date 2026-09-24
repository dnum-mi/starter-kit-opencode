---
name: deploiement-cpin
description: Use when onboarding or deploying an application on Cloud Pi Native — DSO console (project, repositories, environments, quotas), mirror sync, .gitlab-ci-dso pipeline to Harbor, ArgoCD GitOps deployment, Vault secrets, Kyverno rejections, and diagnosing a deployment that does not roll out
allowed-tools: Bash Read Write
---

# Déployer sur Cloud Pi Native

Faire passer une application de son dépôt GitHub à un namespace CPiN, et diagnostiquer quand ça ne bouge pas.

## Modèle mental

Deux chaînes : la **primaire** (vos outils : GitHub, CI, releases) contrôle et publie ; la **secondaire** (GitLab DSO) reconstruit, analyse, signe et pousse dans Harbor ; **ArgoCD** déploie le dépôt d'infra.
Le pont est la **synchronisation** : un déclencheur (`sync-cpin`, skill `cicd-fabnum`) lance le pipeline `mirror` du GitLab interne, qui tire votre dépôt. Le flux part toujours du GitLab interne.
La **console** est la source de vérité (projets, dépôts, environnements, ArgoCD) : ce qui est modifié ailleurs est ignoré ou écrasé.

## Avant de commencer : l'application est-elle éligible ?

Linux, **stateless**, configuration par variables d'environnement (même image partout), **rootless**, système de fichiers en **lecture seule**, ports > 1024, logs sur stdout (JSON ou GELF), Dockerfile dans le dépôt, images de base publiques ou reconstruites par la plateforme.
Si un point manque, le corriger d'abord ; la Service Team aide mais ne fait pas à la place (*Build it, You run it*).

## Parcours dans la console

1. **Projet** : un projet = une application, rattaché à une organisation ; **le nom ne peut plus changer**. Ajouter l'équipe et ses rôles.
2. **Dépôts** : *applicatif* (Dockerfile + `.gitlab-ci-dso.yml`) et/ou *infra* (chart Helm, Kustomize, manifests ; crée l'application ArgoCD). Un seul dépôt peut jouer les deux rôles. Toujours par la console : un reprovisionnement supprime les dépôts `plugin-managed` qu'elle ne connaît pas (`mirror` et `infra-apps` sont protégés).
3. **Environnement** : un environnement = un namespace. Choisir le type (dev/staging/integration/prod, qui donne le cluster et les quotas hors prod/prod) ; les quotas CPU/RAM/GPU valent la **somme des `resources.limits`** de tous les pods.
   La console crée le namespace, le secret `registry-pull-secret`, les quotas et l'application ArgoCD.
4. **Déploiement** : dans le dépôt d'infra, régler révision (branche/tag), chemin et fichiers values — `values-<env>.yaml`, `<env>` étant remplacé par le nom de l'environnement. À faire **dans la console**, pas dans l'UI ArgoCD.

## Boucle de livraison

1. Nouveau commit/version dans le dépôt applicatif, **tag d'image qui change** (SHA court ou version).
2. Synchronisation vers le GitLab CPiN (déclencheur ou bouton « Lancer la synchronisation »).
3. Pipeline DSO : lecture des secrets de chaîne, analyse Sonar, build Kaniko, scan Trivy, push et signature dans Harbor. Modèle : [`references/gitlab-ci-dso.yml`](references/gitlab-ci-dso.yml).
4. Mise à jour du tag dans le dépôt d'infra (values), puis synchronisation de ce dépôt.
5. ArgoCD applique. Statut attendu : `Healthy`. Boutons *REFRESH* (relire GitLab) et *SYNC* (appliquer).

Tag inchangé ⇒ aucun diff ⇒ **aucun redéploiement**. Auto-sync désactivé ⇒ *SYNC* manuel obligatoire.

## Décisions fréquentes

| Question | Réponse |
|----------|---------|
| Où est l'image de référence ? | dans **Harbor** (construite et signée par la chaîne DSO), pas sur ghcr.io ; seuls docker.io, harbor, registry.redhat.io, quay.io, bitnami et ghcr.io sont acceptés par Kyverno |
| Secrets applicatifs ? | Vault via VSO (`VaultStaticSecret`, `vaultAuthRef: vault-auth`, mount `<organisation>-<projet>`) ou SOPS/age ; jamais en ConfigMap ni dans Git |
| Plusieurs branches/dépôts sur un environnement ? | fonctionnalité **Déploiements** (beta, console ≥ 9.25.0) ; dès qu'un déploiement existe il écrase la config des dépôts d'infra et les autres environnements ne sont plus régénérés : tout reporter avant d'en créer un |
| Image tierce ? | seulement d'un registre public reconnu (ex. `bitnami/postgresql`) ; jamais poussée depuis un poste |
| Logs, métriques, alertes ? | Loki/Grafana (logs 6 mois), Prometheus (métriques 1 an en prod), dashboards *as code* dans le dépôt `infra-observability` (branche `main`) |

## Vérifier avant de livrer

- Rendre le chart et contrôler les règles Kyverno : `helm template … | uv run --with pyyaml scripts/check-cpin-rules.py` (skill `helm-chart-cpin`). Les règles sont en **audit en dev/preprod et bloquantes en prod**.
- Somme des `limits` ≤ quota de l'environnement ; NetworkPolicy pour tout flux hors règles injectées.

## Si ça ne marche pas

Voir [`references/depannage.md`](references/depannage.md) (symptôme → cause → action).

## Limites connues

- Les docs CPiN ne sont pas cohérentes sur le nom du fichier de pipeline (`.gitlab-ci-dso.yaml` dans « Démarrer », `gitlab-ci-dso.yml` ailleurs ; `ocr-api` utilise `.gitlab-ci-dso.yml`) et les catalogues de jobs Kaniko varient : vérifier sur votre instance.
- L'étape qui met à jour le tag par environnement (dépôt de values séparé chez ocr-api) n'est documentée nulle part dans les sources lues.
- Route vs Ingress, quotas chiffrés et adresses de proxy ne sont pas documentés : les demander à la Service Team.

## Pour aller plus loin

- Doc interne : `docs/okf/cloud-pi-native/` (plateforme, dépôts et mirror, GitOps, environnements, secrets, contraintes et Kyverno), `docs/okf/cycle-de-vie/de-commit-a-environnement.md`.
- Source : [documentation officielle](https://cloud-pi-native.fr) ; exemple `IA-Generative/ocr-api`.
- Skills liés (groupe `dso`) : `cicd-fabnum` (CI/CD GitHub, `sync-cpin`), `helm-chart-cpin` (chart et vérification Kyverno).
