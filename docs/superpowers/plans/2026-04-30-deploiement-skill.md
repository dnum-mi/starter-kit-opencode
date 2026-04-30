# Skill `deploiement` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer la skill `deploiement` couvrant Docker, Helm et les exigences Cloud Pi Native, et supprimer la section `## Deployment` dupliquée de `conventions-cofabnum`.

**Architecture:** Deux tâches indépendantes et séquentielles — création du nouveau fichier SKILL.md, puis suppression ciblée d'une section dans un fichier existant. Aucune dépendance code ; le "test" est la vérification manuelle du contenu et du frontmatter YAML.

**Tech Stack:** Markdown, YAML frontmatter, shell pour vérification

---

## File Map

| Action | Fichier |
|--------|---------|
| Créer | `.agents/skills/deploiement/SKILL.md` |
| Modifier | `.agents/skills/conventions-cofabnum/SKILL.md` |

---

### Task 1 : Créer `.agents/skills/deploiement/SKILL.md`

**Files:**
- Create: `.agents/skills/deploiement/SKILL.md`

- [ ] **Step 1 : Vérifier que le dossier parent existe**

```bash
ls .agents/skills/
```

Résultat attendu : liste des skills existantes, pas de dossier `deploiement/`.

- [ ] **Step 2 : Créer le fichier SKILL.md**

Créer `.agents/skills/deploiement/SKILL.md` avec le contenu suivant (contenu complet) :

```markdown
---
name: deploiement
description: Use when targeting Cloud Pi Native, configuring Kubernetes/OpenShift deployment, writing Dockerfiles for production, or setting up Helm charts
allowed-tools: Bash Read Write
---

# Déploiement Cloud Pi Native

Conventions et exigences pour déployer sur Cloud Pi Native (K8s/OpenShift).

## Plateforme cible

[Cloud Pi Native](https://cloud-pi-native.fr) est le PaaS cible du Ministère de l'Intérieur, basé sur Kubernetes/OpenShift. Tout projet doit être conçu **dès sa création** pour :

- la **conteneurisation** de tous les services ;
- la **sécurité renforcée** avec un minimum de privilèges (**rootless**) ;
- la compatibilité **Kubernetes / OpenShift**.

## Docker — Images optimisées

### Règles

- Image de base légère : `*-alpine`, `*-slim`, ou `distroless`
- Utilisateur **non-root** (UID ≥ 1000)
- Build **multi-stage** — séparer dépendances de build et de production
- Pas de secrets, fichiers `.env` ou outils de développement dans l'image
- Port d'écoute **non privilégié** (≥ 1024, ex. `8080`)
- Ne jamais utiliser le tag `latest` en production — toujours épingler un tag précis
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
securityContext:
  runAsNonRoot: true
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: [ALL]
```

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

## Helm charts

### Pourquoi Helm

- **Paramétrage** par environnement via `values.yaml` sans dupliquer les manifests
- **Reproductibilité** : chart versionné = déploiements identiques
- **Rollback** en une commande
- Compatible nativement avec Cloud Pi Native, ArgoCD, FluxCD

### Template de référence

[**this-is-tobi/helm-charts/template**](https://github.com/this-is-tobi/helm-charts/tree/main/template) — template Helm générique couvrant Deployment, Service, Ingress, HPA, ConfigMap, Secret, ServiceAccount.

### Structure minimale

```
helm/
├── Chart.yaml            # Métadonnées (nom, version, appVersion)
├── values.yaml           # Valeurs par défaut
├── templates/
│   ├── _helpers.tpl      # Labels et fonctions réutilisables
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   ├── hpa.yaml
│   └── serviceaccount.yaml
└── values/               # (optionnel) values par environnement
    ├── dev.yaml
    ├── staging.yaml
    └── prod.yaml
```

### Bonnes pratiques Helm

- Utiliser les labels standards `app.kubernetes.io/*` via `_helpers.tpl`
- Rendre les ressources optionnelles avec des conditions (`{{- if .Values.ingress.enabled }}`)
- Versionner le chart indépendamment de l'application (`version` ≠ `appVersion`)
- Valider en CI : `helm lint` + `helm template`
- Secrets via **Vault** (fourni par CPiN) — ne jamais mettre de secrets en clair dans `values.yaml`

### Naming des ressources K8s

Noms courts — les noms trop longs peuvent bloquer le déploiement sur OpenShift.

| Ressource | Pattern |
|-----------|---------|
| Deployment | `env-ms-dep` |
| Service | `env-ms-svc` |
| StatefulSet | `env-ms-sts` |
| ConfigMap | `env-ms-cm` |
| Secret | `env-secret` |
| CronJob | `env-name-cj` |
| PVC | `env-name-pvc` |

## Cloud Pi Native — Exigences spécifiques

### Structure des dépôts

Cloud Pi Native distingue deux types de dépôts :

| Type | Contenu | Prérequis |
|------|---------|-----------|
| Applicatif | Code source + Dockerfile | Fichier `.gitlab-ci-dso.yaml` obligatoire |
| Infrastructure | Helm charts / Kustomize / manifests | Déployé via ArgoCD |

Un seul dépôt peut remplir les deux rôles.

### Tags d'images

Les images doivent être taguées avec un identifiant basé sur le SHA Git — jamais `latest` :

```
CI_COMMIT_SHORT_SHA   # ex. a1b2c3d4
CI_COMMIT_SHA         # SHA complet
CI_COMMIT_TAG         # tag Git si existant
```

### `registry-pull-secret`

La console CPiN crée automatiquement un secret `registry-pull-secret` dans chaque namespace pour tirer les images depuis Harbor. Le référencer dans les Deployments :

```yaml
imagePullSecrets:
  - name: registry-pull-secret
```

### Labels obligatoires MIOM

Toutes les ressources K8s doivent porter ces labels :

```yaml
labels:
  app: "<nom-application>"
  env: "<dev|formation|qualif|test|preprod|prod>"
  tier: "<frontend|backend|db|cache|auth>"
  criticality: "<high|medium|low>"
  component: "<nginx|node|postgres|redis|...>"
```

### Liveness & Readiness probes

Obligatoires sur tous les Deployments :

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 3
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 3
  periodSeconds: 5
```

### Resources limits/requests

Obligatoires. Préférer `Guaranteed` QoS (limits = requests) :

```yaml
resources:
  limits:
    memory: "256Mi"
    cpu: "500m"
  requests:
    memory: "256Mi"
    cpu: "500m"
```

### Network policies

Les namespaces CPiN sont en **Deny ALL** par défaut. Définir explicitement les flux nécessaires :

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: allow-ingress-frontend
spec:
  podSelector:
    matchLabels:
      tier: frontend
  ingress:
    - ports:
        - port: 8080
```

### Autres exigences

- **Stateless** : pas d'état en mémoire locale — utiliser Redis ou un service externe
- **Logs** : écrire uniquement sur `stdout`, format JSON ou GELF — jamais dans un fichier
- **ArgoCD GitOps** : les modifications de `target revision`, `path` et `values files` se font **depuis la console CPiN**, pas depuis l'UI ArgoCD

## Gotchas

- **`.gitlab-ci-dso.yaml` manquant** — le dépôt applicatif ne sera pas traité par la CI CPiN sans ce fichier
- **Tag `latest`** — bloqué par les politiques Kyverno de CPiN ; toujours utiliser un SHA
- **Sealed Secrets** — CPiN fournit Vault, pas Sealed Secrets ; ne pas confondre
- **Noms trop longs** — peuvent empêcher le déploiement sur OpenShift ; rester court et préfixer par l'env
- **Network policies oubliées** — l'application sera injoignable en Deny ALL ; déclarer ingress/egress dès le départ
- **Modifier ArgoCD depuis l'UI** — ignoré depuis la version 9.11.5 de la console CPiN ; tout passer par la console
- **`readOnlyRootFilesystem: true`** — vérifier que l'application n'écrit pas dans le filesystem (logs, tmp) avant d'activer
- **`resources.limits` absent** — les pods peuvent être évincés en cas de pression mémoire sur le nœud
```

- [ ] **Step 3 : Vérifier le frontmatter YAML**

```bash
head -6 .agents/skills/deploiement/SKILL.md
```

Résultat attendu :
```
---
name: deploiement
description: Use when targeting Cloud Pi Native, configuring Kubernetes/OpenShift deployment, writing Dockerfiles for production, or setting up Helm charts
allowed-tools: Bash Read Write
---
```

- [ ] **Step 4 : Vérifier les sections principales**

```bash
grep "^## " .agents/skills/deploiement/SKILL.md
```

Résultat attendu :
```
## Plateforme cible
## Docker — Images optimisées
## Développement local
## Helm charts
## Cloud Pi Native — Exigences spécifiques
## Gotchas
```

- [ ] **Step 5 : Commit**

```bash
git add .agents/skills/deploiement/SKILL.md
git commit -m "feat: ajout skill deploiement (Cloud Pi Native, Docker, Helm)"
```

---

### Task 2 : Supprimer la section `## Deployment` de `conventions-cofabnum`

**Files:**
- Modify: `.agents/skills/conventions-cofabnum/SKILL.md`

- [ ] **Step 1 : Localiser la section à supprimer**

```bash
grep -n "^## " .agents/skills/conventions-cofabnum/SKILL.md
```

Repérer les lignes correspondant à `## Deployment` et `## POC → Production` pour identifier l'intervalle exact à supprimer.

- [ ] **Step 2 : Vérifier le contenu de la section**

Lire les lignes entre `## Deployment` et `## POC → Production` pour confirmer qu'elles ne contiennent que les règles Docker/Kubernetes dupliquées (base légère, non-root, multi-stage, Helm obligatoire, structure `helm/`).

- [ ] **Step 3 : Supprimer la section `## Deployment`**

Supprimer le bloc depuis la ligne `## Deployment` (incluse) jusqu'à la ligne précédant `## POC → Production` (exclue).

Le fichier doit passer directement de la section précédente à `## POC → Production`.

- [ ] **Step 4 : Vérifier que `## POC → Production` est intact**

```bash
grep -n "^## " .agents/skills/conventions-cofabnum/SKILL.md
```

Résultat attendu : `## Deployment` absent, `## POC → Production` présent.

- [ ] **Step 5 : Vérifier qu'aucun contenu utile n'a été supprimé**

```bash
grep -n "POC\|Rollback\|Pydantic\|Prisma\|healthcheck\|OpenAPI" .agents/skills/conventions-cofabnum/SKILL.md
```

Résultat attendu : les lignes de la checklist POC → Production sont toujours présentes.

- [ ] **Step 6 : Commit**

```bash
git add .agents/skills/conventions-cofabnum/SKILL.md
git commit -m "refactor: suppression section Deployment dupliquée dans conventions-cofabnum"
```
