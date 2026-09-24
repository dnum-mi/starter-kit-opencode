---
type: référence
title: Contraintes d'exécution CPiN et politiques Kyverno
description: Exigences applicatives (12-factor, rootless, FS lecture seule, ports, probes, resources, labels MIOM) et table des règles Kyverno avec leur mode audit/enforce.
tags: [cpin, kyverno, contraintes, openshift, labels]
---

# Contraintes d'exécution

Sources : `guide/best-practices.md`, `agreement/{kyverno,labels-list,faq}.md`, `platform/compatibility.md`.

## Applicatif
- 12-factor ; **stateless** (session/cache dans Redis) ; configuration par variables d'environnement/ConfigMap (même image entre environnements) ; ports > 1024 ; logs sur stdout en **GELF ou JSON**.
- Tâches d'administration en `initContainer` (migration) ou `CronJob` (backup).
- Toutes les dépendances (libs, images) viennent de dépôts reconnus ou sont construites par CPiN.

## Conteneur
Rootless ; **UID aléatoire** (permissions groupe root) ; **FS en lecture seule** (`emptyDir` pour l'écriture) ; sondes readiness/liveness ; `requests`/`limits` (Guaranteed recommandé) ; Dockerfiles dans le dépôt.

## Labels MIOM
`app`, `env` (dev, formation, qualif, test, preprod, prod), `tier` (frontend, backend, db, cache, auth), `criticality` (high, medium, low), `component` (nginx, node, postgres, redis, rabbitmq…).
Kyverno `check-labels` exige **app, env, tier** ; la page des bonnes pratiques demande aussi `criticality` et `component`.

## Kyverno (AUDIT en dev/preprod, ENFORCE en prod sauf mention)
| Règle | Effet |
|---|---|
| `check-labels` | labels `app`, `env`, `tier` sur les pods |
| `cm-no-credentials` | interdit `password`, `passwd`, `secret_key` dans une ConfigMap |
| `disallow-latest` | pas de tag `latest` |
| `disallow-hostpath` | pas de volume hostPath |
| `restrict-nodeport` | pas de Service NodePort |
| `restrict-image-registry` | docker.io, harbor.io, registry.redhat.io, quay.io, bitnami, ghcr.io |
| `need-containers-ressources` | limits/requests CPU et mémoire |
| `need-liveness-readiness` | au moins une sonde |
| `limit-size-pvc` | PVC < 1 Ti |
| `job-history` | CronJob : `successfulJobsHistoryLimit: 5`, `failedJobsHistoryLimit: 5` |
| `add-ttl` | TTL ajouté aux Jobs |
| `disallow-selfprovisionning` | pas de rôle self-provisioner |
| `disallow-exec`, `etcd` | ENFORCE partout (infra) |
| `add-netpol-*` | injecte deny-all + allow-same-namespace, ingress, logging, monitoring |
| `add-velero-label` | marque le namespace pour Velero |
AUDIT journalise sans bloquer ; ENFORCE bloque la création/mise à jour.

## Réseau et exposition
Deny-all par défaut ; egress via proxy. Nom de domaine, certificats et flux sont fournis/ouverts par l'infra par environnement. Route vs Ingress : **non documenté** dans les sources lues.
Noms de ressources courts (suffixes `-svc`, `-dep`, `-sts`, `-cm`, `-cj`, `-pvc`).
