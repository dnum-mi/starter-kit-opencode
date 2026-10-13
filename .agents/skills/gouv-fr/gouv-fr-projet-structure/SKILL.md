---
name: gouv-fr-projet-structure
description: "Structure projet, CLI, config OpenCode et variables d'env."
category: architecture
version: 0.2.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, project, structure, layout, open-code, opencode, mcp, agent-vm, albert-api, environment]
    related_skills: [gouv-fr-securite, gouv-fr-compliance-rgaa, gouv-fr-workflow-dev, gouv-fr-repo-init]
---

# Gouv-fr — Structure de projet

Architecture du projet gouv-fr-code-index : layout, intégration OpenCode, CLI, variables d'environnement.

## Project Layout

```
my-app/
├── AGENTS.md                 # Règles projet + architecture
├── BACKLOG.md                # Tickets (epics → tasks, 🔴🟠🟡)
├── TESTS.md                  # Scénarios de validation
├── FEEDBACK.md               # Retours utilisateurs
├── opencode.json             # OpenCode config: provider Albert + MCPs
├── .albert-code/
│   └── skills.txt            # Skills sélectionnés pour la VM
└── src/
    ├── components/            # Composants DSFR
    ├── pages/                 # Pages / routes
    ├── services/              # API calls, services métier
    └── styles/                # Custom styles
```

## CLI Verbs

| Verbe | Action | Quand |
|---|---|---|
| `gouv-fr-code-index setup` | Scaffold: AGENTS.md, opencode.json, MCP selection, skills selection | Une fois par projet |
| `gouv-fr-code-index run` | Lancer agent OpenCode dans la VM | Par session de codage |

## How OpenCode Loads Gouv-fr

1. **Provider** — OpenCode lit `opencode.json` (projet-level). Le bloc `provider.albert` pointe vers Albert API
(`https://albert.api.etalab.gouv.fr/v1`).
2. **Model** — `albert/deepseek-v4-flash` (modèle SecNumCloud intégré).
3. **MCPs** — 4 connectors opt-in : `data-gouv` (données publiques), `context7` (doc librairies), `playwright` (browser
headless), `chrome-devtools` (debug DOM).
4. **Skills** — `etalab-ia/skills` cloné en cache ; seules les skills sélectionnées sont symlinkées (`skills.txt`).
5. **Règles** — OpenCode lit `AGENTS.md`. La zone gouv-fr-code-index (`<!-- gouv-fr-code-index:agents:start -->` / `<!--
gouv-fr-code-index:agents:end -->`) est gérée automatiquement.

## Key Environment Variables

| Variable | Default | Rôle |
|---|---|---|
| `AC_VM_CPUS` | `4` | CPU alloué à la VM |
| `AC_VM_MEMORY` | `8` (GiB) | RAM allouée à la VM |
| `AC_VM_DISK` | `32` (GiB) | Disque (sparse, croissance) |
| `AC_ALBERT_BASE_URL` | `https://albert.api.etalab.gouv.fr/v1` | Endpoint Albert API |
| `AGENT_VM_DIR` | `$SELF_DIR/vendor/vm` | Bundle agent-vm |
| `RUNTIME_VM_FILE` | `$HOME/.agent-vm/runtime.sh` | Config runtime VM |

## Ressources

- **Source** : `github.com/etalab-ia/albert-code`
- **OpenCode** : `https://opencode.ai/docs/fr`
- **Albert API** : `https://albert.api.etalab.gouv.fr` · docs `https://doc.incubateur.net/alliance/albert-api`
- **agent-vm** : `https://github.com/sylvinus/agent-vm`
- **DSFR** : `https://www.systeme-de-design.gouv.fr/` → skill `gouv-fr-design-system`
- **Skills of the State** : `https://github.com/etalab-ia/skills`
