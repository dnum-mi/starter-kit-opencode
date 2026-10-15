---
name: audit-llm
description: Audite un service LLM ou un agent — prompt-injection / red-team (OWASP LLM01) et continuité de l'identité SSO des outils derrière une passerelle (sub Keycloak de bout en bout).
category: securite
version: 0.3.0
license: MIT
platforms: [linux, macos]
---

# Gouv-fr — Audit LLM & agents (red-team + identité SSO)

## Quand utiliser

Deux axes d'audit d'un service LLM, agent ou passerelle :

1. **Red-team / prompt-injection** — mesurer ce qu'un utilisateur malveillant peut extraire ou faire faire au
   modèle (OWASP LLM01).
2. **Identité des tools** — vérifier que l'identité utilisateur est propagée **et prouvée** de bout en bout
   (passerelle → tool / serveur MCP → coffre-fort).

## 1. Red-team (prompt-injection)

### Garde-fous

- **Cible autorisée uniquement** : le service du repo courant, ou une URL fournie explicitement par
  l'utilisateur. Jamais une cible tierce.
- **Lecture seule sur le code** : aucune modification de source, aucun commit côté cible.
- **Confidentialité des findings** : les payloads qui marchent, les réponses brutes du modèle et les secrets
  éventuellement exfiltrés restent **uniquement** dans `private/redteam-reports/`. Jamais dans un message, une
  PR, un commit ou un rapport committé.
- **Anti-leak AVANT d'écrire** : garantir que `.gitignore` ignore `private/`.

### Vérifications de fin

- `git check-ignore private/redteam-reports/` → ignoré.
- Aucun payload gagnant ni réponse brute hors `private/`.
- La synthèse ne contient que des chiffres agrégés.

Étapes détaillées : [`references/source-gouv-fr-audit-redteam.md`](references/source-gouv-fr-audit-redteam.md)

## 2. Identité SSO des outils

### Règle d'or : identité **sub-canonique**

La cible prescrite est la **continuité du `sub` Keycloak** de bout en bout. L'e-mail n'est qu'un **fallback**
(lisible, mais pas une preuve, et sujet aux mismatch).

```
Utilisateur ──SSO(OIDC)──▶ Passerelle (OpenWebUI)
                                 │  forward une identité SIGNÉE & VALIDABLE (JWT portant sub)
                                 ▼
                   Tool / serveur MCP  +  Service d'auth
                                 │  (valide le JWT → sub de confiance)
                                 ▼
                    Coffre-fort (MyVault) ── lookup par sub
```

Principes :

1. **Une seule identité partagée** : les 3 maillons (passerelle, tool/auth, coffre) sont sur le **même realm
   Keycloak** et se calent sur le **même `sub`**. Pas de re-mapping par e-mail si on peut l'éviter.
2. **Prouvée, pas déclarée** : l'identité forwardée est un **JWT signé** (vérifié contre le secret partagé ou le
   JWKS Keycloak), **ou** la page/le service est **derrière un proxy OIDC**. Jamais un simple `?user=` ni un
   champ formulaire de confiance sur une surface publique.
3. **Moindre exposition** : on ne forward l'identité **qu'aux** services internes de confiance, jamais aux tool
   servers tiers/externes.

Checklist d'audit et exemple de sortie :
[`references/source-gouv-fr-audit-openwebui.md`](references/source-gouv-fr-audit-openwebui.md)
