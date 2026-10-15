# Groupe `fr-gouv/interieur/devsecops` : CI/CD et déploiement

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["fr-gouv/interieur/devsecops"]`) ou par URL : voir le README.

## Périmètre

Mettre en production : CI/CD d'un dépôt GitHub existant en appelant les workflows réutilisables, conteneurs
et Kubernetes durcis, déploiement Cloud Pi Native, smoke-tests de pipeline, anti-régression des noms de
services.

Ancien nom de domaine : **dso**.

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `gouv-fr-repo-cicd` | Poser une CI/CD « Cloud Pi Native » sur un dépôt GitHub existant |
| `gouv-fr-deployment` | Dockerfiles de prod durcis, K8s/OpenShift, onboarding et livraison sur Cloud Pi Native |
| `gouv-fr-smoke-test` | Smoke-test rapide d'un pipeline (gateway + auth + ingester) |
| `gouv-fr-service-names` | Anti-régression des anciens noms de services (rebranding) |

## Règles

- **Jamais de tag `latest`**, jamais d'image poussée depuis un poste : les images sont construites et signées
  par la chaîne DSO.
- **Rootless** et système de fichiers en **lecture seule** ; ports > 1024 ; logs sur stdout.
- Secrets via Vault/VSO ou SOPS/age — **jamais** en ConfigMap ni dans Git.
- La **console Cloud Pi Native** est la source de vérité : ce qui est modifié ailleurs est ignoré ou écrasé.
- Un tag d'image inchangé ne redéploie rien.

Pour le chart Helm (gabarit, values par environnement, contrôles Kyverno), utiliser `helm-chart-cpin`
(groupe `dso`) ; pour la CI de base, `ci-cd` (groupe `dev`).
