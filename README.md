# CoFabNum Agent Skills

Skills, instructions et agents pour coder et déployer selon les conventions de la
[Fabrique Numérique](https://docs.fabrique-numerique.fr/) et sur [Cloud Pi Native](https://cloud-pi-native.fr).

- Les **skills** suivent le standard [Agent Skills](https://agentskills.io/specification) : ils marchent avec
  OpenCode, Claude Code, Codex, etc.
- Tout le kit s'installe dans **OpenCode** (plugin) et dans **Claude Code** (marketplace de plugins) : socle,
  instructions, skills, agents, commandes et garde-fous.
- Les agents et les commandes sont écrits une seule fois, au format OpenCode (`opencode/`) ; leur version
  Claude Code (`claude/`) en est générée.

## Contenu

Le dépôt est découpé en un **socle** commun et des **groupes** à installer séparément.

| Partie | Contenu | Sert à |
|--------|---------|--------|
| Socle | `AGENTS.md` | conventions communes : git, commits, TS, Python, lint, REST, Docker |
| Groupe `dev` | `.agents/skills/dev/` | développer une application : front Vue/Nuxt + DSFR, back NestJS/Fastify/FastAPI, monorepo, poste dev |
| | `opencode/agents/dev/`, `opencode/commands/dev/` | `/livrer` : implémenter un plan, vérifié avant et après |
| Groupe `dso` | `.agents/skills/dso/` | CI/CD fabnum-cicd, chart Helm, déploiement Cloud Pi Native |
| | `opencode/agents/dso/`, `opencode/commands/dso/` | `/deployer-cpin` : déployer selon le runbook, avec des portes |
| Plugin | `plugin/starter-kit.js` | installe le socle et les groupes choisis dans OpenCode |
| Marketplace | `.claude-plugin/marketplace.json` | installe le socle et les groupes choisis dans Claude Code |
| | `claude/` | agents et commandes générés pour Claude Code, hook qui applique leurs permissions |

```
.agents/skills/
├── dev/                            instructions.md + index.json
│   ├── conventions-cofabnum/       nommage, architecture, TypeScript, API, lint, POC→prod
│   ├── recettes-serveur/           NestJS, Fastify, FastAPI
│   ├── recettes-client/            Vue 3, Nuxt 3, DSFR, toaster
│   ├── stack-technique/            ESLint, Prisma, REST Client
│   ├── monorepo/                   pnpm workspaces, Turborepo
│   ├── ci-cd/                      principes CI/CD, gabarit de base
│   ├── deploiement/                Dockerfiles de prod, durcissement, K8s local
│   ├── environnement-installation/ Windows/WSL, macOS, Ubuntu
│   └── outils-dev/                 Git, Docker, pnpm, proto, VS Code, GitHub CLI, zsh
└── dso/                            instructions.md + index.json
    ├── cicd-fabnum/                workflows fabnum-cicd, releases, synchro sync-cpin
    ├── helm-chart-cpin/            chart tobi + surcharge CPiN, check-cpin-rules.py
    └── deploiement-cpin/           runbook en phases avec portes, dépannage
```

## Prérequis

**Obligatoire** : sans eux, le kit ne se charge pas.

| Il faut | Pourquoi |
|---------|----------|
| OpenCode **≥ 1.18** (testé en 1.18.35) | le plugin s'appuie sur le runtime Bun embarqué (`Bun.YAML`) |
| **ou** Claude Code **≥ 2.1.275** (testé en 2.1.306) | marketplace de plugins, dépendances entre plugins |
| `git` et un accès à github.com | le client télécharge le plugin |
| Node **≥ 20.11**, avec Claude Code seulement | le hook qui applique les permissions des agents du kit : sans Node, il ne tourne pas et les agents n'ont **aucun** garde-fou (`doctor` le signale) |
| un modèle qui sait appeler des outils | testé avec DeepSeek V4 Flash (Albert) : agents et prompts sont écrits pour qu'un modèle modeste les suive à la lettre |

**Optionnel** : sans eux, le kit marche en **mode dégradé**. L'agent vous propose d'installer l'outil
manquant ou de continuer sans lui.

| Outil | Sert à | Sans lui |
|-------|--------|----------|
| Node **≥ 20.11** | scripts `cpin-console` et `cpin-debug` (console, Vault, debug) | mode **manuel** du runbook `deploiement-cpin` : l'humain fait les étapes dans la console |
| `gh` authentifié | vérifier et poser les secrets et variables GitHub | l'humain les pose dans l'UI GitHub et confirme les noms |
| scope `workflow` du jeton `gh` | pousser des fichiers `.github/workflows/` | l'humain pousse ces fichiers lui-même (`gh auth refresh -s workflow` pour l'ajouter) |
| `helm`, `uv` | lancer `check-cpin-rules.py`, la porte de la phase 3 de `/deployer-cpin` | pas de mode dégradé : **à installer avant la phase 3** (le reste du kit marche sans) |
| Playwright + Firefox (~100 Mo) | debug automatisé ArgoCD, Harbor, GitLab (login SSO) | debug par l'UI ; **non installés par le plugin** : `make install-debug` |

Pour `/livrer` (dev), il faut en plus les outils **du projet** (Node et npm/pnpm, ou `uv`) et ses scripts
`build`/`typecheck`/`lint`/`test` : la review ne lance que ceux qui existent. Pour `/deployer-cpin` (dso), il faut
un accès à la **console CPiN** ; les jetons et secrets sont détaillés dans le runbook `deploiement-cpin`.

Vérifier le poste et installer le debug, depuis le dossier du kit (`<kit>` : le dossier
`starter-kit-opencode@…` de `~/.cache/opencode/packages/` avec le plugin, sinon votre clone) :

```bash
make -C <kit> doctor          # obligatoire absent : code 1 ; optionnel absent : avertissement + mode dégradé
make -C <kit> install-debug   # Playwright + Firefox, dans le kit
```

`doctor` n'installe rien et n'affiche aucun jeton. Pour chaque outil absent, il donne la commande d'installation.

## Installer

Quatre façons, qui n'apportent pas la même chose :

| | Plugin OpenCode (recommandé) | URL dans `opencode.json` | Plugin Claude Code | Copie des skills |
|---|:---:|:---:|:---:|:---:|
| Client | OpenCode | OpenCode | Claude Code | tout client Agent Skills |
| Socle `AGENTS.md` + `instructions.md` du groupe | ✅ | ✅ | ✅ | ❌ |
| Skills et leurs scripts | ✅ | ✅ | ✅ | ✅ |
| Agents et commandes (`/livrer`, `/deployer-cpin`) | ✅ | ❌ | ✅ | ❌ |

Ne combinez pas deux façons dans le même client : le contenu serait chargé deux fois.

### 1. Plugin (OpenCode)

Dans le `opencode.json` du projet, ou dans `~/.config/opencode/opencode.json` :

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    ["starter-kit-opencode@git+https://github.com/dnum-mi/starter-kit-opencode.git", { "groups": ["dev", "dso"] }]
  ]
}
```

- `groups` vaut `["dev"]` par défaut. Un groupe non listé n'est pas chargé du tout : ni instructions, ni skills, ni agents.
- Le plugin suit `main`. Pour figer une version : `…starter-kit-opencode.git#<sha>`.
- OpenCode garde le paquet en cache. Pour récupérer une mise à jour de `main`, supprimer le dossier
  `starter-kit-opencode@…` dans `~/.cache/opencode/packages/`, puis relancer OpenCode.

### 2. URL (OpenCode, sans agents)

```json
{
  "instructions": [
    "https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/AGENTS.md",
    "https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/.agents/skills/dev/instructions.md"
  ],
  "skills": {
    "urls": ["https://raw.githubusercontent.com/dnum-mi/starter-kit-opencode/main/.agents/skills/dev/"]
  }
}
```

Remplacer `dev` par `dso`, ou ajouter les deux.

> Le groupe `dso` automatise la console CPiN via `scripts/cpin-console` et `scripts/cpin-debug`, qui ne sont
> **pas** distribués par cette installation (instructions et skills seulement). Pour les utiliser, passer par
> l'installation plugin (§1) ou cloner le kit.

### 3. Plugin (Claude Code)

Le dépôt est aussi une marketplace Claude Code, `starter-kit`, qui propose un plugin par groupe :

```bash
claude plugin marketplace add dnum-mi/starter-kit-opencode
claude plugin install dev@starter-kit     # et/ou dso@starter-kit
```

Ou en une étape, dans une session (Claude Code ≥ 2.1.275) :

```
/plugin install dev --marketplace dnum-mi/starter-kit-opencode
/plugin install dso --marketplace dnum-mi/starter-kit-opencode
```

- `marketplace add` n'enregistre que le catalogue : tant qu'un `install` n'a pas eu lieu, `/plugin` liste les
  plugins du kit (onglet *Discover*) mais aucun skill n'est chargé. Après l'installation, `/reload-plugins` puis
  `claude plugin list` doit afficher `dev@starter-kit` (et `socle@starter-kit`) comme `enabled`.
- `dev` et `dso` installent d'office le plugin `socle` (`AGENTS.md`). Le socle et le `instructions.md` du groupe
  sont injectés au démarrage de chaque session.
- Tout est préfixé par le groupe : skills (`dso:deploiement-cpin`), sous-agents (`dev:dev-review`), commandes
  (`/dev:livrer`, `/dso:deployer-cpin`).
- Le plugin `socle` installe un hook qui applique aux agents du kit leurs règles `permission` OpenCode : un
  sous-agent ne lance que les commandes, ne lit et n'écrit que les fichiers qu'elles autorisent. Il lui faut Node.
- L'orchestrateur CPiN est un agent **principal** : `claude --agent dso:cpin-orchestrateur` ouvre une session où
  c'est lui qui répond, avec ses garde-fous. `/dso:deployer-cpin` dans une session normale suit le même runbook,
  mais sous les permissions habituelles de Claude Code.
- Le plugin suit `main`. Pour récupérer une mise à jour :
  `claude plugin marketplace update starter-kit`, puis `claude plugin update dev@starter-kit`.

Pour le proposer à toute l'équipe d'un projet, versionner dans son `.claude/settings.json` :

```json
{
  "extraKnownMarketplaces": {
    "starter-kit": { "source": { "source": "github", "repo": "dnum-mi/starter-kit-opencode" } }
  },
  "enabledPlugins": { "dev@starter-kit": true }
}
```

### 4. Copie (Codex, autres)

```bash
cp -r .agents/skills/dev/* ~/.agents/skills/     # et/ou .agents/skills/dso/*
```

Seuls les skills sont installés. Les invariants des `instructions.md` (ex. « l'agent ne manipule jamais un
secret ») ne sont pas chargés : les recopier si besoin dans le `AGENTS.md` du projet.

## Utiliser

### `/livrer <plan>` (groupe `dev`)

Pour implémenter un plan (texte, ou chemin d'un fichier) qui touche des bibliothèques externes.

1. **`dev-verif-plan`** (sous-agent, lecture seule) vérifie sur le projet réel que chaque paquet, composant et
   prop du plan existe (`package.json`, `npm view`, fichiers `.d.ts`), puis rend un plan corrigé.
2. **`build`** (l'agent d'OpenCode) implémente le plan corrigé.
3. **`dev-review`** (sous-agent, lecture seule, session neuve) lance typecheck, lint, tests et build du projet,
   puis rend `PORTE: OK|KO`. Sur un KO, `build` corrige à la source et relance ; il s'arrête au 3e KO.

Ce que `/livrer` ne fait pas :
- **pas de commit ni de push** : vous relisez et commitez ;
- la porte ne vaut que ce que valent les scripts du projet : sans script `test` ou `lint`, elle le signale en
  avertissement, mais ne peut rien vérifier ;
- pas d'orchestrateur ni de portes humaines : pour une tâche sans plan, utiliser `build` directement.

### `/deployer-cpin [contexte]` (groupe `dso`)

Pour préparer le déploiement du dépôt courant sur Cloud Pi Native. L'agent **`cpin-orchestrateur`** (aussi
accessible avec Tab dans OpenCode, ou par `claude --agent dso:cpin-orchestrateur`) suit le runbook `deploiement-cpin` :

| Phases | Qui | Ce qui se passe |
|--------|-----|-----------------|
| 0 à 2 : éligibilité, prérequis console, valeurs vitales | **vous** | une phase à la fois : l'orchestrateur pose les questions de la phase en une seule liste et attend votre réponse avant de passer à la suivante. La phase 1 commence par la **plateforme cible** (Scaleway SDID, RIE, autre) et le **mode de création** dans la console (automatique par l'API, manuel, projet déjà existant) ; il ne vérifie que les **noms** des secrets et variables GitHub (`gh secret list`) |
| 3 : chart et CI | agents | `cpin-plan` → `cpin-build` → `cpin-review`, jusqu'à ce que `check-cpin-rules.py` sorte en 0 (3 essais au plus) |
| 4 et 5 : livraison, vérification après synchro | **vous** | l'orchestrateur vous remet la marche à suivre et la table de dépannage |

Ce que les agents `dso` ne font **jamais** :
- demander, lire, écrire ou afficher la valeur d'un token ou d'un secret : c'est vous qui les saisissez, dans la console,
  dans GitHub ou dans Vault ;
- agir sur ArgoCD ou le GitLab interne, ni sur la console CPiN et Vault autrement que par les scripts du kit, après votre « oui » ;
- commiter, pousser, ou franchir une porte humaine sur une supposition.

`cpin-orchestrateur` ne modifie aucun fichier, et ne lance que `gh … list`, `git status/log/diff` et `ls`.
Seul `cpin-build` modifie des fichiers.

## Personnaliser

Une valeur déclarée dans votre `opencode.json` l'emporte sur celle du plugin :

```json
{
  "agent": {
    "cpin-review": { "model": "albert/un-autre-modele" },
    "dev-review": { "disable": true }
  }
}
```

## Choix de conception

- **Groupes séparés** : un projet front n'a pas besoin des règles Kyverno, ni un dépôt d'infra des recettes Vue.
  Chaque groupe a ses propres instructions, chargées seulement s'il est installé.
- **Plugin plutôt qu'URL** : agents et commandes ne se déclarent pas par URL. Le plugin injecte tout
  dans la configuration au démarrage, sans rien écrire dans le projet.
- **Orchestrateur pour `dso`, pas pour `dev`** : un déploiement suit toujours les mêmes phases et a besoin de
  portes humaines. Une tâche de dev n'a pas de forme fixe, et l'agent `build` d'OpenCode suffit à la piloter.
- **Review en session neuve** : le relecteur n'hérite pas du raisonnement de celui qui a écrit le code. Il
  juge sur le résultat de commandes (`check-cpin-rules.py`, build, typecheck), pas sur sa lecture.
- **3 essais au plus** : au-delà, le modèle tourne en rond, et le rapport revient à l'humain.
- **Sous-agents préfixés** (`cpin-`, `dev-`) : ils n'écrasent pas les agents `build`/`plan` d'OpenCode.
  Un sous-agent ne peut pas en lancer un autre.

## Limites connues

- Claude Code : un agent de plugin ignore `permissionMode` et `hooks`, d'où le hook du `socle`. Il ne filtre que les
  agents du kit : `/dso:deployer-cpin` lancé dans une session normale reste sous les permissions habituelles de
  Claude Code (préférer `claude --agent dso:cpin-orchestrateur`). `temperature` n'a pas d'équivalent.
- Le hook lit une commande bash comme bash (`claude/shell.mjs`) et applique la règle au texte exécuté, guillemets
  retirés. Il ne l'autorise sans demander que si rien n'y change ce que bash exécute : hors guillemets, `$`, `\`,
  parenthèses, redirections (sauf `2>&1`, `>/dev/null`), jokers ou `~` en tête de mot demandent l'accord ; entre
  guillemets doubles, `$`, `` ` `` et `\` aussi. Une commande autorisée garde tout ce que sa règle permet : `git diff
  --no-index … .env.secrets`, `helm template … -f .env.secrets`, `pnpm exec …` sous `pnpm *`. Ces failles viennent
  des règles, à resserrer : [#57](https://github.com/dnum-mi/starter-kit-opencode/issues/57).
- Un `Grep` sur un dossier, sans motif de fichiers (`glob`), n'est pas filtré fichier par fichier.
- Pour un agent du kit, un outil absent des règles OpenCode (`Monitor` et `WebSearch` exceptés, rattachés à `bash`
  et `webfetch`) demande l'accord de l'humain ; un outil MCP est refusé.
- `dso` : plusieurs points restent à confirmer avec la Service Team CPiN : droits minimum du token GitHub,
  domaine Harbor accepté par Kyverno en prod, déploiement d'un changement de chart sans nouvelle image. Ils
  sont listés dans `deploiement-cpin` (« Limites connues ») ; les agents ne tranchent pas à votre place.
- `opencode debug skill` ne liste pas les skills chargés par le plugin. Ils sont pourtant bien disponibles en session.

## Contribuer

Le `opencode.json` de ce dépôt charge le plugin par son chemin local (`["./", { "groups": ["dev", "dso"] }]`) :
OpenCode lancé dans le dépôt utilise les instructions, skills, agents et commandes de la copie de travail, sans
passer par GitHub ni par le cache. Relancer OpenCode suffit pour tester une modification.

| Commande | Vérifie |
|----------|---------|
| `make skills-index` / `make skills-index-check` | régénère / vérifie les `index.json` des groupes |
| `make test-plugin` | le plugin installe ce qu'il faut pour chaque groupe, et rien des autres (sans appel au modèle) |
| `make claude-plugin` | régénère `claude/` (agents, commandes, permissions) depuis `opencode/` |
| `make test-claude` | `claude/` est à jour, le hook décide comme les règles OpenCode, la marketplace est valide |
| `make test-cpin-rules` | `check-cpin-rules.py` détecte chaque friction réelle d'un premier déploiement |
| `make doctor` | les prérequis du poste (voir « Prérequis ») |

Les règles de rangement (où mettre une instruction, comment nommer les agents) sont dans la section « Groupes » de
`AGENTS.md`.

### Scripts des skills

| Script | Skill | Usage |
|--------|-------|-------|
| `check-environment.sh` | outils-dev | Vérifie les outils installés |
| `validate-branch.sh` | conventions-cofabnum | Valide le format `<type>/<kebab>#<ticket>` |
| `check-folders.sh` | conventions-cofabnum | Vérifie kebab-case et PascalCase |
| `scaffold-nestjs.sh` | recettes-serveur | Crée un projet NestJS complet |
| `scaffold-fastify.sh` | recettes-serveur | Crée un projet Fastify complet |
| `scaffold-fastapi.sh` | recettes-serveur | Crée un projet FastAPI complet |
| `check-cpin-rules.py` | helm-chart-cpin | Vérifie un rendu `helm template` : Kyverno, quota, ports, image, ingress |

## Source

Skills tirés de la documentation de la [Fabrique Numérique](https://docs.fabrique-numerique.fr/)
(`dnum-mi/transversal-doc`) et de celle de [Cloud Pi Native](https://cloud-pi-native.fr), ainsi que du retour
d'expérience d'un premier déploiement.

## Références

### Standard Agent Skills
- [Specification](https://agentskills.io/specification) — format SKILL.md, frontmatter, conventions de nommage
- [Best Practices](https://agentskills.io/skill-creation/best-practices) — scopes, contexte, calibrage
- [Using Scripts](https://agentskills.io/skill-creation/using-scripts) — scripts, output structuré
- [Client Implementation](https://agentskills.io/client-implementation/adding-skills-support) — progressive disclosure, permissions

### OpenCode
- [Skills](https://opencode.ai/docs/fr/skills/) — discovery, placement, format
- [Agents](https://opencode.ai/docs/fr/agents/) — primaires, sous-agents, permissions
- [Plugins](https://opencode.ai/docs/fr/plugins/) — installation, hooks
- [Permissions](https://opencode.ai/docs/fr/permissions/) — règles allow/deny/ask

### Fabrique Numérique et Cloud Pi Native
- [docs.fabrique-numerique.fr](https://docs.fabrique-numerique.fr/) — documentation officielle
- [GitHub: dnum-mi/transversal-doc](https://github.com/dnum-mi/transversal-doc) — repo source
- [GitHub: dnum-mi/fabnum-cicd](https://github.com/dnum-mi/fabnum-cicd) — workflows CI/CD réutilisables
- [cloud-pi-native.fr](https://cloud-pi-native.fr) — documentation de la plateforme
