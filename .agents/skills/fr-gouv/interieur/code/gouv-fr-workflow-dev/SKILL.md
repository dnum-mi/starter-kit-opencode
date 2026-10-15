---
name: gouv-fr-workflow-dev
description: "Workflow : plan mode, tâches, leçons, bug fixing."
category: workflow
version: 0.1.1
author: etalab-ia, Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, workflow, plan-mode, task-management, self-improvement, bug-fixing, code-quality]
    related_skills: [gouv-fr-projet-structure, gouv-fr-securite, gouv-fr-workflow-dev]
---

# Gouv-fr — Workflow de développement

Processus de travail et bonnes pratiques pour le développement d'applications gouv-fr-code-index.

## Plan Mode (3+ étapes ou décision architecture)

1. Planifier dans `tasks/todo.md` (items cochables)
2. Valider avant d'implémenter
3. Cocher les items au fur et à mesure
4. Section « résultat » à la fin

## Task Management (`tasks/`)

```
tasks/
├── todo.md      # Plan courant (items cochables)
└── lessons.md   # Patterns d'erreur (cumulatif)
```

## Self-Improvement Loop

Après toute correction : mettre à jour `tasks/lessons.md`, le relire au début de chaque session.

## Bug Fixing

1. Reproduire le bug (tests automatisés)
2. Corriger la cause racine
3. Ne jamais masquer un symptôme

## Code Quality

- « Existe-t-il une solution plus élégante ? » pour tout changement non trivial
- Respecter le style existant
- Petites unités testables. Tests avec le changement

## How to Contribute

1. Lire `AGENTS.md` (architecture + règles)
2. Choisir le ticket suivant dans `BACKLOG.md`
3. Lire les fichiers concernés, implémenter selon le DoD
4. Valider avec les scénarios de `TESTS.md`
5. Mettre à jour `README.md` si le comportement change
6. Commit en Conventional Commits
