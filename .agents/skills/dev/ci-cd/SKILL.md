---
name: ci-cd
description: Use when setting up a basic CI pipeline (lint, tests, build) for a Fabrique Numérique project or choosing between custom and reusable GitHub Actions workflows — for fabnum-cicd reusable workflows, releases and Cloud Pi Native sync use the cicd-fabnum skill (dso group)
allowed-tools: Bash Read Write
---

# CoFabNum CI/CD

Principes et gabarit de base. Pour assembler les workflows réutilisables de fabnum-cicd (build, scans, release-please, chart Helm, synchro Cloud Pi Native), utiliser le skill **`cicd-fabnum`** (groupe `dso`).

## Principes

CI/CD automatise les étapes de développement pour augmenter la fréquence de livraison.

- **Pipeline runner** : GitHub Actions
- [SonarQube](https://www.sonarsource.com/products/sonarqube/) — qualité du code ; [Trivy](https://trivy.dev/) — CVE des dépendances et images
- **CI** : Lint → Tests (unitaires/intégration) → Build → Tests (E2E) → Qualité de code
- **CD** : Scan CVE → Release (avec changelog) → Déploiement

## Checklist

Progress:
- [ ] Lint (ESLint/Ruff)
- [ ] Tests unitaires (Vitest/pytest)
- [ ] Build
- [ ] Tests E2E (Playwright)
- [ ] Scan SonarQube
- [ ] Build + push Docker
- [ ] Scan Trivy
- [ ] Lint Helm + déploiement

## Gabarit CI minimal (pnpm)

```yaml
name: CI
on:
  pull_request:
    branches: ["**"]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v6
        with: { node-version: "24", cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v6
        with: { node-version: "24", cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v6
        with: { node-version: "24", cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

## Workflows réutilisables

La Fabrique Numérique maintient [`dnum-mi/fabnum-cicd`](https://github.com/dnum-mi/fabnum-cicd) : privilégier ces workflows plutôt qu'un pipeline sur mesure (cohérence, scans de sécurité).
Référence : `uses: dnum-mi/fabnum-cicd/.github/workflows/<nom>.yml@v0` — **jamais `@main`** (règle du repo) ; `@v0` est flottant et le dépôt est en `0.x`, figer sur `@v0.20` ou un SHA si besoin de stabilité.
Le détail (catalogue, permissions, gabarits `ci.yml`/`cd.yml`, secrets, pièges) est dans `cicd-fabnum`.

## Pièges

- **`--frozen-lockfile` en CI** — évite les changements de dépendances inattendus
- **Cache du store pnpm** — accélère les runs
- **Version de Node** — `24` (LTS) sur tous les jobs
- **Versions d'actions** — pinner (`@v6` ici, SHA de préférence), jamais `@latest`, `@main` ni `@master`
- **Trivy scanne l'image APRÈS le build** — elle doit exister
