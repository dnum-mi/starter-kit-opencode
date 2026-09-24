---
type: référence
title: Secrets sur CPiN
description: Distinction entre secrets de la chaîne CI (Vault interne) et secrets applicatifs (Vault/VSO ou SOPS), règles associées.
tags: [cpin, secrets, vault, vso, sops]
---

# Secrets sur CPiN

- **Chaîne CI** : Vault interne DSO (kv v2, arborescence `projects/<organisation>/<projet>/<outil>`), lu par GitLab CI en **OIDC** (token court, limité au projet). Les utilisateurs n'y ont pas accès.
- **Applicatifs** : (1) **Vault via VSO** — mount `<organisation>-<projet>`, `VaultStaticSecret` avec `vaultAuthRef: vault-auth` (créé par la console) ; (2) **SOPS** — `SopsSecret` chiffré avec la clé age du cluster ; voir [decisions/secrets-vault-vs-sops.md](../decisions/secrets-vault-vs-sops.md).
- Règles : pas de credentials en ConfigMap ; pas de `cubbyhole` ; secrets de signature d'images dans les variables CI GitLab, pas dans Git.
- Consultation : « Afficher les secrets des services » du projet (par défaut réservé au propriétaire) donne le token et l'id du dépôt `mirror`, l'accès Harbor et le nom du pull secret.
