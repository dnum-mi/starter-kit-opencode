---
type: point d'entrée de wiki
title: Démarrage rapide CI/CD, Helm et Cloud Pi Native
description: Carte d'orientation de la doc interne pour gérer un projet sur Cloud Pi Native avec fabnum-cicd et des charts Helm, avec routage par intention vers les pages et sources amont.
tags: [quickstart, navigation, cicd, helm, cpin]
---

# Démarrage rapide

Cette doc rassemble ce qu'il faut savoir pour amener un projet du **commit** à un **environnement Cloud Pi Native** : workflows GitHub Actions réutilisables
(`dnum-mi/fabnum-cicd`), charts Helm (`this-is-tobi/helm-charts`, exemple `IA-Generative/ocr-api`) et plateforme CPiN (cloud-pi-native.fr).
**Les sources amont font autorité** : ces pages sont un index de preuves, à recouper avec le code et la documentation officielle avant toute décision irréversible.

## Carte du wiki
1. [Glossaire](glossaire.md) — sigles et termes.
2. Principes : [modèle mental](principes/modele-mental.md), [fabnum-cicd](principes/philosophie-fabnum-cicd.md), [Helm](principes/philosophie-helm.md), [CPiN](principes/philosophie-cpin.md), [sécurité](principes/securite-transverse.md).
3. Cycle de vie : [du commit à l'environnement](cycle-de-vie/de-commit-a-environnement.md), [branches et versions](cycle-de-vie/branches-versions-releases.md), [CI](cycle-de-vie/integration-continue.md), [CD](cycle-de-vie/livraison-continue.md), [maintenance](cycle-de-vie/nettoyage-maintenance.md).
4. Décisions : [App vs PAT](decisions/github-app-vs-pat.md), [chart monorepo vs dédié](decisions/chart-monorepo-vs-depot-dedie.md), [ghcr vs Harbor](decisions/ghcr-vs-harbor.md), [secrets](decisions/secrets-vault-vs-sops.md), [monorepo](decisions/monorepo-vs-multi-repo.md), [pinning](decisions/pinning-versions.md), [dépendances](decisions/dependances-chart.md).
5. Référence [fabnum-cicd](cicd/index.md), [Helm](helm/index.md), [Cloud Pi Native](cloud-pi-native/index.md).
6. [Exemple ocr-api](exemples/ocr-api.md) et [constats et lacunes](constats.md).

## Concepts à retenir
- **Deux chaînes** : GitHub (primaire) contrôle et publie ; GitLab DSO (secondaire) reconstruit, signe, pousse dans Harbor ; ArgoCD déploie. Le pont est `sync-cpin`.
- **Nouveau tag ⇒ redéploiement** : sans changement de tag d'image, ArgoCD ne fait rien.
- **La console est la source de vérité** (dépôts, environnements, ArgoCD) : éditer ailleurs est écrasé ou ignoré.
- **Moindre privilège** : `GITHUB_TOKEN` d'abord, App ensuite, PAT en dernier ; jamais `secrets: inherit`.
- **Un chart est un contrat de values**, avec `extraObjects` en échappatoire ; le `template/` tobi se copie, il ne se dépend pas.
- **OpenShift** : rootless, UID alloué (pas de `runAsUser`/`fsGroup` figés), FS en lecture seule, ports > 1024, deny-all réseau.
- **Kyverno** : audit hors prod, **enforce en prod** — ce qui passe en dev peut être bloqué en prod (labels, probes, limits, pas de `latest`).

## Routage par intention
| Intention | Page à lire | Sources amont | Validation minimale |
|---|---|---|---|
| Comprendre le trajet complet d'un déploiement | [de-commit-a-environnement](cycle-de-vie/de-commit-a-environnement.md) | `ocr-api/.github/workflows/cd.yml`, `.gitlab-ci-dso.yml` ; `documentation/docs/services/gitops.md` | relire les 7 étapes contre `cd.yml` |
| Écrire un `ci.yml` | [integration-continue](cycle-de-vie/integration-continue.md), [contrat](cicd/contrat-des-workflows.md) | `ocr-api/.github/workflows/ci.yml` | `actionlint` puis PR de test |
| Écrire un `cd.yml` / releases | [livraison-continue](cycle-de-vie/livraison-continue.md), [release-et-charts](cicd/release-et-charts.md) | `fabnum-cicd/docs/workflows/50–57`, `90-monorepo-release.md` | run sur `dev` avec `release-created` |
| Ajouter un scan (Trivy, Gitleaks, Sonar) | [build-et-supply-chain](cicd/build-et-supply-chain.md) | `41-scan-trivy.md`, `42-scan-gitleaks.md` | permissions côté appelant, `CATEGORY` distinct |
| Choisir un credential GitHub | [github-app-vs-pat](decisions/github-app-vs-pat.md) | `05-authentication.md` | la CI se lance sur la PR de release |
| Créer / publier un chart | [anatomie-chart](helm/anatomie-chart.md), [publication](helm/publication-et-signature.md) | `helm-charts/template/`, `ocr-api/helm/` | `helm lint`, `helm template`, `lint-helm` |
| Un chart doit passer OpenShift/Kyverno | [securite-et-openshift](helm/securite-et-openshift.md), [contraintes-runtime](cloud-pi-native/contraintes-runtime.md) | `documentation/docs/agreement/kyverno.md` | `helm template` puis contrôle labels, probes, limits, tag |
| Pod rejeté en prod mais pas en dev | [contraintes-runtime](cloud-pi-native/contraintes-runtime.md) | `agreement/kyverno.md` | comparer AUDIT vs ENFORCE de la règle |
| Rendre l'image déployable | [ghcr-vs-harbor](decisions/ghcr-vs-harbor.md), [registre-artefacts-qualite](cloud-pi-native/registre-artefacts-qualite.md) | `services/artefacts.md`, `guide/images-sign.md` | image dans Harbor, signée |
| Gérer les secrets | [secrets-vault-vs-sops](decisions/secrets-vault-vs-sops.md), [secrets](cloud-pi-native/secrets.md) | `guide/secrets-vault.md`, `guide/secrets-management.md` | `VaultStaticSecret` synchronisé |
| Configurer un environnement / quotas | [environnements-quotas](cloud-pi-native/environnements-quotas.md) | `guide/environments-management.md` | somme des `limits` ≤ quota |
| Déployer plusieurs branches / dépôts | [deploiement-gitops](cloud-pi-native/deploiement-gitops.md) | `guide/deployment-management.md` | vérifier l'application dans ArgoCD |
| Synchroniser un dépôt vers CPiN | [depots-mirror-gitlab](cloud-pi-native/depots-mirror-gitlab.md), [release-et-charts](cicd/release-et-charts.md) | `72-sync-cpin.md`, `guide/repositories-management.md` | pipeline `mirror` verte |
| Logs, métriques, alertes | [exploitation-observabilite](cloud-pi-native/exploitation-observabilite.md) | `agreement/observability.md` | dashboards Grafana du bon périmètre |
| Voir un projet complet | [ocr-api](exemples/ocr-api.md) | dépôt `IA-Generative/ocr-api` (branche dev) | — |
