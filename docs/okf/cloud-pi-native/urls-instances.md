# URLs des instances

Tableau des URLs des services internes par instance. Les URLs Cloud Pi sont des **exemples par instance** :
les instances n'ont pas toutes la même version de plateforme (`/api/v1/version`). Relever la
version réelle de l'instance avant de supposer un comportement.

| Service | SDID | Autre instance |
|---|---|---|
| Console | `console.sdid.cpin.numerique-interieur.com` | `console.<instance>` |
| ArgoCD | `argocd.sdid.cpin.numerique-interieur.com` | `argocd.<zone>` |
| Harbor | `harbor.sdid.cpin.numerique-interieur.com` | `harbor.<zone>` |
| GitLab | `gitlab.sdid.cpin.numerique-interieur.com` | `<gitlab>` |
| Keycloak | `keycloak.sdid.cpin.numerique-interieur.com/realms/dso` | idem |
| Vault | `vault.sdid.cpin.numerique-interieur.com` (à confirmer par instance) | `vault.<zone>` |

## Accès API

| Service | Endpoint | Auth |
|---|---|---|
| ArgoCD | `GET /api/v1/applications` | `Authorization: Bearer <token OIDC>` |
| Harbor | `GET /api/v2.0/projects` | `Authorization: Bearer <token OIDC>` |
| GitLab | `GET /api/v4/user` | `PRIVATE-TOKEN: <PAT>` |
| Console | `GET /api/v1/me` | `x-dso-token: <jeton API>` |
| Vault | `GET /v1/auth/token/lookup-self` | `X-Vault-Token: <token copié dans l'UI>` |

Scripts de debug : `scripts/cpin-debug/` (login Playwright optionnel + un check par service).
