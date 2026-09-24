---
type: décision
title: Image sur ghcr.io ou Harbor (qui build)
description: Comprendre les deux registres et les deux constructeurs d'images d'un projet CPiN, et quand la référence est l'un ou l'autre.
tags: [décision, images, harbor, ghcr, kaniko]
---

# ghcr.io ou Harbor ?

| | GitHub Actions → ghcr.io | GitLab DSO → Harbor |
|---|---|---|
| Constructeur | `build-docker` (buildx, multi-arch) | Kaniko (`.kaniko:build`, `.kaniko:simple-build-push`) |
| Rôle | contrôle amont : PR, scans, chart source | **référence déployée**, signée, scannée par Trivy |
| Nommage | `ghcr.io/<owner>/<repo>/<service>:<version>` | `<REGISTRY_URL>/<ORG>-<PROJET>/<image>:<tag>` |
| Tags | version, `pr-N`, `latest` sur main | SHA court, branche, appVersion, `latest` si semver |

## Règles CPiN
- Les images déployées doivent être **construites par la chaîne DSO** ou provenir d'un registre public reconnu (ex. bitnami). `docker push` depuis un poste est interdit.
- Harbor n'autorise que les images **signées** (CI DSO) ; on peut restreindre le pull aux images signées par projet (demande à la Service Team).
- Kyverno n'autorise que : docker.io, harbor, registry.redhat.io, quay.io, bitnami, **ghcr.io** — un déploiement pointant ghcr.io est donc admissible, mais la voie standard reste Harbor.
- Le Dockerfile doit être dans le dépôt ; les images de base publiques ou reconstruites par DSO. Le pipeline passe `DOCKERHUB_MIRROR_URL` en build-arg (ocr-api).
- Les pull secrets Harbor (`registry-pull-secret`) sont créés par la console dans chaque namespace.

## Conséquence
Garder **les deux** cohérents : mêmes Dockerfiles, même version dans `Chart.yaml`. Le `values-<env>.yaml` d'un environnement CPiN pointe `image.registry` vers Harbor.
(inférence à partir de ocr-api : le chart a par défaut `ghcr.io`, « overridden per environment ».)
