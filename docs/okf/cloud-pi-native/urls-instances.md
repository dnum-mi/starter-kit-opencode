# URLs des instances

Tableau des URLs des services internes par instance. Les URLs Cloud Pi sont des **exemples par instance** :
les instances n'ont pas toutes la même version de plateforme (`/api/v1/version`). Relever la
version réelle de l'instance avant de supposer un comportement.

Les scripts du kit lisent l'instance choisie dans `.cpin/instance.env`
(`console.mjs instance --set <sdid|rie|https://console.…>`) ; une URL « à relever » s'y note avec
`console.mjs instance --url ARGOCD_URL=https://…`, jamais déduite d'une autre instance.

| Service | SDID (Scaleway) | RIE | Autre instance |
|---|---|---|---|
| Console | `console.sdid.cpin.numerique-interieur.com` | `console.dso.interieur.rie.gouv.fr` | `console.<instance>` |
| ArgoCD | `argocd.sdid.cpin.numerique-interieur.com` | à relever | `argocd.<zone>` |
| Harbor | `harbor.sdid.cpin.numerique-interieur.com` | à relever | `harbor.<zone>` |
| GitLab | `gitlab.sdid.cpin.numerique-interieur.com` | à relever | `<gitlab>` |
| Keycloak | `keycloak.sdid.cpin.numerique-interieur.com/realms/dso` | à relever | idem |
| Vault | `vault.sdid.cpin.numerique-interieur.com` (à confirmer par instance) | à relever | `vault.<zone>` |

## Accès API

| Service | Endpoint | Auth |
|---|---|---|
| ArgoCD | `GET /api/v1/applications` | à relever | `Authorization: Bearer <token OIDC>` |
| Harbor | `GET /api/v2.0/projects` | à relever | `Authorization: Bearer <token OIDC>` |
| GitLab | `GET /api/v4/user` | à relever | `PRIVATE-TOKEN: <PAT>` |
| Console | `GET /api/v1/me` | `x-dso-token: <jeton API>` |
| Vault | `GET /v1/auth/token/lookup-self` | à relever | `X-Vault-Token: <token copié dans l'UI>` |

Scripts de debug : `scripts/cpin-debug/` (login Playwright optionnel + un check par service).
