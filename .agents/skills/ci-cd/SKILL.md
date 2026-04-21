---
name: ci-cd
description: Use when setting up CI/CD pipelines for Fabrique Numérique projects — GitHub Actions, reusable workflows from fabnum-cicd, Docker builds, security scanning, release automation, and Helm deployments
allowed-tools: Bash Read Write
---

# CoFabNum CI/CD

Principles, pipelines, and reusable workflows.

## Principles

CI/CD automates development steps to increase delivery frequency.

### Tools

- **Pipeline runner**: GitHub Actions (primary)
- [SonarQube](https://www.sonarsource.com/products/sonarqube/) — code quality analysis
- [Trivy](https://trivy.dev/) — CVE detection in dependencies and images

### CI Phase

Steps: Lint → Tests (unit/integration) → Build → Tests (E2E) → Code quality

### CD Phase

Steps: CVE scan → Release (with changelog) → Deploy

## Pipeline Checklist

Progress:
- [ ] Lint (ESLint/Ruff)
- [ ] Unit tests (Vitest/pytest)
- [ ] Build
- [ ] E2E tests (Playwright)
- [ ] SonarQube scan
- [ ] Docker build + push
- [ ] Trivy scan
- [ ] Helm lint + deploy

## Minimal CI Template

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

## Reusable Workflows (Recommended)

The Fabrique Numérique maintains reusable workflows in [`dnum-mi/fabnum-cicd`](https://github.com/dnum-mi/fabnum-cicd).

**Default choice**: Use reusable workflows over custom pipelines.

### Available workflows

| Workflow | Purpose |
|----------|---------|
| `build-docker.yml` | Multi-arch Docker build+push |
| `clean-cache.yml` | Clean GH Actions cache |
| `lint-commits.yml` | Conventional commits validation |
| `lint-helm.yml` | Helm chart lint |
| `release-app.yml` | Automated releases (release-please) |
| `release-helm.yml` | Helm chart OCI publish |
| `scan-sonarqube.yml` | Code quality analysis |
| `scan-trivy.yml` | Vulnerability scan |
| `test-helm.yml` | Helm install test in Kind |

### Usage

```yaml
jobs:
  my-job:
    uses: dnum-mi/fabnum-cicd/.github/workflows/<name>.yml@main
    with:
      # inputs
    secrets:
      # required secrets
```

### Example: CI with reusable workflows

```yaml
name: CI
on:
  pull_request:
    branches: ["**"]

jobs:
  lint-commits:
    uses: dnum-mi/fabnum-cicd/.github/workflows/lint-commits.yml@main

  scan-sonarqube:
    uses: dnum-mi/fabnum-cicd/.github/workflows/scan-sonarqube.yml@main
    with:
      SONAR_URL: https://sonarqube.example.com
      SOURCES_PATH: apps
    secrets:
      SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
      SONAR_PROJECT_KEY: ${{ secrets.SONAR_PROJECT_KEY }}

  build-docker:
    uses: dnum-mi/fabnum-cicd/.github/workflows/build-docker.yml@main
    with:
      IMAGE_NAME: ghcr.io/${{ github.repository }}/my-app
      IMAGE_TAG: pr-${{ github.event.pull_request.number }}
    permissions:
      packages: write
      contents: read

  scan-trivy:
    needs: build-docker
    uses: dnum-mi/fabnum-cicd/.github/workflows/scan-trivy.yml@main
    with:
      IMAGE: ghcr.io/${{ github.repository }}/my-app:pr-${{ github.event.pull_request.number }}
    permissions:
      security-events: write
      pull-requests: write
```

## Required Secrets

| Secret | Workflows | Description |
|--------|-----------|-------------|
| `GH_PAT` | release-app | GitHub Personal Access Token |
| `SONAR_TOKEN` | scan-sonarqube | SonarQube token |
| `SONAR_PROJECT_KEY` | scan-sonarqube | SonarQube project key |

See [fabnum-cicd docs](https://github.com/dnum-mi/fabnum-cicd/tree/main/docs/workflows) for full inputs/outputs per workflow.

## Gotchas

- **Always use reusable workflows** — writing custom pipelines violates consistency and misses security scans
- **Pin to `@main`** — the workflow reference should pin to the branch, not `@latest`
- **Trivy scans images AFTER build** — it depends on the Docker image being available
- **SonarQube needs permissions** — `issues: write` and `pull-requests: write` for PR comments
- **`--frozen-lockfile` in CI** — always use this to prevent unexpected dependency changes
- **Cache pnpm store** — add pnpm store caching to speed up CI runs
- **Node version** — use `24` (LTS) consistently across all CI jobs
- **GitHub Actions version tags** — pin to `@v6` not `@latest` for all actions
