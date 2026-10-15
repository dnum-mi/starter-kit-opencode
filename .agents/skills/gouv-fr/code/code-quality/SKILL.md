---
name: code-quality
description: Applique les standards de code au quotidien (structure, fonctions, erreurs, async, tests) et décide, via une grille de revue en 3 niveaux, de ce qui entre dans une base maintenue.
---

# Gouv-fr — Qualité de code et revue

## Quand utiliser

- **Au quotidien** : produire du code qui respecte les standards (structure, fonctions, erreurs, async, tests).
- **En revue** : décider quoi laisser entrer dans une base qu'un humain devra porter des années.
- **Configurer le lint** d'un projet neuf ou existant (ESLint, Ruff, EditorConfig).

## Principe directeur

Produire du code ne coûte presque plus rien ; le **comprendre, le maintenir et l'assumer** coûte toujours
autant. La question centrale d'une revue n'est pas « ce code est-il joli ? » mais :

> **Quelqu'un pourra-t-il comprendre, faire évoluer et assumer ce code dans trois ans — et le coût de le
> maintenir est-il justifié par ce qu'il apporte ?**

Le code généré par IA est typiquement *syntaxiquement correct et sémantiquement opaque* : il compile, les tests
passent, mais l'intention est absente, les cas limites négligés, des fonctions inexistantes parfois appelées,
et la duplication remplace la conception. La grille cible précisément ces défauts.

## Standards de code — règles au quotidien

Structure de fichier, fonctions, erreurs, async/await, imports, constantes, early return, dépendances, tests
(obligatoires), configuration du lint : le détail est dans
[`references/source-gouv-fr-code-quality.md`](references/source-gouv-fr-code-quality.md) (§ « Standards de code »).

Vérification : `pnpm lint` sans erreur, `pnpm test` passe, `pnpm ruff check` (Python) sans erreur, couverture
≥ 80 %.

## Grille de revue (3 niveaux)

| Niveau | Question | Objet |
|---|---|---|
| 1 — Règles d'entrée | Avant de lire le code | périmètre, intention, dépendances, tests |
| 2 — Règles de fond | Dans le code | correction, clarté, cas limites, duplication |
| 3 — Règles de statut | Méta | dette assumée, TODO tracés, licence, sécurité |

Puis **verdict global**, puis le cas échéant le **mode rituel** (passe d'hygiène pour dégonfler la dette),
la **livraison des changements produits par le skill**, et l'évolution du skill. Tout le détail applicatif est
dans [`references/source-gouv-fr-code-quality.md`](references/source-gouv-fr-code-quality.md) ; les gabarits
(`checklist.md`, `evaluation-scenarios.md`, `hygiene-log-format.md`, `pr-template.md`) sont dans `references/`.

## Lint & formattage (ESLint, Ruff, EditorConfig)

- **ESLint ≥ 9, flat config obligatoire** (`eslint.config.js`) ; ESLint **remplace** Prettier — ne pas installer
  les deux avec `@antfu/eslint-config`.
- **Ruff** remplace black, flake8, isort, pyupgrade — ne pas les cumuler. `E501` ignoré (géré par le formatter).
- `.editorconfig` à la racine (2 espaces, LF, UTF-8, trim, final newline ; pas de trim sur `*.md`).
- Monorepo : la config ESLint vit au niveau workspace root.
- `no-irregular-whitespace: 'off'` pour permettre les espaces fines insécables.

Configuration complète : [`references/source-gouv-fr-lint-eslint.md`](references/source-gouv-fr-lint-eslint.md)

## Vérification

- `pnpm lint` retourne 0 erreur, `pnpm format` n'écrit aucun changement, `pnpm ruff check` retourne 0 erreur.
- Les tests se mettent à jour **avec** le code, pas après.
