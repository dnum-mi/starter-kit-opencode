---
name: gouv-fr-code-index
description: "Index des skills gouv-fr pour construire, auditer et déployer une application de l'État."
category: architecture
version: 0.2.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, sovereign, france, etat, government, app, build, dsfr, rgaa, index]
    related_skills: [gouv-fr-projet-structure, gouv-fr-securite, gouv-fr-compliance-rgaa, gouv-fr-workflow-dev, gouv-fr-repo-init]
---

# Gouv-fr — Index des skills

Package complet de skills gouv-fr pour construire, auditer et déployer des applications de l'administration française.

## Sources

- **starter-kit-opencode** (`.agents/skills/dev/*` + `dso/*`) — CoFabNum conventions, stack, CI/CD, CPiN
- **gouv-fr-code-package-mi** (`ynotopec/gouv-fr-code-package-mi`) — Core skills
- **Local skills** (migrés) — DSFR, audit, référentiel données

## Installation

```bash
# Copier les skills dans le répertoire Hermes skills
cp -r gouv-fr-*/ ~/.hermes/skills/
```

## Vérification
- Chaque répertoire contient un `SKILL.md` avec frontmatter YAML
- Tous les noms commencent par `gouv-fr-`
- Les skills ont des tags hermes metadata

## Ressources

- **Source** : `github.com/etalab-ia/albert-code`
- **OpenCode** : `https://opencode.ai/docs/fr`
- **Albert API** : `https://albert.api.etalab.gouv.fr`
- **agent-vm** : `https://github.com/sylvinus/agent-vm`
- **DSFR** : `https://www.systeme-de-design.gouv.fr/`
- **Skills of the State** : `https://github.com/etalab-ia/skills`
