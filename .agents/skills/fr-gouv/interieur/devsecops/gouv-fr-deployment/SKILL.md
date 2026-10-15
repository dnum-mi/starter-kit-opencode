---
name: gouv-fr-deployment
description: Déploie une application — Dockerfiles de prod durcis et Kubernetes/OpenShift, puis onboarding et livraison sur Cloud Pi Native (console DSO, pipeline, Harbor, ArgoCD).
category: devsecops
version: 0.3.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, docker, kubernetes, openshift, cloud-pi-native, argocd, harbor, kaniko, trivy, deploy]
    related_skills: [gouv-fr-repo-cicd, gouv-fr-smoke-test, gouv-fr-securite, gouv-fr-stack-technique]
---

# Gouv-fr — Déploiement (Docker/K8s et Cloud Pi Native)

## Quand utiliser

Deux niveaux, dans cet ordre :

1. **Conteneur et Kubernetes** : écrire un Dockerfile de prod durci (multi-stage, rootless, lecture seule),
   tester en local.
2. **Cloud Pi Native** : onboarder l'application et la livrer (console DSO, pipeline, Harbor, ArgoCD).

Pour le **chart Helm**, utiliser `helm-chart-cpin` (groupe `dso`) ; pour la CI, `ci-cd` (groupe `dev`).

## 1. Docker & Kubernetes

### Bonnes pratiques

- Dockerfile **multi-stage** : stage de build + stage de prod, base légère (`alpine`/`slim`).
- Copier les **lock files puis les dépendances avant le code source** (cache layer).
- **USER non-root**, port exposé **≥ 1024**.
- Secrets par variables d'environnement ou secrets gérés — **jamais** dans le Dockerfile.

### Procédure

1. Identifier la stack (Node.js ou Python)
2. Créer le Dockerfile 2 stages (build + prod)
3. Base légère (`alpine` ou `slim`)
4. Lock files → dépendances → code source
5. `USER` non-root
6. Port ≥ 1024
7. Tester : `docker build -t test-app . && docker run --rm test-app`

### Pièges

- Jamais `root` en prod ; jamais de tag `latest`.
- Volumes de dev (`node_modules`, `.venv`) jamais montés en prod.
- `readOnlyRootFilesystem` peut casser les apps qui écrivent dans `/tmp`.
- **UID figé** : fonctionne en local, rejeté sur OpenShift.
- **Tag `latest`** : bloqué par les politiques Kyverno de CPiN en prod.
- **Image poussée depuis un poste** : interdit — les images sont construites par la chaîne DSO.

Détail : [`references/source-gouv-fr-deployment-docker-k8s.md`](references/source-gouv-fr-deployment-docker-k8s.md)

## 2. Cloud Pi Native

### Modèle mental

Deux chaînes : la **primaire** (vos outils : GitHub, CI, releases) contrôle et publie ; la **secondaire**
(GitLab DSO) reconstruit, analyse, signe et pousse dans **Harbor** ; **ArgoCD** déploie le dépôt d'infra.

Le pont est la **synchronisation** : un déclencheur (`sync-cpin`) lance le pipeline `mirror` du GitLab interne.
La **console** est la source de vérité (projets, dépôts, environnements, ArgoCD) : ce qui est modifié ailleurs
est ignoré ou écrasé.

### Éligibilité (avant de commencer)

Linux, **stateless**, configuration par variables d'environnement (même image partout), **rootless**, système
de fichiers en **lecture seule**, ports > 1024, logs sur stdout (JSON ou GELF), Dockerfile dans le dépôt, images
de base publiques ou reconstruites par la plateforme. Si un point manque, le corriger d'abord (*Build it, You
run it*).

### Boucle de livraison

1. Nouveau commit/version avec **tag d'image qui change** (SHA court ou version).
2. Synchronisation vers le GitLab CPiN (déclencheur ou bouton « Lancer la synchronisation »).
3. Pipeline DSO : secrets de chaîne, analyse Sonar, build Kaniko, scan Trivy, push et signature dans Harbor.
   Modèle : [`references/gitlab-ci-dso.yml`](references/gitlab-ci-dso.yml).
4. Mise à jour du tag dans le dépôt d'infra (values), puis synchronisation de ce dépôt.
5. ArgoCD applique → statut `Healthy`. *REFRESH* (relire GitLab) / *SYNC* (appliquer).

Tag inchangé ⇒ aucun diff ⇒ **aucun redéploiement**. Auto-sync désactivé ⇒ *SYNC* manuel obligatoire.

### Décisions fréquentes

| Question | Réponse |
|---|---|
| Où est l'image de référence ? | dans **Harbor** (construite et signée par la chaîne DSO) ; seuls `docker.io`, `harbor`, `registry.redhat.io`, `quay.io`, `bitnami`, `ghcr.io` sont acceptés par Kyverno |
| Secrets applicatifs ? | Vault via VSO (`VaultStaticSecret`, `vaultAuthRef: vault-auth`, mount `<organisation>-<projet>`) ou SOPS/age ; jamais en ConfigMap ni dans Git |
| Plusieurs branches/dépôts sur un environnement ? | fonctionnalité **Déploiements** (beta, console ≥ 9.25.0) ; dès qu'un déploiement existe il écrase la config des dépôts d'infra — tout reporter avant d'en créer un |
| Image tierce ? | seulement d'un registre public reconnu (ex. `bitnami/postgresql`) ; jamais poussée depuis un poste |

Détail, dépannage et limites :
[`references/source-gouv-fr-deployment-cloud-pi-native.md`](references/source-gouv-fr-deployment-cloud-pi-native.md),
[`references/depannage.md`](references/depannage.md).

## Vérification

- `docker build -t test .` passe ; `docker run --rm test` démarre sans crash.
- Trivy ne rapporte pas de CVE CRITICAL : `trivy image test`.
- Tester l'image en lecture seule avant de livrer : `docker run --read-only <image>`.
- Sur CPiN : ArgoCD `Healthy`, et le tag déployé correspond bien à celui construit par la chaîne DSO.
