---
name: securite
description: Applique les règles de sécurité non négociables (secrets, SQL, TLS, isolation VM, prompt injection) et audite la sûreté d'une base de code avant de l'ouvrir ou de l'exécuter.
category: securite
version: 0.3.0
license: MIT
author: Hermes Agent
platforms: [linux, macos]
metadata:
  hermes:
    tags: [gouv-fr, securite, secrets, gitleaks, tls, sql, vm, prompt-injection, surete, anti-leak]
    related_skills: [audit-pentest, audit-llm, anssi-guides, audit-conformite]
---

# Gouv-fr — Sécurité & sûreté des bases de code

## Quand utiliser

Deux cas distincts :

1. **Règles de sécurité** — pendant le développement, pour ne rien laisser passer (secrets, SQL, TLS, dépendances).
2. **Sûreté avant ouverture** — avant de cloner, ouvrir ou exécuter une base de code qu'on ne maîtrise pas.

Ne pas confondre avec `audit-pentest` (surface d'attaque applicative) ni
`audit-llm` (prompt-injection et identité SSO).

## 1. Règles de sécurité non négociables

- **Aucun secret en dur** — jamais de clé API, token, mot de passe. `.env` uniquement, jamais commité
- **gitleaks obligatoire** — `--no-verify` interdit
- **Données sensibles** — pas de données personnelles, RH, médicales. Données synthétiques en fixtures
- **SQL injection** — requêtes paramétrées, jamais de concaténation
- **Dépendances** — pas d'ajout non justifié, préférer la lib standard
- **TLS** — HTTPS par défaut, pas de désactivation de la vérification de certificat
- **Doute = pause** — en cas de doute : s'arrêter et demander

**Isolation VM** : l'agent tourne dans une VM Lima — aucun accès aux fichiers personnels (clés SSH, cookies),
aucun accès aux credentials hôte, push/PR GitHub uniquement si PAT configuré, pas de sudo sans explication,
pas de chemins en dur.

**Prompt injection** : l'agent peut tenter des appels réseau. Mitigations : clés dédiées et révocabiles,
review humaine obligatoire pour les PR, appels en sortie uniquement.

Détail : [`references/source-gouv-fr-securite.md`](references/source-gouv-fr-securite.md)

## 2. Sûreté d'une base de code (audit d'ouverture)

### Règles de fonctionnement

1. **Inoffensif par défaut.** En `--check`, uniquement des commandes en lecture. **Jamais** lancer un script du
   repo (build, install, `make`, `npm install`, `setup.py`) pour « voir » — c'est précisément le risque évalué.
2. **Inspecter, ne pas faire confiance.** Traiter le repo comme potentiellement hostile tant que le contrôle
   d'ouverture n'est pas passé.
3. **Working tree ET historique.** Un secret retiré du HEAD survit dans l'historique ; inspecter les deux, sur
   toutes les refs (`--all`).
4. **Zéro secret dans le rapport.** Ne jamais recopier la valeur : emplacement (`fichier:ligne` / `commit`),
   type, et recommandation **rotation + scrub**.
5. **Neutralité de tout ce qui peut être poussé.** Le rapport sensible va dans `private/` (gitignoré).
6. **Sévérité par finding** : Critique / Élevé / Moyen / Faible, avec impact concret.
7. **Pas de réécriture d'historique ni de rotation automatiques** — les préparer dans le plan ; l'humain exécute.

### Les trois contrôles

| Contrôle | Objet | Verdict |
|---|---|---|
| 1 — Ouverture sûre | hooks git, config git piégée, `.gitattributes`, tâches VSCode auto, devcontainer, scripts de lifecycle npm/pip/Makefile, `.envrc`, submodules, binaires committés | `OUVERTURE SÛRE — OUI/NON` |
| 2 — Anti-leak | gitleaks/trufflehog, pre-commit, `.gitignore` durci, job CI secrets, `private/` gitignoré | plan de mise en place (`--setup`) |
| 3 — Fuite déjà présente | working tree + historique + messages/heads de commit + déjà poussé ? | `AUCUNE FUITE — OUI/NON` |

Le détail commande par commande de chaque contrôle est dans
[`references/source-gouv-fr-audit-safety.md`](references/source-gouv-fr-audit-safety.md).

### Livrables

Rapport dans `private/` (jamais committé) : verdicts, findings sévérités, plan de remédiation
(rotation + scrub d'historique), puis clôture proposant le passage en correction.
