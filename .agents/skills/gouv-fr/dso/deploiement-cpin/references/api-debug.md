# Routes d'API utiles au debug

Pour **constater** l'état d'un service avant de chercher plus loin. Aucune de ces routes ne lit un secret.
Les checks `scripts/cpin-debug/check-*.mjs` en appellent déjà certaines ; Vault passe par
`scripts/cpin-console/vault.mjs`. Les URLs sont des exemples par instance : voir
`docs/okf/cloud-pi-native/urls-instances.md`, et relever la version réelle (`/api/v1/version`).

## Vault (kv v2)

Jeton : `VAULT_TOKEN` dans `.cpin/.env.secrets`. L'humain le copie dans l'UI Vault (icône 👤 > **Copy token**)
et le colle lui-même. Il porte **ses** droits : c'est le script qui borne ce que l'agent en fait.

**Ce que l'agent ne peut pas faire** : lire le contenu d'un secret. Le script n'a pas de route `GET …/data/…`
et refuse tout ce qui n'est pas dans sa liste (`ROUTES`, testée dans `vault.test.mjs`). Le dire à l'humain
avant de lui demander le jeton ; il peut vérifier avec `vault.mjs whoami`.

| Besoin | Commande | Route Vault | Ce que ça dit |
|--------|----------|-------------|---------------|
| Le jeton est-il valide, jusqu'à quand | `vault.mjs whoami` | `GET auth/token/lookup-self` | politiques, expiration ; 403 : jeton expiré |
| Quels mounts vois-je | `vault.mjs mounts` | `GET sys/internal/ui/mounts` | mount `<organisation>-<projet>` présent ou non |
| Ai-je le droit d'écrire ici | `vault.mjs capabilities --path <mount>/<app>/<env>` | `POST sys/capabilities-self` | `read`, `update`, `patch`… (un droit, pas une lecture) |
| Quels secrets existent | `vault.mjs list --path <mount>[/<dossier>]` | `GET <mount>/metadata[/…]?list=true` | **noms** de secrets ; vide : rien n'a été créé |
| Un secret existe-t-il, quand modifié | `vault.mjs metadata --path <mount>/<app>/<env>` | `GET <mount>/metadata/<secret>` | version courante, dates, suppression : jamais les valeurs |
| Alimenter depuis le `.env` | `vault.mjs put --path <mount>/<app>/<env> --env-file .env [--keys A,B]` | `PATCH <mount>/data/<secret>` (puis `POST` s'il n'existe pas) | simulation par défaut ; `--apply` demande confirmation |

Règles d'usage de `put` :

- **Simuler d'abord** (sans `--apply`) : il liste les clés `renseigné` / `vide` / `absent`, jamais une valeur.
  `--apply` n'est lancé qu'après un « oui » explicite de l'humain.
- Les clés vides du `.env` sont **ignorées** : on ne crée pas un secret vide qui masquerait un oubli.
- `PATCH` **fusionne** avec les clés déjà présentes sans les lire. S'il répond 403 (droit `patch` absent), le
  script s'arrête : il n'écrase pas le secret par un `POST`.
- Le secret n'est pas relu après écriture ; vérifier avec `metadata` (la version a bien augmenté).
- Une valeur affichée par accident est à signaler et à révoquer.

Symptômes :

| Symptôme | Route | Lecture |
|----------|-------|---------|
| Pod en `CreateContainerConfigError` (`secret … not found`) | `list` puis `metadata` | secret absent du mount, ou chemin différent de celui du `VaultStaticSecret` |
| Secret présent mais application en erreur d'authentification | `metadata` | version et date : modifié avant ou après le dernier redémarrage ? |
| `put` : 403 | `capabilities` | droit `create`/`update`/`patch` manquant sur ce chemin |
| Tout répond 403 | `whoami` | jeton expiré : en recopier un nouveau |

## Autres services

| Service | Route | Auth | Ce que ça dit |
|---------|-------|------|---------------|
| Console | `GET /api/v1/version` | aucune | version de la plateforme (comportements dépendants) |
| Console | `GET /api/v1/user/tokens` | `x-dso-token` | jeton API valide |
| Console | `GET /api/v1/projects/{id}/secrets` | `x-dso-token` | secrets de la **chaîne** (noms ; valeurs jamais affichées par `console.mjs`) |
| ArgoCD | `GET /api/v1/applications` | `Bearer <session SSO>` | applications, santé, synchro |
| Harbor | `GET /api/v2.0/projects` | `Bearer <session SSO>` | projets accessibles ; `401` : session expirée |
| GitLab | `GET /api/v4/user` | `PRIVATE-TOKEN` | `GITLAB_PAT` valide |
