---
type: principes
title: Sécurité transverse CI/CD, Helm et CPiN
description: Fils de sécurité communs aux trois domaines - secrets, credentials CI, scans, signatures, moindre privilège, politiques Kyverno.
tags: [principes, securite, secrets, supply-chain]
---

# Sécurité transverse

| Sujet | Règle | Où c'est appliqué |
|---|---|---|
| Secrets applicatifs | jamais dans Git ni dans une ConfigMap ; Vault + VSO (recommandé) ou SOPS | Kyverno `cm-no-credentials` ; [decisions/secrets-vault-vs-sops.md](../decisions/secrets-vault-vs-sops.md) |
| Credentials CI | `GITHUB_TOKEN` par défaut, GitHub App si besoin, PAT en dernier recours ; jamais `secrets: inherit` | fabnum-cicd `05-authentication.md` |
| Fuite de secrets | scan de tout l'historique | `scan-gitleaks` |
| Vulnérabilités | scan des images et de la config | `scan-trivy` (informatif par défaut : `FAIL_ON_ERROR: false`) ; Trivy + Sonar côté DSO |
| Provenance | attestations SLSA, SBOM, cosign ; images signées dans Harbor | `attest-docker`, `attest-helm` ; `guide/images-sign.md` |
| Images | rootless, non-root UID ≥ 1000 (hors OpenShift : UID alloué), pas de `latest`, base slim/alpine, multi-stage | `AGENTS.md`, Kyverno `disallow-latest` |
| Registres | seuls docker.io, harbor, registry.redhat.io, quay.io, bitnami, ghcr.io | Kyverno `restrict-image-registry` |
| Réseau | namespace en deny-all par défaut ; ouvrir explicitement | Kyverno `add-netpol-*` |
| Exécution | pas de hostPath, pas de NodePort, PVC < 1 Ti, probes et resources obligatoires | Kyverno (enforce en prod) |
| Droits | rôles cumulatifs, la console est source de vérité, jetons API hashés à traiter comme secrets | `platform/iam.md` |

## Bonnes habitudes
- Un credential par besoin, à durée courte (token App valable 1 h).
- Pinner les actions tierces par SHA ; laisser Renovate les maintenir.
- Ne jamais mettre un secret dans `values.yaml` versionné.
- Un secret transmis à un build Docker est lisible par tout ce que le Dockerfile exécute : le credential est nommé explicitement (`BUILD_SECRET_GITHUB_TOKEN`).
