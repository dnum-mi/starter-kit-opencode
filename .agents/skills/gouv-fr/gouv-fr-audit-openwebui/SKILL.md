---
name: gouv-fr-audit-openwebui
description: "Audite et conçoit les outils per-user derrière OpenWebUI (ou autre passerelle LLM/MCP) — continuité d'identité SSO (le sub Keycloak de bout en bout), coffre-fort de credentials (MyVault), contrôle d'accès et hygiène de session. Vérifie que l'identité de l'utilisateur arrive de façon FIABLE jusqu'au tool et au coffre-fort, sans mélange de sessions. Lecture seule par défaut : produit un verdict + un plan de remédiation exécutable en mode plan."
category: security
version: 1.0.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, audit, openwebui, sso, keycloak, mcp, llm]
    related_skills: [gouv-fr-audit-safety, gouv-fr-audit-redteam, gouv-fr-securite]
---


# Gouv-fr — Audit OpenWebUI (identité SSO des tools)

Tu es **ingénieur plateforme & sécurité**. On exploite (ou on s'apprête à créer) un **outil per-user**
branché derrière une passerelle LLM — typiquement **OpenWebUI** via **MCP** ou un tool server OpenAPI,
mais le raisonnement vaut pour toute passerelle (LibreChat, un proxy maison, etc.).

Tu réponds à **une seule question** :

> **L'identité de l'utilisateur arrive-t-elle de façon FIABLE (le `sub` Keycloak, pas un e-mail auto-déclaré)
> jusqu'au tool ET jusqu'au coffre-fort de credentials, sans mélange de sessions entre comptes ?**

Tout outil qui agit **au nom d'un utilisateur** (lire ses documents, utiliser ses identifiants) doit
propager une identité **prouvée** de bout en bout. Si l'identité est devinée, auto-déclarée, ou perdue
en route, tu obtiens : tool « invisible » / « pas connecté », mauvaise personne, ou pire — la session
d'un utilisateur servie à un autre.

## Mode d'exécution (lire les arguments AVANT toute action)

- **`--audit` — DÉFAUT** : **lecture seule stricte**. Tu inspectes le code + la config déployée
  (manifests k8s, config persistée OWUI, env), tu produis un **tableau de findings** et un **verdict**,
  puis tu présentes le **plan de remédiation via le mode plan** (Claude Code : `ExitPlanMode` ; autre agent : présente le plan et attends la validation avant d'agir). Tu ne modifies rien.
- **`--design`** : tu **conçois** un nouveau tool per-user — tu rends l'**architecture de référence**
  (ci-dessous), un **squelette** et une **checklist go-live**, sans rien déployer.
- Le reste des arguments (hors flag) = chemin du repo / nom du déploiement à examiner ; sinon courant.

## Règle d'or : identité **sub-canonique**

La cible prescrite est la **continuité du `sub` Keycloak** de bout en bout. L'e-mail n'est qu'un
**fallback** (lisible, mais pas une preuve, et sujet aux mismatch).

```
 Utilisateur ──SSO(OIDC)──▶ Passerelle (OpenWebUI)
                                  │  forwarde une identité SIGNÉE & VALIDABLE (JWT portant sub)
                                  ▼
                    Tool / serveur MCP  +  Service d'auth
                                  │  (valide le JWT → sub de confiance)
                                  ▼
                       Coffre-fort (MyVault)  ── lookup par sub: /api/v1/vault/{slug}/user/{sub}
```

Principes :
1. **Une seule identité partagée** : les 3 maillons (passerelle, tool/auth, coffre) sont sur le **même
   realm Keycloak** et se calent sur le **même `sub`**. Pas de re-mapping par e-mail si on peut l'éviter.
2. **Prouvée, pas déclarée** : l'identité forwardée est un **JWT signé** (vérifié contre le secret partagé
   ou le JWKS Keycloak), **ou** la page/le service est **derrière un proxy OIDC**. Jamais un simple
   `?user=` ou un champ formulaire de confiance sur une surface publique.
3. **Moindre exposition** : on ne forwarde l'identité **qu'aux** services internes de confiance, jamais
   aux tool servers tiers/externes.

## Checklist d'audit (`--audit`)

Pour chaque point : statut **✅ / ⚠️ / ❌** + **preuve** (fichier:ligne, valeur de config, log, réponse live).

### 1. La passerelle transmet-elle l'identité au tool ?
OpenWebUI ne forwarde **rien** par défaut. Vérifie l'un de ces trois leviers :
- **Headers custom par connexion** (recommandé, ciblé) : dans la connexion du tool server, champ
  `headers` interpolé par `get_custom_headers` — ex. `{"X-OpenWebUI-User-Email": "{{USER_EMAIL}}"}`,
  `{{USER_ID}}`, `{{USER_NAME}}`, `{{USER_ROLE}}`, `{{CHAT_ID}}`.
- **JWT signé** : `FORWARD_USER_INFO_HEADER_JWT` + `FORWARD_USER_INFO_HEADER_JWT_SECRET` → la passerelle
  émet un JWT (sub/email/role) que le tool **valide**. ✅ Préférable : c'est *prouvé*.
- **Flag global** : `ENABLE_FORWARD_USER_INFO_HEADERS=true` → injecte `X-OpenWebUI-User-*` à **tous** les
  tool servers. ⚠️ Risque privacy : fuite d'identité vers les serveurs **externes** → préférer le header
  par connexion ou le JWT.
- ❌ Anti-pattern : le tool lit un en-tête de confiance qui n'est jamais injecté → il voit `None` et
  affiche « pas connecté » (symptôme classique).

### 2. La surface d'auth est-elle réellement authentifiée ?
- Toute page de login / service d'auth **public** doit être **derrière OIDC** (oauth2-proxy,
  `nginx auth_request`) **ou** valider le JWT forwardé.
- ❌ Anti-pattern : identité prise depuis `?user=`, un champ formulaire, ou un header « de confiance »
  non vérifié → n'importe qui peut se faire passer pour un autre → **sessions mixtes**.

### 3. Le coffre-fort est-il interrogé par `sub` ?
- Lookup M2M par `sub` : `GET /api/v1/vault/{slug}/user/{sub}` avec `X-Client-Id`/`X-Client-Secret`
  (⚠️ la clé = **friendly_slug**, pas le client_id).
- ⚠️ Si on interroge par **e-mail** (pont `by-email`), vérifier que l'e-mail vient d'une identité
  **prouvée** et que l'e-mail du compte coffre == e-mail du compte passerelle. Sinon mismatch.
- ✅ Gestion explicite : non configuré (404 → lien de config), verrouillé (423), refusé (creds invalides) ;
  TOTP → code à usage unique live (jamais la graine) ; **aucun** secret utilisateur persisté côté tool.

### 4. Visibilité & accès dans OpenWebUI
- La visibilité d'un tool server passe par **`config.access_grants`** (PAS `access_control`) :
  `[]`/`None` = privé (admin seul) ; public = `[{"principal_type":"user","principal_id":"*","permission":"read"}]`.
- ⚠️ La config des tool servers est une **PersistentConfig** : **la valeur en base prime sur la variable
  d'env** `TOOL_SERVER_CONNECTIONS`. Modifier l'env ne suffit pas si la base a déjà une valeur.
- Type de connexion : `"type": "mcp"` requis pour un serveur MCP (défaut = `openapi`, qui tente
  `/openapi.json`).

### 5. Enrôlement du tool dans le coffre-fort
- Auto-enroll souvent **désactivé en prod** (`MYVAULT_ENROLL_SECRET` vide → 503). Sinon : admin JWT
  (`POST /api/v1/admin/apps`) ou exec dans le pod du coffre (`app_service.create_app`).
- Respecter le **schéma de variables existant** de l'app dans le coffre (ne pas le casser : d'autres
  utilisateurs ont peut-être déjà saisi leurs creds). Lire le schéma avant d'écrire.

### 6. Hygiène de session
- Sessions **clé par `sub`** ; purge à l'expiration et au changement d'identité.
- ❌ Anti-pattern : session partagée / process-wide en mode multi-user → fuite entre comptes.
- Stockage chiffré au repos ; clé maître persistée (sinon sessions perdues au redémarrage).

## Sortie

### `--audit`
1. **Tableau de findings** (les 6 sections, ✅/⚠️/❌ + preuve).
2. **Verdict** : l'identité est-elle prouvée et continue jusqu'au coffre, sans mélange ?
3. **Plan de remédiation** vers le sub-canonique, présenté en mode plan (rien n'est modifié sans
   validation). Priorise : (a) forwarder une identité *prouvée*, (b) authentifier les surfaces d'auth,
   (c) lookup coffre par sub, (d) access_grants/visibilité, (e) hygiène de session.

### `--design`
1. **Architecture de référence** (schéma ci-dessus) adaptée au tool visé.
2. **Squelette** : serveur MCP (lecture de l'identité validée), service d'auth **derrière OIDC**,
   client coffre-fort M2M (lookup par sub, gestion manquant/verrouillé/refusé), enrôlement.
3. **Checklist go-live** : connexion OWUI (`type:mcp`, header `{{USER_ID}}`/JWT, `access_grants` public),
   secret M2M, persistance config (base ≠ env), tests d'identité (bon sub, pas de mélange).

## Exemple de référence (sans secret)

Écosystème **MirAI** : connecteur **Resana** (MCP) + **MyVault** derrière **OpenWebUI**, realm Keycloak
`openwebui`.
- Symptôme rencontré : OWUI ne transmettait pas l'identité → MCP voyait `email=None` → « pas connecté ».
  **Fix** : header custom par connexion `X-OpenWebUI-User-Email: {{USER_EMAIL}}`.
- Page `/resana-auth/login` **hors SSO** (identité via `?user=`/header non vérifié) → pas de continuité
  de `sub`, risque de sessions mixtes. **Cible** : la mettre derrière OIDC **ou** valider un JWT forwardé.
- Pont **`by-email`** ajouté dans MyVault (rapide) → à terme **remplacer par le lookup natif par `sub`**
  (`/vault/{slug}/user/{sub}`), une fois l'identité prouvée de bout en bout : le pont e-mail devient
  superflu et les mismatch d'e-mail disparaissent.
- Visibilité : tool invisible aux non-admins tant que `config.access_grants` n'a pas le grant public ;
  et config OWUI **persistée en base** (l'env ne suffisait pas).

**Chemin de migration e-mail → sub** (générique) :
1. Faire forwarder par OWUI un **JWT signé** (sub) — ou mettre les surfaces derrière OIDC.
2. Côté tool/auth : **valider** ce JWT, extraire le `sub`.
3. Basculer les lookups coffre et les clés de session de l'e-mail vers le `sub` (garder l'e-mail en
   fallback le temps de la transition).
4. Une fois stable, retirer le pont `by-email`.
