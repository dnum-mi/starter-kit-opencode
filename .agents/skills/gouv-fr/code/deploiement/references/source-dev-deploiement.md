---
name: deploiement
description: Use when writing production Dockerfiles for Cloud Pi Native, hardening containers (rootless, read-only filesystem, tags) or setting up local Kubernetes development — for Helm charts use helm-chart-cpin and for the CPiN console, ArgoCD and pipeline use deploiement-cpin (dso group)
allowed-tools: Bash Read Write
---

# Déploiement Cloud Pi Native : images et conteneurs

Règles pour construire des images prêtes pour Cloud Pi Native (K8s/OpenShift) et développer en local.
Pour le **chart Helm**, utiliser **`helm-chart-cpin`** ; pour la **console, le mirror, le pipeline DSO et ArgoCD**, utiliser **`deploiement-cpin`** (groupe `dso`).

## Plateforme cible

[Cloud Pi Native](https://cloud-pi-native.fr) est le PaaS cible du Ministère de l'Intérieur, basé sur Kubernetes/OpenShift. Tout projet est conçu **dès sa création** pour :

- la **conteneurisation** de tous les services ;
- la **sécurité renforcée** avec un minimum de privilèges (**rootless**) ;
- la compatibilité **Kubernetes / OpenShift**.

## Docker — Images optimisées

### Règles

- Image de base légère : `*-alpine`, `*-slim`, ou `distroless`
- Utilisateur **non-root** ; sur OpenShift l'UID est **attribué au démarrage** : les fichiers doivent appartenir au groupe root (`chown -R <uid>:0`, `chmod -R g=u`)
- Build **multi-stage** — séparer dépendances de build et de production
- Pas de secrets, fichiers `.env` ou outils de développement dans l'image
- Port d'écoute **non privilégié** (> 1024, ex. `8080`)
- Ne jamais utiliser le tag `latest` (Kyverno le bloque en prod) — un tag versionné : version applicative, SHA court, ou digest
- Dockerfile **dans le dépôt** ; images de base publiques ou reconstruites par la plateforme
- Scanner les images avec [Trivy](https://trivy.dev/) en CI

### Exemple Dockerfile Node.js

```dockerfile
FROM docker.io/node:24-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM docker.io/nginxinc/nginx-unprivileged:1.29-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
USER 1001
```

### securityContext Kubernetes

```yaml
# Niveau conteneur (spec.containers[].securityContext)
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true      # chemins inscriptibles (/tmp…) en emptyDir
  allowPrivilegeEscalation: false
  capabilities:
    drop: [ALL]
  seccompProfile:
    type: RuntimeDefault
```

**Ne pas figer `runAsUser`, `runAsGroup` ni `fsGroup` sur OpenShift/CPiN** : le SCC alloue l'UID par namespace et rejette un UID hors plage. Sur un Kubernetes simple (Kind, k3d), on peut les fixer.
Détail et surcharge du chart : `helm-chart-cpin`.

## Développement local

### Docker Compose (défaut)

Docker Compose est suffisant et recommandé pour le développement quotidien.

### Kubernetes local (optionnel)

Pour reproduire un environnement proche de la production :

| Outil | Description |
|-------|-------------|
| [Kind](https://kind.sigs.k8s.io/) | Kubernetes dans des conteneurs Docker |
| [k3d](https://k3d.io/) | k3s dans Docker — léger et rapide |
| [Minikube](https://minikube.sigs.k8s.io/) | Cluster K8s local, multi-drivers |

Tester l'image en lecture seule avant de livrer : `docker run --read-only <image>`.

## Pièges

- **`readOnlyRootFilesystem: true`** — vérifier que l'application n'écrit pas dans le filesystem (logs, tmp) avant de l'activer
- **UID figé** — fonctionne en local, rejeté sur OpenShift
- **Tag `latest`** — bloqué par les politiques Kyverno de CPiN en prod
- **Image poussée depuis un poste** — interdit : les images sont construites par la chaîne DSO (voir `deploiement-cpin`)
