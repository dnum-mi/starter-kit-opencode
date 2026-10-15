# gouv-fr-securite — contenu d'origine (fusionné dans gouv-fr-securite)

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
