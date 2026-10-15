# Groupe `fr-gouv/data` : données publiques et data.gouv.fr

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["fr-gouv/data"]`) ou par URL : voir le README.

## Périmètre

Données ouvertes publiques : API de la plateforme data.gouv.fr (catalogue, jeux de données, organisations,
téléchargement, métriques, tabular) et données ouvertes du SIG (schémas, JSONL).

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `gouv-fr-datagouv-apis` | Consommer les APIs data.gouv.fr (Main, Metrics, Tabular) |
| `gouv-fr-donnees-ouvertes` | Données ouvertes publiques du SIG (schémas, JSONL) |

## Règles

- Choisir la **bonne surface** avant d'écrire une requête : Main (catalogue), Metrics (statistiques) ou
  Tabular (filtrage de lignes) — le routage est dans `gouv-fr-datagouv-apis`.
- Respecter la **pagination et les limites de débit** ; distinguer démo et production.
- Ne jamais publier de donnée personnelle ou sensible dans un jeu de données ouvert.

Pour la conformité RGPD des données traitées, voir `gouv-fr-conformite-rgaa` (groupe `fr-gouv/conformite`).
