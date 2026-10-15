---
name: smoke-test
description: Smoke-test rapide du pipeline mirai-mesreunions (gateway + auth + ingester). Vérifie GET /api/meetings, GET /audio, POST /transcription avec un device_token synthétique. Spécifique projet mirai-mesreunions. À lancer uniquement sur demande explicite de l’utilisateur (appels réseau vers un environnement réel).
category: devops
version: 1.0.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, smoke-test, mirai, pipeline, gateway, ingester]
    related_skills: [service-names, repo-cicd]
---


# Gouv-fr — Smoke-test du pipeline mirai-mesreunions

Cible : l'environnement passé en argument (défaut `integration` si vide).

## Étapes

### 1. Résoudre les endpoints selon l'env
- `integration` → hôte `*.fake-domain.name` (déploiement réel, pas placeholder — cf. mémoire `feedback_fake_domain_integration`)
- `prod-beta` → hôtes prod-bêta internes (réalm Keycloak `mes-reunions`)

Demander confirmation des URLs si non détectables depuis le repo courant
(`deploy/kubernetes/environments/<env>/`).

### 2. Obtenir un device_token synthétique (étape humaine)
L'agent ne lit, ne génère ni n'affiche aucun secret (cf. `instructions.md` du groupe).
Demander à l'utilisateur de forger le jeton lui-même — recette `reference_synthetic_device_token`
(HMAC `INTERNAL_API_TOKEN`, claims `qr_token` / `device_id` / `retention_until`) — puis de
l'exporter dans son shell sous `SMOKE_TOKEN`, sans le coller dans la conversation.
NE PAS sonder Keycloak.

### 3. Trois appels critiques

| # | Endpoint | Attendu | Piège connu |
|---|---|---|---|
| 1 | `GET /api/meetings` | 200 + JSON list (même vide) | `MeetingResponse` validator strict → un seul champ pourri bloque tout listing |
| 2 | `GET /audio?meeting_id=…` | 200 + Content-Type `audio/webm` | trailing slash → HTTP downgrade |
| 3 | `POST /transcription` (multipart, `extension=.m4a`) | 202 + job_id | `Authorization: Bearer` (plus `apikey:`) |

```bash
BASE="https://api.<env>.fake-domain.name"
TOKEN="$SMOKE_TOKEN"   # fourni par l'utilisateur

echo "=== 1. List meetings ==="
curl -sS -w "\nHTTP %{http_code}\n" -H "Authorization: Bearer $TOKEN" "$BASE/api/meetings"

echo "=== 2. Get audio ==="
# Remplacer <MID> par un meeting_id valide (ou skip si list est vide)
curl -sS -o /tmp/smoke.webm -w "HTTP %{http_code} | type=%{content_type} | size=%{size_download}\n" \
  -H "Authorization: Bearer $TOKEN" "$BASE/audio?meeting_id=<MID>"

echo "=== 3. POST transcription ==="
curl -sS -w "\nHTTP %{http_code}\n" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -F "operation=transcription" \
  -F "file=@/tmp/smoke.webm;filename=smoke.m4a" \
  "$BASE/api/transcription"
```

### 4. Verdict
- ✅ Les 3 calls renvoient leurs codes attendus → pipeline OK
- ❌ Sinon, lister les pièges OIDC/intégration à vérifier en priorité
  (cf. `feedback_mcr_integration_gotchas`)

## Limites
- N'évalue PAS la qualité de transcription (juste que la queue accepte le job).
- N'exécute PAS de polling sur `job_id` (ajouter manuellement si besoin avec
  watchdog `feedback_pipeline_monolithic_antipatterns`).
- N'écrit RIEN en DB.

---

**Env cible** : $ARGUMENTS

> Si la ligne ci-dessus montre encore un nom de variable, ton agent ne substitue pas les
> arguments : prends-les dans la demande de l'utilisateur.
