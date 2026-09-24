---
type: décision
title: Secrets applicatifs - Vault (VSO) ou SOPS
description: Comparer les deux mécanismes de secrets applicatifs sur CPiN et rappeler ce qui relève de la chaîne CI.
tags: [décision, secrets, vault, vso, sops]
---

# Secrets : Vault/VSO, SOPS ou secrets de chaîne

| Mécanisme | Portée | Usage |
|---|---|---|
| **Vault + VSO** (recommandé) | secrets applicatifs dans le namespace | `VaultStaticSecret` référençant `vaultAuthRef: vault-auth`, `mount: <organisation>-<projet>`, `type: kv-v2`, `destination.create: true` |
| **SOPS** | secrets chiffrés dans Git | `SopsSecret` (`isindir.github.com/v1alpha3`), chiffré avec la clé publique **age** du cluster : `sops -e --age $AGE_KEY --encrypted-suffix Templates` |
| **Secrets de chaîne** | GitLab CI DSO uniquement | Vault interne DSO, lu par `.vault:read_secret` (étape `read-secret` obligatoire pour builder) |

## Règles
- `VaultAuth` est créé par la console et **toujours nommé `vault-auth`**.
- Pas de credentials dans une ConfigMap (Kyverno `cm-no-credentials` bloque `password`, `passwd`, `secret_key`).
- Ne pas utiliser le mount `cubbyhole` (partagé entre projets).
- Côté chart : passer le manifeste par `extraObjects`, ou utiliser le chart tobi `vso-utils` (rend `VaultAuth`, `VaultStaticSecret`, `VaultDynamicSecret`, `VaultPKISecret`, `VaultConnection`).
  Compatibilité de version VSO entre `vso-utils` 2.0.0 et le cluster : **non vérifiée**.
- Exemple officiel : `cloud-pi-native/exemples_ServiceTeam`, dossier `secrets/vault`.
