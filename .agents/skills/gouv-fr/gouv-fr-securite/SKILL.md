---
name: gouv-fr-securite
description: "Sécurité : secrets, gitleaks, SQL, TLS, isolation VM."
category: security
version: 0.1.1
author: etalab-ia, Hermes Agent
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, security, secrets, gitleaks, sql-injection, tls, dependencies, vm-isolation, cryptography, auth]
    related_skills: [gouv-fr-projet-structure, gouv-fr-workflow-dev, gouv-fr-securite, gouv-fr-anssi-guides]
---

# Gouv-fr — Règles de sécurité

Règles de sécurité non négociables pour les applications gouv-fr-code-index.

## Principes

- **Aucun secret en dur** — jamais de clé API, token, mot de passe. `.env` uniquement, jamais commité
- **gitleaks obligatoire** — `--no-verify` interdit
- **Données sensibles** — pas de données personnelles, RH, médicales. Données synthétiques en fixtures
- **SQL injection** — utiliser des requêtes paramétrées, jamais de concaténation
- **Dépendances** — pas d'ajout non justifié, préférer la lib standard
- **TLS** — HTTPS par défaut, pas de désactivation vérification certificat
- **Doute = pause** — en cas de doute : s'arrêter et demander

## Isolation VM

- L'agent tourne dans une VM Lima — aucun accès aux fichiers personnels (clés SSH, cookies)
- Aucun accès aux credentials hôte
- Push/PR GitHub uniquement si PAT configuré
- Pas de sudo sans explication ; pas de chemins en dur

## Prompt Injection

L'agent peut tenter des appels réseau. Mitigations :
- Clés dédiées et révocabiles
- Review humaine obligatoire pour les PR
- Privilégier les appels en sortie uniquement
