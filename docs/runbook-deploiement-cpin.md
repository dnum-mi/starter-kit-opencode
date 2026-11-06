# Déploiement sur Cloud Pi Native : le flow en schémas

Vue simplifiée du runbook suivi par le skill [`deploiement-cpin`](../.agents/skills/dso/deploiement-cpin/SKILL.md)
(groupe `dso`) et par l'agent `cpin-orchestrateur` (`/deployer-cpin`). Le détail des étapes, des commandes et du
dépannage reste dans le `SKILL.md` : ce document ne fait que montrer **l'enchaînement des phases et les
ramifications selon les réponses**.

> **Principe : vérifier avant le merge, pas au déploiement.** Chaque aller-retour « je déploie, je regarde, je
> corrige » coûte une release (vécu : 7 releases pour un hello world). Chaque phase se termine par une
> **porte** : on ne passe pas à la suivante tant qu'elle n'est pas franchie.

## Vue d'ensemble

```mermaid
flowchart TD
    P0["<b>Phase 0</b><br/>Éligibilité et architecture"]
    P1["<b>Phase 1</b><br/>Console CPiN et GitHub"]
    P2["<b>Phase 2</b><br/>Valeurs vitales dans values.yaml"]
    P3["<b>Phase 3</b><br/>Chart et CI vérifiés avant merge"]
    P4["<b>Phase 4</b><br/>Livrer"]
    P5["<b>Phase 5</b><br/>Vérifier après synchro"]
    FIN(["Mise en service close"])
    DEP["Dépannage<br/>symptôme → phase → correctif"]

    P0 -->|"porte : dépôts validés, port connu"| P1
    P1 -->|"porte : secrets GitHub posés, console relue"| P2
    P2 -->|"porte : values.yaml seul passe check-cpin-rules"| P3
    P3 -->|"porte : check-cpin-rules = 0 en local et en CI"| P4
    P4 --> P5
    P5 -->|"4 points OK"| FIN
    P5 -->|"un point KO"| DEP
    DEP -.->|"retour à la phase en cause"| P1
    DEP -.-> P2
    DEP -.-> P3
```

| Phase | Qui | Porte (condition pour passer à la suite) |
|-------|-----|------------------------------------------|
| 0 Éligibilité | vous | organisation des dépôts validée, port réellement écouté connu |
| 1 Console et GitHub | vous | secrets et variables GitHub posés, console relue ou confirmée valeur par valeur |
| 2 `values.yaml` | vous | le rendu de `values.yaml` seul passe `check-cpin-rules.py` |
| 3 Chart et CI | agents (`cpin-plan` → `cpin-build` → `cpin-review`) | `check-cpin-rules.py` sort en 0, en local **et** en CI |
| 4 Livrer | vous | déploiement lancé |
| 5 Vérifier | vous | ArgoCD `Synced` + `Healthy`, bonne image, endpoint de santé en 200, jetons révoqués |

## Phase 0 : éligibilité et architecture

L'application doit être Linux, **stateless**, configurée par variables d'environnement, **rootless**, en système
de fichiers **lecture seule**, écouter sur un port > 1024 et loguer en JSON sur stdout.

```mermaid
flowchart LR
    A{"Application éligible ?"}
    B["Adapter l'app :<br/>rootless, read-only,<br/>port > 1024, logs JSON"]
    C{"Organisation des dépôts"}
    D["2 dépôts : appli + infra privé<br/>values-env.yaml<br/>(recommandé)"]
    E["Monorepo ou<br/>branche par environnement<br/>(alternative)"]
    F(["Porte franchie"])

    A -->|non| B --> A
    A -->|oui| C
    C -->|recommandé| D --> F
    C -->|alternative| E --> F
```

## Phase 1 : console CPiN et GitHub

### Deux questions d'ouverture, avant tout jeton

Elles décident quel `DSO_TOKEN` créer, et s'il en faut un.

```mermaid
flowchart TD
    S{"Scripts du kit<br/>présents ?"}
    NS["Mode manuel proposé<br/>au lieu de s'arrêter<br/>(parcours sans scripts)"]
    T{"Plateforme cible ?"}
    I["console.mjs instance --set<br/>(l'humain donne l'URL de la console)"]
    M{"Création dans la console ?"}
    A["<b>Automatique</b> (recommandé)<br/>jetons → instance → questions →<br/>plan / oui / apply → secrets → debug"]
    MA["<b>Manuel</b><br/>mêmes questions →<br/>checklist manuelle →<br/>secrets posés à la main"]
    EX["<b>Déjà existant</b><br/>nom du projet et des dépôts,<br/>ni création ni checklist"]
    R{"DSO_TOKEN fourni<br/>pour la relecture ?"}
    SH["console.mjs show :<br/>relecture sans écriture"]
    H["Confirmation par l'humain,<br/>valeur par valeur<br/>(porte moins solide, dit explicitement)"]

    S -->|non| NS --> H
    S -->|oui| T
    T -->|"Scaleway SDID · RIE · autre"| I --> M
    M -->|"automatique"| A
    M -->|"manuel"| MA --> R
    M -->|"déjà existant"| EX --> R
    R -->|oui| SH
    R -->|non| H
```

### Mode automatique : simuler, confirmer, appliquer

L'agent pose toutes les questions **en une seule liste** (nom du projet, environnements, quotas, dépôts,
membres, debug automatisé), puis ne passe à l'écriture qu'après un « oui » explicite.

```mermaid
flowchart TD
    Q["Réponses à la liste de questions"]
    PLAN["console.mjs plan<br/>simulation, rien n'est écrit"]
    V{"Contraintes valides ?"}
    C{"L'humain dit oui ?"}
    APPLY["console.mjs apply --apply<br/>projet, environnements, dépôts, membres<br/>(rejouable : l'existant est réutilisé)"]
    RELU["Relecture de la console<br/>noms et quotas réels"]
    H["Relever le PROJECT_PATH Harbor réel<br/>(jamais déduit du nom du dépôt)"]

    Q --> PLAN --> V
    V -->|non| Q
    V -->|oui| C
    C -->|"non / correction"| Q
    C -->|"oui explicite"| APPLY --> RELU --> H
```

### Debug automatisé : toujours proposé

```mermaid
flowchart LR
    D{"Debug automatisé ?"}
    O["Noté : GITLAB_PAT à coller,<br/>ARGOCD_TOKEN écrit au login<br/>en phase 5"]
    N["Debug manuel via l'UI,<br/>rien n'est installé"]
    R["Reposer avant de quitter<br/>la phase 1"]
    P["Reproposer 1 fois par difficulté,<br/>en citant le check utile"]
    U["Ne plus insister,<br/>rester sur l'UI"]

    D -->|oui| O
    D -->|non| N
    D -->|"pas de réponse"| R --> D
    N -.->|"nouvelle difficulté<br/>sur un service externe"| P
    P -.->|"2 refus"| U
```

## Phase 2 : valeurs vitales dans `values.yaml`

Sur une console 9.9.0, le dépôt n'a **aucun réglage de fichiers values** : seul `values.yaml` est garanti chargé.
Il porte donc toutes les valeurs vitales (image Harbor, `registry-pull-secret`, ressources sous le quota,
labels, port, ingress avec son host réel). `values-<env>.yaml` n'est qu'un complément dont l'effet se constate
en phase 5.

```mermaid
flowchart LR
    V{"Version : la console expose<br/>un réglage de fichiers values ?"}
    A["Non (cas 9.9.0) :<br/>tout le vital dans values.yaml,<br/>aucune question"]
    B["Oui (autre instance) :<br/>l'humain le règle dans l'UI,<br/>l'agent ne le suppose pas"]

    V -->|non| A
    V -->|oui| B
```

## Phase 3 : chart et CI, vérifiés avant le merge

```mermaid
flowchart LR
    A["Chart<br/>skill helm-chart-cpin"] --> B["Pipeline DSO<br/>.gitlab-ci-dso.yml"]
    B --> C["helm template avec les mêmes<br/>fichiers et le même ordre<br/>que la console"]
    C --> D{"check-cpin-rules.py<br/>sort en 0 ?"}
    D -->|non| E["cpin-build corrige<br/>(3 essais au plus)"] --> C
    D -->|oui| F["Même check en job CI bloquant<br/>(dans les needs de all-jobs-passed)"]
    F --> G(["Porte franchie"])
```

## Phase 4 : livrer

```mermaid
flowchart TD
    C{"Qu'est-ce qui change ?"}
    A["Nouveau tag d'image → synchro →<br/>pipeline DSO (Kaniko, Trivy, Harbor) →<br/>tag dans les values → ArgoCD"]
    B["Release appli → synchro appli →<br/>PR de bump appVersion dans l'infra"]
    B2{"Pipeline DSO de<br/>l'image vert ?"}
    B3["Attendre / corriger"]
    B4["L'humain merge →<br/>synchro infra → ArgoCD"]
    D["Commit infra → synchro →<br/>REFRESH puis SYNC ArgoCD"]
    S{"Auto-sync actif ?"}
    M["SYNC manuel dans ArgoCD DSO"]
    OK(["Déploiement lancé"])

    C -->|"code, dépôt unique"| A
    C -->|"code, avec dépôt d'infra"| B
    C -->|"chart ou values seulement"| D
    B --> B2
    B2 -->|non| B3 --> B2
    B2 -->|oui| B4
    A --> S
    B4 --> S
    D --> S
    S -->|non| M --> OK
    S -->|oui| OK
```

Un tag d'image inchangé ne produit aucun diff pour ArgoCD, donc aucun redéploiement.

## Phase 5 : vérifier après la synchro

```mermaid
flowchart TD
    A["1. ArgoCD : application<br/>Synced et Healthy"] --> B["2. Pod via l'UI ArgoCD DSO :<br/>image Harbor attendue, limits réelles"]
    B --> C["3. L'endpoint de santé<br/>répond 200"]
    C --> D{"Les 3 points<br/>sont OK ?"}
    D -->|non| DEP["Dépannage : message d'erreur exact<br/>des événements → phase en cause"]
    D -->|oui| E["4. Clôture : révoquer DSO_TOKEN<br/>et tout jeton exposé ou d'essai"]
    E --> F["Attention : GH_PAT sert encore<br/>aux workflows, ne le révoquer<br/>qu'une fois remplacé"]
    F --> FIN(["Mise en service close"])
```

### Debug automatisé en phase 5

Les checks ne renvoient que des **statuts HTTP** : ils éliminent une cause (jeton expiré, service injoignable),
ils ne disent pas pourquoi un pod échoue.

```mermaid
flowchart TD
    Q{"Debug automatisé ?"}
    I["Une fois, avec accord :<br/>installer Playwright + Firefox (~100 Mo)"]
    L["login.mjs : connexion SSO<br/>dans le navigateur,<br/>token écrit dans .env.secrets"]
    LR{"Login réussi ?"}
    T{"Jetons présents pour<br/>chaque service ?"}
    CK["check-argocd · check-harbor ·<br/>check-gitlab · check-console"]
    R{"Statuts HTTP"}
    OK["Rapporter ce que<br/>chaque statut prouve"]
    A1["Un check échoue (401, 500…) :<br/>consulter le dépannage,<br/>proposer un correctif ou<br/>demander ce que montre l'UI"]
    B["Debug manuel via l'UI ArgoCD DSO :<br/>statut du pod, événements, image"]

    Q -->|oui| I --> L --> LR
    Q -->|non| B
    LR -->|"non / refusé"| B
    LR -->|oui| T
    T -->|"ARGOCD_TOKEN absent"| L
    T -->|"DSO_TOKEN ou GITLAB_PAT vide"| CK
    T -->|oui| CK
    CK --> R
    R -->|"tous 200"| OK
    R -->|"un check échoue"| A1
```

| Symptôme | Check | Ce que dit le statut |
|----------|-------|----------------------|
| Synchro qui échoue, dépôt absent du GitLab interne | `check-gitlab` | 200 : GitLab joignable, `GITLAB_PAT` valide ; 401 : jeton refusé |
| `ImagePullBackOff`, 401 au pull, image introuvable | `check-harbor` | 200 : Harbor joignable ; 401/403 : session SSO expirée |
| Application absente ou `OutOfSync` | `check-argocd` | 200 : API ArgoCD répond ; 401 : session SSO expirée |
| Projet, environnement ou dépôt non créé, quota | `check-console` | 200 : `DSO_TOKEN` valide ; 401 : expiré ou révoqué |

## Règles de l'agent, tout au long du runbook

- **Suivi visible** : une todo par phase, une seule « en cours », chaque message commence par
  `▶ Phase N/5 — <nom> · étape : <étape>`.
- **Jamais de valeur de secret** : l'humain colle les jetons dans `.cpin/.env.secrets`, l'agent vérifie seulement
  « renseigné » / « vide ».
- **La console CPiN est la source de vérité** : rien ne se modifie à la main dans l'UI ArgoCD ou le GitLab interne.
- **Pas de CLI de cluster** (`oc`, `kubectl`) : l'état réel se lit dans l'UI ArgoCD DSO ou la console.
- **Toute écriture dans la console** se fait après un « oui » explicite.
- **Les instances diffèrent** : relever la version réelle (`/api/v1/version`) avant de supposer un comportement ;
  une URL de service inconnue se relève, elle ne se déduit pas d'une autre instance.
