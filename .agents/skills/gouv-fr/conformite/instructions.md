# Groupe `gouv-fr/conformite` : conformité État, RGAA et RGPD

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["gouv-fr/conformite"]`) ou par URL : voir le README.

## Périmètre

Conformité d'un service de l'État : RGAA (accessibilité), DSFR (design system), RGPD (données
personnelles et cookies) et audit de conformité d'une application existante.

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `conformite-rgaa` | Vérifier la conformité RGAA/DSFR/RGPD et mettre en place un gestionnaire de cookies |
| `audit-conformite` | Audit de conformité d'une application : écarts, correctifs, vérification de bout en bout |

## Règles

- **Ne jamais inventer** une information réglementaire : donnée manquante → la signaler comme à confirmer.
- Lecture seule sur le service audité ; toute correction est proposée avant d'être appliquée.
- Le DSFR reste **réservé aux services de l'État** ; le CSS officiel fait foi pour toute classe `fr-*`
  (groupe `gouv-fr/dsfr`).
