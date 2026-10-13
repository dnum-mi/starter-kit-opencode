---
name: gouv-fr-service-names
description: Détecte les anciens noms de services mcr dans le repo courant (avant le rebranding du 2026-05-16). Bloque la régression de noms obsolètes dans le code, manifests, docs. Spécifique projet mirai-mesreunions.
category: devops
version: 1.0.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, mcr, rebranding, regression, service-names]
    related_skills: [gouv-fr-smoke-test, gouv-fr-repo-init]
---


# Gouv-fr — Noms de services (anti-régression)

Mapping ancien → nouveau (cf. `reference_services_naming`) :

| Ancien | Nouveau |
|---|---|
| `code-generator` | `mydevices-web` |
| `upload-portal` | `mobile-upload-pwa` |
| `token-issuer` | `device-token-authority` |
| `file-mover` | `dmz-to-internal-bridge` |
| `file-puller` | `internal-ingester` |
| `antivirus-worker` | `clamav-scanner` |
| `transcode-worker` | `audio-normalizer` |
| `transcription-stub` | `transcription-relay` |
| `admin-portal` | `admin-console` |

## Scan

Cibler les fichiers susceptibles de contenir un nom de service (k8s, code, docs, scripts) :

```bash
rg -n --type-add 'k8s:*.{yaml,yml}' \
   --type-add 'cfg:*.{env,ini,toml,json}' \
   -t k8s -t cfg -t py -t js -t ts -t md -t sh \
   -e 'code-generator' \
   -e 'upload-portal' \
   -e 'token-issuer' \
   -e 'file-mover' \
   -e 'file-puller' \
   -e 'antivirus-worker' \
   -e 'transcode-worker' \
   -e 'transcription-stub' \
   -e 'admin-portal' \
   .
```

## Restreindre au diff courant
Si seules les modifs en cours comptent :

```bash
git diff --name-only origin/main...HEAD | \
  xargs rg -e 'code-generator|upload-portal|token-issuer|file-mover|file-puller|antivirus-worker|transcode-worker|transcription-stub|admin-portal' 2>/dev/null
```

## Faux positifs légitimes
- Anciennes ADRs / commits / changelog : conserver tel quel (historique).
- `docs/migration-*.md` : nommer explicitement l'ancien pour montrer la bascule.
- Logs / dashboards archivés.

→ Si une occurrence tombe dans ces catégories, l'annoter `<!-- legacy-name -->`
  ou la déplacer dans un fichier `*-legacy.md` pour qu'on l'exclue plus tard.

## Action si occurrences trouvées
1. Lister les fichiers + ligne + ancien nom.
2. Proposer la substitution (Edit ou sed) en confirmant chaque cas (un nom peut
   apparaître dans un commentaire historique légitime).
3. Re-scanner après remplacement pour confirmer 0 occurrence active.
