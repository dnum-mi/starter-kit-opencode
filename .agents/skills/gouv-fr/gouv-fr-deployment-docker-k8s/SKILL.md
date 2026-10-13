---
name: gouv-fr-deployment-docker-k8s
description: "Docker rootless, K8s securityContext, multi-stage, tags, local K8s dev. Pour Helm : gouv-fr-helm-chart. Pour CPiN console/ArgoCD : gouv-fr-deployment-cloud-pi-native."
category: devops
version: 0.2.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, deployment, docker, kubernetes, helm, rootless, securitycontext, cpin, cloud-pi-native]
    related_skills: [gouv-fr-deployment-docker-k8s, gouv-fr-helm-chart, gouv-fr-outils-developpement, gouv-fr-stack-technique]
---

# Gouv-fr — Déploiement Docker & Kubernetes

Règles pour construire des images prêtes pour Cloud Pi Native (K8s/OpenShift) et développer en local.

## Quand utiliser
- Créer un Dockerfile pour un projet Fabrique Numérique
- Déployer sur Kubernetes ou OpenShift

Pour le **chart Helm**, utiliser **`gouv-fr-helm-chart`** ; pour la **console, le mirror, le pipeline DSO et ArgoCD**,
utiliser **`gouv-fr-deployment-cloud-pi-native`** (groupe `dso`).

## Prérequis
- Docker installé pour le build local
- kubectl/kind/k3d pour le testing local K8s
- Dockerfile existant dans le projet

## Comment lancer
- Build : `docker build -t ghcr.io/org/app:tag .`
- Test local : `kind create cluster` ou `k3d cluster create`
- Déploiement : voir `gouv-fr-helm-chart` (chart) et `gouv-fr-deployment-cloud-pi-native` (console, ArgoCD)

## Plateforme cible

[Cloud Pi Native](https://cloud-pi-native.fr) est le PaaS cible du Ministère de l'Intérieur, basé sur
Kubernetes/OpenShift. Tout projet est conçu **dès sa création** pour :

- la **conteneurisation** de tous les services ;
- la **sécurité renforcée** avec un minimum de privilèges (**rootless**) ;
- la compatibilité **Kubernetes / OpenShift**.

## Référence rapide — Bonnes pratiques

### Docker (obligatoire, rootless)

- Image de base légère : `*-alpine`, `*-slim` ou `distroless`
- Utilisateur **non-root** ; sur OpenShift l'UID est **attribué au démarrage** : les fichiers doivent appartenir au groupe root (`chown -R <uid>:0`, `chmod -R g=u`)
- Build **multi-stage** — séparer dépendances de build et de production
- Pas de secrets, fichiers `.env` ou outils de développement dans l'image
- Port d'écoute **non privilégié** (> 1024, ex. `8080`)
- Ne jamais utiliser le tag `latest` (Kyverno le bloque en prod) — un tag versionné : version applicative, SHA court, ou digest
- Dockerfile **dans le dépôt** ; images de base publiques ou reconstruites par la plateforme
- Scanner les images avec [Trivy](https://trivy.dev/) en CI

### Dockerfile optimisé (exemple Node.js)

```dockerfile
# Build stage
FROM docker.io/node:24-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production
FROM docker.io/nginxinc/nginx-unprivileged:1.29-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
USER 1001
```

### Dockerfile optimisé (exemple Python/FastAPI)

```dockerfile
# Build stage
FROM docker.io/python:3.12-slim AS build
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN pip install --no-cache-dir uv
RUN uv sync --frozen --no-dev
COPY . .

# Production
FROM docker.io/python:3.12-slim AS prod
WORKDIR /app
COPY --from=build /app/.venv /app/.venv
COPY --from=build /app/app /app/app
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8080
USER 1000
CMD ["fastapi", "run", "app/main.py"]
```

### Kubernetes — securityContext

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

**Ne pas figer `runAsUser`, `runAsGroup` ni `fsGroup` sur OpenShift/CPiN** : le SCC alloue l'UID par namespace et
rejette un UID hors plage. Sur un Kubernetes simple (Kind, k3d), on peut les fixer.
Détail et surcharge du chart : `gouv-fr-helm-chart`.

## Procedure — Créer un Dockerfile multi-stage

1. Identifier la stack (Node.js ou Python)
2. Créer un Dockerfile avec 2 stages (build + prod)
3. Utiliser une base légère (`alpine` ou `slim`)
4. Copier les lock files puis les dépendances avant le code source (cache layer)
5. Définir USER non-root
6. Exposer un port ≥ 1024
7. Tester : `docker build -t test-app . && docker run --rm test-app`

## Pièges
- Ne jamais utiliser `root` dans le conteneur de prod
- Ne jamais utiliser `latest` pour les images
- Les secrets doivent venir d'environnement ou de secrets gérés (pas dans le Dockerfile)
- Les volumes de dev (`node_modules`, `.venv`) ne doivent pas être montés en prod
- `readOnlyRootFilesystem` peut casser les apps qui écrivent dans `/tmp` — vérifier les besoins
- **UID figé** — fonctionne en local, rejeté sur OpenShift
- **Tag `latest`** — bloqué par les politiques Kyverno de CPiN en prod
- **Image poussée depuis un poste** — interdit : les images sont construites par la chaîne DSO

## Vérification
- `docker build -t test .` passe sans erreur
- `docker run --rm test` démarre sans se crasher
- Trivy ne rapporte pas de CVE CRITICAL : `trivy image test`
- Tester l'image en lecture seule avant de livrer : `docker run --read-only <image>`
