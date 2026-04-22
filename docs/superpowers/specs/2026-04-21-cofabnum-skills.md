# CoFabNum Agent Skills — Session Spec

## 2026-04-21

### Objectif

Créer des skills pour agents (OpenCode, Claude, Codex) qui encapsulent les bonnes pratiques de la Fabrique Numérique issues de la documentation officielle.

### Source

Documentation CoFabNum : https://docs.fabrique-numerique.fr/
Repo source : https://github.com/dnum-mi/transversal-doc (4900+ lignes de docs)

### Références

| Ressource | URL | Usage |
|-----------|-----|-------|
| Agent Skills Spec | https://agentskills.io/specification | Format SKILL.md, frontmatter, nommage |
| Best Practices | https://agentskills.io/skill-creation/best-practices | Scopes, contexte, calibrage |
| Using Scripts | https://agentskills.io/skill-creation/using-scripts | Scripts, output structuré |
| Client Implementation | https://agentskills.io/client-implementation/adding-skills-support | Progressive disclosure |
| OpenCode Skills | https://opencode.ai/docs/fr/skills/ | Discovery, placement |
| OpenCode Permissions | https://opencode.ai/docs/fr/permissions/ | Règles granulaires |

### Périmètre

8 skills couvrant l'ensemble des thématiques CoFabNum :

| # | Skill | Fichiers docs source | Lignes générées |
|---|-------|---------------------|-----------------|
| 1 | conventions-cofabnum | conventions/* (9 fichiers) | 392 |
| 2 | recettes-serveur | serveur/* (4 fichiers) | 343 |
| 3 | recettes-client | client/* (4 fichiers) | 167 |
| 4 | stack-technique | stack/* (5 fichiers) | 170 |
| 5 | monorepo | monorepo/* (4 fichiers) | 112 |
| 6 | ci-cd | ci-cd/* (4 fichiers) | 172 |
| 7 | environnement-installation | installations/* (15 fichiers) | 152 |
| 8 | outils-dev | outils/* (1 fichier) | 139 |

**Total** : 8 SKILL.md + 6 scripts (915 lignes) + README.md + specs/

### Structure des fichiers

```
skills/
├── conventions-cofabnum/SKILL.md       (392 lignes)
│   └── scripts/
│       ├── validate-branch.sh           (76 lignes)
│       └── check-folders.sh             (110 lignes)
├── recettes-serveur/SKILL.md           (343 lignes)
│   └── scripts/
│       ├── scaffold-nestjs.sh           (99 lignes)
│       ├── scaffold-fastify.sh          (250 lignes)
│       └── scaffold-fastapi.sh          (252 lignes)
├── recettes-client/SKILL.md            (167 lignes)
├── stack-technique/SKILL.md            (170 lignes)
├── monorepo/SKILL.md                   (112 lignes)
├── ci-cd/SKILL.md                      (172 lignes)
├── environnement-installation/SKILL.md (152 lignes)
└── outils-dev/SKILL.md                 (139 lignes)
```

### Installation

Skills installés dans `~/.agents/skills/` (dossier global cross-client).

### Sécurité

Permissions configurées dans `opencode.json` :

- **skill** : 8 noms explicit allow + `*` deny
- **bash** : 16 patterns précis (npx, pnpm, python3 -c, node -e, cat, mkdir, uv) + `*` deny
- **edit** : eslint.config.js, tsconfig.json, pyproject.toml, .editorconfig, ~/.agents/skills/** + `*` deny
- **read** : ~/.agents/skills/** + code source, `.env` interdits
- **external_directory** : ~/.agents/skills/** uniquement

### Méthodologie

1. Fetch de toutes les docs du repo transversal-doc
2. Synthèse des 4900+ lignes en 8 skill cohérents (< 500 lignes chacun)
3. Ajout de gotchas, checklists, templates
4. Création de 6 scripts exécutables (validation, scaffold)
5. Revue contre agentskills.io best practices
6. Validation specs agentskills.io (name, description, allowed-tools)
7. Configuration permissions opencode.json (principe de moindre privilège)
