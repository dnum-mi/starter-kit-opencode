---
type: référence
title: Registre, artefacts et qualité
description: Harbor (push, signature, robots), Nexus (proxy, dépôts npm/Maven), SonarQube (quality gates), signature cosign et vérification Kyverno.
tags: [cpin, harbor, nexus, sonarqube, cosign]
---

# Registre, artefacts et qualité

## Harbor
- Format d'image : `<REGISTRY_URL>/<ORG>-<PROJET>/<IMAGE>:<TAG>`, ex. `harbor.apps.c6.numerique-interieur.com/mi-monprojet/monimage-backend:v2`.
- Templates : variables `IMAGE_NAMES`, `DOCKERFILE`, `WORKING_DIR`, `TAG` (défaut : nom de branche ; possible `$CI_COMMIT_SHORT_SHA`).
- Les images de la CI sont **signées** ; Harbor peut restreindre le pull aux images signées (demande à la Service Team). Robots et quotas : tickets, config en lecture seule pour les utilisateurs.
- Scans de vulnérabilités consultables dans Harbor.

## Signature (cosign)
Clé générée avec `cosign generate-key-pair` ; clé privée et mot de passe **hors Git** (variables CI GitLab, accès sur demande). Signer par **digest** (pas par tag) via le job `sign` (`bitnami/cosign`).
Vérification : politique Kyverno `verifyImages` (type Cosign, `publicKeys`, `mutateDigest`, `verifyDigest`). Exemple : `cloud-pi-native/mock-signature-image`.

## Nexus
Stocke les artefacts intermédiaires et **proxifie** Maven Central, npm, Composer… ; on ne peut pas y déposer de binaire hors CI.
Dépôts créables par la console : npm et Maven (SNAPSHOT, RELEASE, groupe). URLs : `${NEXUS_HOST_URL}/repository/${PROJECT_PATH}-XXX`.

## SonarQube
Analyse statique avec **quality gates** ; variables `SONAR_HOST_URL`, `SONAR_TOKEN` ; jobs préconfigurés (npm, Maven).

## Images personnalisées
Toute image déployée est construite par la chaîne DSO ou vient d'un registre public autorisé (ex. `bitnami/postgresql` oui, `mon-pseudo/postgresql` non). Ajouter un job `build_docker_custom` (`extends: .kaniko:build`) pour une image annexe.
