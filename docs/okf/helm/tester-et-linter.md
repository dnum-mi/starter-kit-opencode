---
type: référence
title: Tester et linter un chart
description: Outils et workflows de validation d'un chart - chart-testing, Kind, JSON Schema, helm-docs, yamllint.
tags: [helm, tests, lint, chart-testing]
---

# Tester et linter

| Étape | Outil / workflow | Remarque |
|---|---|---|
| Lint des charts | `lint-helm` (`LINT_CHARTS`) | nécessite `CT_CONF_PATH` (ex. `ci/configs/ct.yaml` : `chart-dirs`, `target-branch`, `chart-repos`) |
| Doc à jour | `lint-helm` (`LINT_DOCS`, `HELM_DOCS_VERSION`) | échoue si le README diffère du rendu helm-docs |
| Values vs schéma | `lint-helm-schema` (`CHART_PATH`, `SCHEMA_FILE`, `VALUES_FILES`) | `check-jsonschema` |
| Installation | `test-helm` | cluster Kind, `ct install`, utilise `test-values*.yaml` |
| YAML | `lint-yaml` | yamllint |

ocr-api appelle `lint-helm` deux fois (docs, charts) et pas `test-helm`. Avec des dépendances distantes, déclarer `HELM_REPOS`/`chart-repos` pour que `helm dependency` résolve.
