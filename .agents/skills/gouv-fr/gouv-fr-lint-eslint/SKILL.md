---
name: gouv-fr-lint-eslint
description: Lint et formattage ESLint, Ruff et EditorConfig pour projets Fabrique Numérique.
category: qualite
version: 0.1.0
author: Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, lint, eslint, ruff, editorconfig, prettier, formatting]
    related_skills: [gouv-fr-code-index, gouv-fr-projet-structure, gouv-fr-code-quality]
---

# Gouv-fr — Lint & formattage (ESLint, Ruff)

Conventions de lint et formattage pour les projets JavaScript/TypeScript et Python de la Fabrique Numérique.

## Quand utiliser
- Configurer le lint d'un projet neuf ou existant
- Résoudre des problèmes de lint
- Standardiser le formattage dans un projet

## Prérequis
- ESLint ≥ 9 (flat config obligatoire)
- VS Code avec l'extension ESLint
- Ruff pour les projets Python

## Comment lancer
- `pnpm lint` — vérification du lint
- `pnpm format` — auto-correction
- `pnpm ruff check` — lint Python
- `pnpm ruff format` — format Python

## Référence rapide — EditorConfig

Fichier `.editorconfig` à la racine :
```ini
root = true
[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
[*.md]
trim_trailing_whitespace = false
```

## Référence rapide — ESLint (JS/TS)

### Installation
```bash
pnpm add -D eslint @antfu/eslint-config
```

### Configuration (`eslint.config.js`)
```javascript
import antfu from '@antfu/eslint-config'

export default antfu({
  rules: {
    'style/comma-dangle': ['error', 'always-multiline'],
    'no-irregular-whitespace': 'off',
  },
})
```

### Règles à surcharger systématiquement
- `style/comma-dangle` : `['error', 'always-multiline']`
- `no-irregular-whitespace` : `'off'` (espace fine insécable pour le français)

### VS Code settings (`.vscode/settings.json`)
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.format.enable": true,
  "eslint.validate": ["javascript", "typescript", "vue"]
}
```

### Scripts package.json
```json
{
  "lint": "eslint .",
  "format": "eslint . --fix"
}
```

### NestJS — config supplémentaire
Dans `tsconfig.json` :
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Règles ESLint à ajuster pour NestJS :
```javascript
rules: {
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/no-explicit-any': 'off',
}
```

## Référence rapide — Ruff (Python)

### Installation
```bash
uv add --dev ruff
```

### Configuration (`ruff.toml`)
```toml
[tool.ruff]
line-length = 88
target-version = "py312"

[tool.ruff.lint]
select = ["E", "W", "F", "I", "N", "UP", "B", "C4", "SIM"]
ignore = ["E501"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
```

### Scripts package.toml
```toml
[project.scripts]
lint = "ruff check ."
format = "ruff format ."
```

## Pièges
- ESLint remplace Prettier — ne pas installer les deux
- Flat config (`eslint.config.js`) depuis ESLint v9 — `.eslintrc` est déprécié
- `no-irregular-whitespace` doit être `'off'` pour permettre les espaces fines insécables
- Ruff `E501` ignoré car géré par le formatter (line-length dans `[tool.ruff]`)
- Pour les projets monorepo, la config ESLint doit être au niveau workspace root

## Vérification
- `pnpm lint` retourne 0 erreurs
- `pnpm format` n'écrit aucun changement
- `pnpm ruff check` retourne 0 erreurs (Python)
- VS Code auto-format à la sauvegarde
