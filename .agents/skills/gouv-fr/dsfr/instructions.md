# Groupe `gouv-fr/dsfr` : design system de l'État et interfaces

> Chargé en plus du socle `AGENTS.md`, par le plugin (`"groups": ["gouv-fr/dsfr"]`) ou par URL : voir le README.

## Périmètre

Interfaces conformes au design system de l'État : DSFR (CSS/JS, composants, pictogrammes, graphiques,
templates email), échafaudage VueDsfr, et variantes React.

## Skills

| Skill | Quand l'utiliser |
|-------|-----------------|
| `dsfr` | Installer et vérifier le DSFR — composants, pictogrammes, graphiques, templates email |
| `composants-vue` | Installer et utiliser VueDsfr (composants Vue 3 DSFR) |
| `react-dsfr` | React DSFR (`@codegouvfr/react-dsfr`), setup Next.js App Router |

## Règles

- **Ne jamais inventer une classe `fr-*`** : la vérifier dans le CSS officiel de la version épinglée
  (`scripts/verify_dsfr.py` compare le HTML au CSS réel).
- Le DSFR est **réservé aux services de l'État** (conditions d'utilisation).
- Épingler **une seule et même version** du DSFR sur tous les fichiers (NPM et CDN compris).
- Préférer le paquet officiel `@gouvfr/dsfr` et servir son `dist/` complet plutôt qu'un CSS recodé.

Les librairies React/DSFR voisines (LaSuite) sont dans le groupe `gouv-fr/lasuite`.
