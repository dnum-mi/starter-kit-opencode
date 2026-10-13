---
name: gouv-fr-pictogrammes-dsfr
description: "Intègre pictogrammes, icônes et visuels officiels du DSFR."
category: frontend
version: 0.2.0
author: Hermes Agent (Nous Research)
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [dsfr, artwork, pictogram, icon, svg, illustration]
    related_skills: [gouv-fr-design-system, gouv-fr-compliance-rgaa]
---

# Gouv-fr — Pictogrammes et icônes DSFR

Les assets visuels du DSFR (pictogrammes SVG, icônes, motifs décoratifs) sont inclus dans le paquet `@gouvfr/dsfr` — pas
de dépôt séparé à installer.

## Quand utiliser

- Intégrer un pictogramme ou une icône officielle dans une application DSFR.
- Ajouter un motif décoratif ou une illustration institutionnelle.

Don't use for: créer des pictogrammes hors charte, usage commercial hors État, logo Marianne (celui-ci est la classe CSS
`fr-logo`, gérée par le skill principal).

## Référence rapide
```bash
npm install @gouvfr/dsfr
```

```html
<!-- Pictogramme SVG (chemins réels, vérifiés dans dist 1.15.3) -->
<img src="node_modules/@gouvfr/dsfr/dist/artwork/pictograms/buildings/city-hall.svg" alt="Hôtel de ville">

<!-- Icônes par classe (158 icônes fr-fi-*, ex. fr-fi-checkbox-line) -->
<button class="fr-btn fr-icon-add-line">Ajouter</button>
```

## Procédure

### Emplacement des assets (vérifié dans le paquet 1.15.3, 220 fichiers)

- `dist/artwork/pictograms/<thème>/*.svg` — pictogrammes par thème : `accessibility`, `buildings`, `systeme`, etc.
- `dist/artwork/background/ovoid.svg`, `dist/artwork/light.svg`, `dark.svg` — fonds décoratifs.

### Classes artwork dans le CSS officiel

Familles réellement définies : `fr-artwork`, `fr-artwork-decorative`, `fr-artwork-background`, `fr-artwork-major`,
`fr-artwork-minor`, `fr-artwork-motif` (+ variantes de couleur `--blue-ecume`, `--green-bourgeon`, …). Les éléments
décoratifs portent `aria-hidden="true"`.

### Icônes

Classes utilitaires `fr-fi-*` / `fr-icon-*` en préfixe ou suffixe de composant (ex. `fr-fi-mail-line`,
`fr-btn--github`). Vérifier le nom exact dans `utility.min.css` avant usage.

## Pièges
- **Classes inventées** : `fr-artwork-ministery`, `fr-artwork-brand`, `fr-artwork-theme-*` n'existent PAS dans le CSS officiel. Toujours contrôler le nom dans le CSS (cf. `gouv-fr-design-system/scripts/verify_dsfr.py`).
- Logo Marianne = classe `fr-logo` (SVG inline via le CSS), pas un fichier `marianne.svg` dans artwork.
- `alt` descriptif obligatoire sur les images signifiantes ; `alt=""` + `aria-hidden="true"` pour le purement décoratif.
- Les icônes sociales (Bluesky, etc.) sont ajoutées au fil des versions : vérifier la classe dans le CSS de la version épinglée.

## Vérification
- L'image s'affiche (chemin `dist/artwork/...` correct, asset en 200 en HTTP).
- Chaque classe `fr-*` utilisée est présente dans le CSS officiel (script `verify_dsfr.py`).
- `alt` présent et pertinent sur les pictogrammes porteurs de sens.
