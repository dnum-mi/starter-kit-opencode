# Design : skill `deploiement`

**Date** : 2026-04-30  
**Sources** :
- [dnum-mi/transversal-doc — conventions/deploiement.md](https://github.com/dnum-mi/transversal-doc/blob/main/docs/conventions/deploiement.md)
- [cloud-pi-native.fr — Guide d'utilisation / Bonnes pratiques](https://cloud-pi-native.fr/guide/best-practices)
- [cloud-pi-native.fr — Déploiement de votre application (ArgoCD)](https://cloud-pi-native.fr/guide/deployment-with-argo)

## Objectif

Créer une skill dédiée au déploiement Cloud Pi Native / Kubernetes dans `.agents/skills/deploiement/SKILL.md`, et supprimer la section `## Deployment` de `conventions-cofabnum` qui fait doublon.

## Fichiers concernés

| Fichier | Action |
|---------|--------|
| `.agents/skills/deploiement/SKILL.md` | Créer |
| `.agents/skills/conventions-cofabnum/SKILL.md` | Modifier (supprimer section `## Deployment`) |

## Skill `deploiement` — contenu

### Frontmatter

```yaml
name: deploiement
description: Use when targeting Cloud Pi Native, configuring Kubernetes/OpenShift deployment, writing Dockerfiles for production, or setting up Helm charts
allowed-tools: Bash Read Write
```

### Sections

1. **Plateforme cible** — Cloud Pi Native (PaaS open source K8s), principe "conteneuriser dès la création", compatibilité K8s/OpenShift rootless.

2. **Docker — images optimisées** :
   - Base légère (`*-alpine`, `*-slim`, `distroless`)
   - Utilisateur non-root (UID ≥ 1000)
   - Build multi-stage (séparation build/prod)
   - Pas de secrets ni fichiers de dev
   - Port non privilégié (≥ 1024)
   - Exemple Dockerfile Node.js complet (build → nginxinc/nginx-unprivileged)
   - `securityContext` K8s restrictif (runAsNonRoot, readOnlyRootFilesystem, allowPrivilegeEscalation: false, drop: ALL)
   - Jamais `latest` en prod — toujours un tag précis
   - Scanner avec Trivy en CI

3. **Développement local** :
   - Docker Compose — suffisant et par défaut pour le développement quotidien
   - Tableau K8s local optionnel : Kind, k3d, Minikube (description, usage)

4. **Helm charts** :
   - Pourquoi Helm : paramétrage par `values.yaml`, reproductibilité, rollback, compatibilité Cloud Pi Native/ArgoCD/FluxCD
   - Template de référence : `this-is-tobi/helm-charts/template`
   - Structure minimale : `helm/Chart.yaml`, `values.yaml`, `templates/`, `values/` (optionnel)
   - Bonnes pratiques : labels standards `app.kubernetes.io/*`, ressources optionnelles avec conditions, versionnage chart ≠ appVersion, `helm lint` + `helm template` en CI
   - Naming conventions K8s : noms courts, pattern `env-ms-dep`, `env-ms-svc`, `env-ms-cm`, etc.
   - Secrets via **Vault** (CPiN fournit Vault par projet — ne pas utiliser Sealed Secrets)

5. **Cloud Pi Native — exigences spécifiques** :
   - **Deux dépôts** : dépôt applicatif (code + Dockerfile + `.gitlab-ci-dso.yaml`) et dépôt d'infrastructure (Helm/Kustomize/manifests déployé via ArgoCD)
   - **Image tagging** : tags basés sur le SHA Git (`CI_COMMIT_SHORT_SHA`, `CI_COMMIT_SHA`) — jamais `latest`
   - **`registry-pull-secret`** : créé automatiquement par la console CPiN, à référencer dans les manifests
   - **Labels obligatoires MIOM** sur toutes les ressources K8s : `env` (dev/qualif/preprod/prod), `tier` (frontend/backend/db/cache/auth), `criticality` (high/medium/low), `component` (nginx/node/postgres/redis/…)
   - **Liveness/Readiness probes** obligatoires sur tous les Deployments
   - **Resources limits/requests** obligatoires — préférer `Guaranteed` QoS (limits = requests)
   - **Network policies** : Deny ALL par défaut — définir explicitement les flux ingress/egress nécessaires
   - **Stateless** : aucun état en mémoire locale — utiliser Redis/session store externe si nécessaire
   - **Logs** : stdout uniquement, format JSON/GELF — jamais de fichier de log dans le conteneur
   - **ArgoCD GitOps** : les modifications de `target revision`, `path` et `values files` se font depuis la console CPiN, pas depuis l'UI ArgoCD

6. **Gotchas** (section finale) : points d'attention courants tirés des deux sources

### Format

Identique aux skills existantes : titres H2/H3, tableaux, blocs de code commentés, section Gotchas en fin de fichier.

## Cleanup `conventions-cofabnum`

**Supprimer** la section `## Deployment` (lignes 338–366 actuelles) :
- Docker rules (base légère, non-root, multi-stage, secrets, ports, no latest, Trivy)
- Kubernetes minimal (Helm obligatoire, structure `helm/`)

**Conserver** la section `## POC → Production` (checklist passage en production) : contexte différent, complémentaire.

**Pas de cross-référence** à ajouter : la `description` de la nouvelle skill suffit pour que l'agent l'invoque automatiquement.

## Critères de succès

- La skill `deploiement` est invoquée quand on écrit un Dockerfile ou configure un Helm chart pour Cloud Pi Native / K8s
- Aucune règle Docker, Helm ou CPiN n'est perdue après le cleanup
- Les exigences CPiN spécifiques (labels, probes, Vault, naming, `.gitlab-ci-dso.yaml`) sont clairement documentées
- Le contenu respecte la longueur et le style des autres skills (concis, tableaux, code examples)
