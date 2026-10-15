# Groupe `fr-gouv/conformite` : conformité État, RGPD et homologation

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["fr-gouv/conformite"]`) ou par URL : voir le README.

## Périmètre

Conformité d'un service de l'État : RGAA (accessibilité), DSFR, RGPD (données et cookies), audit de
conformité, et homologation (DAT) — pré-remplissage depuis le code puis rendu Word ministériel.

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `gouv-fr-conformite-rgaa` | Vérifier la conformité RGAA/DSFR/RGPD et mettre en place un gestionnaire de cookies |
| `gouv-fr-audit-conformite` | Audit de conformité d'une application |
| `gouv-fr-dat` | Pré-remplir un document d'homologation puis produire le livrable `.docx` |

## Règles

- **Ne jamais inventer une donnée d'homologation** : donnée manquante → `[À CONFIRMER]` ; choix de conception
  ou responsabilité socle/plateforme → `N/A — …`.
- **Aucune valeur réelle** dans le DAT : pas d'IP, port d'écoute, hôte, clé, token ou bucket ; matrice des
  flux = port standard du protocole.
- Lecture seule sur le service audité.
- Le DSFR reste **réservé aux services de l'État** ; le CSS officiel fait foi pour toute classe `fr-*`
  (groupe `fr-gouv/dsfr`).
