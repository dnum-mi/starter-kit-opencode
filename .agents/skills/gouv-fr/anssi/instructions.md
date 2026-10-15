# Groupe `gouv-fr/anssi` : sécurité, audit et référentiels ANSSI

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["gouv-fr/anssi"]`) ou par URL : voir le README.

## Périmètre

Sécurité des applications et audit : règles non négociables, sûreté d'ouverture d'une base de code,
durcissement avant pen-test, audit des services LLM (red-team et identité SSO), accès aux guides ANSSI.

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `anssi-guides` | Trouver et consulter le bon guide ANSSI (API MesServicesCyber) |
| `securite` | Règles de sécurité (secrets, SQL, TLS, isolation VM, prompt injection) + sûreté avant ouverture d'un dépôt |
| `audit-pentest` | Audit & durcissement avant pen-test (OWASP Top 10 + OWASP LLM) |
| `audit-llm` | Red-team / prompt-injection (OWASP LLM01) et identité SSO des tools derrière une passerelle |

## Règles

- **Aucun secret jamais recopié** : emplacement (`fichier:ligne` / `commit`), type, et recommandation de
  rotation — jamais la valeur.
- Les rapports sensibles vont dans `private/`, gitignoré, **jamais committés**.
- **Lecture seule** sur la cible d'audit, sauf action explicitement validée par l'humain.
- Pas de réécriture d'historique ni de rotation automatiques : préparer le plan, l'humain exécute.
