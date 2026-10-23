# URLs des instances

Les URLs des services internes sont **propres à chaque instance** et ne sont pas versionnées : elles se
relèvent sur l'instance et se notent dans `.cpin/instance.env` (voir plus bas). Les instances n'ont pas
toutes la même version de plateforme (`/api/v1/version`) : relever la version réelle avant de supposer un
comportement.

Les scripts du kit lisent les URLs dans `.cpin/instance.env`, créé par `console.mjs init` avec des
placeholders (aucune URL n'est codée en dur). `console.mjs instance --set https://console.<instance>` note
l'URL de la console ; les URL des services se relèvent avec `console.mjs urls` (voir le runbook), ou se
notent avec `console.mjs instance --url ARGOCD_URL=https://…`, jamais déduites d'une autre instance.

| Service | Motif (à relever sur l'instance) |
|---|---|
| Console | `console.<instance>` |
| ArgoCD | `argocd.<zone>` |
| Harbor | `harbor.<zone>` |
| GitLab | `<gitlab>` |
| Keycloak | `keycloak.<instance>/realms/dso` |
| Vault | `vault.<zone>` |

## Accès API

| Service | Endpoint | Auth |
|---|---|---|
| ArgoCD | `GET /api/v1/applications` | `Authorization: Bearer <token OIDC>` |
| Harbor | `GET /api/v2.0/projects` | `Authorization: Bearer <token OIDC>` |
| GitLab | `GET /api/v4/user` | `PRIVATE-TOKEN: <PAT>` |
| Console | `GET /api/v1/me` | `x-dso-token: <jeton API>` |
| Vault | `GET /v1/auth/token/lookup-self` | `X-Vault-Token: <token copié dans l'UI>` |

Scripts de debug : `scripts/cpin-debug/` (login Playwright optionnel + un check par service).
