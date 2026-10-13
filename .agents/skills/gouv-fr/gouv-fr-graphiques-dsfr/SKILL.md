---
name: gouv-fr-graphiques-dsfr
description: "Graphiques DSFR en web-components Vue.js (line, bar, pie…)."
category: frontend
version: 0.2.0
author: Hermes Agent (Nous Research)
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [dsfr, chart, data, visualization, vue, graph, graphique]
    related_skills: [gouv-fr-design-system, gouv-fr-compliance-rgaa]
---

# Gouv-fr — Graphiques DSFR

DSFR Chart (`@gouvfr/dsfr-chart`) : web-components Vue.js de visualisation conformes au DSFR (thème clair/sombre
automatique).

## Quand utiliser

- Intégrer des graphiques (courbes, barres, secteurs, radar…) dans une application DSFR.
- Représenter des données statistiques publiques dans un tableau de bord accessible.

Don't use for: visualisations hors DSFR ou graphiques interactifs complexes sur mesure (→ D3.js directement).

## Prérequis

- Node.js ≥ 18.16.1 et un `package.json`.
- Un projet DSFR configuré important au minimum : `dsfr.min.css`, `icons-system.min.css` (dans `utility/icons/`) et l'API JS du DSFR.

## Référence rapide
```bash
npm install @gouvfr/dsfr-chart
```

Composants vérifiés (tags web-components kebab-case, source : README officiel) :

| Tag | Usage |
|---|---|
| `<line-chart>` | courbes |
| `<bar-chart>` | barres (verticales/horizontales/empilées) |
| `<pie-chart>` | secteurs / donut |
| `<radar-chart>` | radar |
| `<scatter-chart>` | nuage de points |
| `<gauge-chart>` | jauges |
| `<map-chart>` | cartes |
| `<bar-line-chart>` | combiné barres+courbes |
| `<table-chart>` | table de données |
| `<data-box>` | encadré normé (titre, source, date, actions) |

```html
<data-box id="abc" name="Emplois en France" source="INSEE" date="2021-01-01">
  <line-chart … />
</data-box>
```

## Procédure

1. `npm install @gouvfr/dsfr-chart` ; le paquet est dans `node_modules/@gouvfr/dsfr-chart/`.
2. Importer les CSS/JS : soit le bundle `Charts`, soit un dossier par type (`LineChart/`, `BarChart/`…) pour ne charger
que ce qu'il faut.
3. Utiliser les tags en HTML (web-components) ou comme composants d'un projet Vue 3.
4. Catalogue complet, props et exemples : [documentation et demo
officielles](https://gouvernementfr.github.io/dsfr-chart/).

## Pièges
- Intégration CDN sans npm : le bundle « fourre-tout » du README (`Charts/`) n'existe PAS dans le paquet npm ; le bundle complet est `dist/DSFRChart/DSFRChart.js` + `DSFRChart.css` (autonome, 0 import externe, enregistre les custom elements). Chemin jsDelivr exact : `https://cdn.jsdelivr.net/npm/@gouvfr/dsfr-chart@2.1.1/dist/DSFRChart/DSFRChart.js`.
- Formats vérifiés (README 2.1.1) : `line-chart` multi-séries exige `x` répété par série (`x='[[labels],[labels]]'`) ; `pie-chart` attend `x='[["groupe1","groupe2"]]'` (liste DE listes) et `y='[[v1,v2]]'` ; `bar-chart` empilé : `y` = une liste de valeurs par série.
- Les attributs `x`/`y`/`name` sont des chaînes JSON : en HTML, delimiter simple (`x='[[…]]'`) et échapper les `&` ; vérifier la cohérence des totaux vs source par reprogrammation (regex + json.loads), pas à l'œil.
- `DataBox` exige `id`, `name`, `source`, `date` (props obligatoires documentées).
- Chaque type de graphique a son propre format de données : vérifier les props dans la doc officielle, ne pas deviner.
- Le thème clair/sombre vient du DSFR parent ; sans le CSS DSFR chargé, les couleurs sont cassées.
- Ne pas lister « de mémoire » des types de graphiques : le catalogue fait foi (ex. pas de heatmap ni de box-plot dans le README officiel).

## Vérification
- Les graphiques rendent sans erreur console ; les données affichées correspondent aux datasets passés.
- La bascule clair/sombre fonctionne dans le contexte DSFR.
- Le rendu est responsive (redimensionner la fenêtre).
