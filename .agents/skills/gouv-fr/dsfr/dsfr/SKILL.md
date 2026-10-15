---
name: dsfr
description: Installe et vérifie le design system de l'État (DSFR) — CSS/JS officiels, composants, pictogrammes, graphiques et templates email — sans jamais inventer de classe.
category: design
version: 0.3.0
license: MIT
platforms: [linux, macos]
---

# Gouv-fr — Design System de l'État (DSFR)

## Quand utiliser

- Construire une interface conforme au design system de l'État français.
- Installer ou configurer le DSFR (NPM, CDN ou clone), vérifier le HTML/CSS/JS produit.
- Intégrer un **pictogramme/icône** officiel, un **graphique** DSFR, ou un **template email** institutionnel.

Réservé aux services de l'État (conditions d'utilisation). Ne pas utiliser pour les newsletters marketing
grand public ni les projets hors administration publique.

## Prérequis

- Node.js ≥ 18.16.1 et npm (installation NPM), **ou** intégration CDN jsDelivr.
- Python 3 (stdlib seule) pour la vérification sans navigateur : `scripts/verify_dsfr.py`.

## Installation

```bash
npm install @gouvfr/dsfr
```

Le rendu conforme DSFR dépend de la **feuille de style officielle `@gouvfr/dsfr`**, pas du bundle interne de
VueDsfr. Pincer les deux dépendances et vérifier qu'elles pointent sur la même version du DSFR.

**CDN** : épingler la **même version** sur tous les fichiers. `dsfr.min.js` n'existe pas : utiliser
`dist/dsfr.module.min.js` avec `type="module"`, plus `dsfr.nomodule.min.js` en fallback. Les pictogrammes et
icônes exigent `utility.min.css` **en plus de** `dsfr.min.css`. Détail : [`references/cdn-integration.md`](references/cdn-integration.md),
[`references/verify-no-browser.md`](references/verify-no-browser.md).

## Composants

Boutons, alerts, badges, cartes, formulaires, tabs, modals, accordéons, header/sidemenu/mega-menu, breadcrumbs,
skiplinks… Liste exhaustive sur [systeme-de-design.gouv.fr](https://www.systeme-de-design.gouv.fr/). **Toujours
vérifier un nom de classe dans le CSS officiel** avant de l'utiliser.

## Pictogrammes et icônes

```html
<img src="node_modules/@gouvfr/dsfr/dist/artwork/pictograms/buildings/city-hall.svg" alt="Hôtel de ville">
<button class="fr-btn fr-icon-add-line">Ajouter</button>
```

Logo Marianne = classe `fr-logo` (SVG inline via le CSS), pas un fichier `marianne.svg`. `alt` descriptif
obligatoire sur les images signifiantes ; `alt=""` + `aria-hidden="true"` pour le purement décoratif.

## Graphiques

`npm install @gouvfr/dsfr-chart` — web-components kebab-case : `<line-chart>`, `<bar-chart>`, `<pie-chart>`,
`<radar-chart>`, `<scatter-chart>`, `<gauge-chart>`, `<map-chart>`, `<bar-line-chart>`, `<table-chart>`,
`<data-box>` (encadré normé : titre, source, date, actions).

## Templates email

Adaptation CSS du DSFR pour email (le template n'inclut **pas** le code du DSFR) : styles inline pour Outlook,
tableaux HTML pour la mise en page, images hébergées publiquement, lien de désabonnement RGPD, contraste
4.5:1 / 3:1.

## Pièges (classes vérifiées contre le CSS 1.15.3)

- **Ne jamais inventer les classes** : `fr-btn--primary`, `fr-hero`, `fr-hero__desc`, `fr-hero__cta`,
  `fr-artwork-ministery`, `fr-artwork-brand`, `fr-artwork-theme-*`, `fr-footer__content-item` **n'existent pas**.
- Bouton primaire = `fr-btn` seul ; encadré = `fr-callout` (pas `fr-call`).
- CGU ≥ v1.15.0 : `npm install` déclenche un postinstall exigeant l'acceptation des CGU.
- Intégration locale : `icons-system.min.css` est sous `utility/icons/icons-system/`.
- **Le CSS officiel est la seule source de vérité** : `scripts/verify_dsfr.py` compare chaque classe `fr-*` du
  HTML aux sélecteurs réels du CSS. Préférer le paquet officiel à un CSS recodé à la main.
- Navigateur indisponible ? Vérifier sans navigateur (voir `references/verify-no-browser.md`).

## Vérification

- `python3 scripts/verify_dsfr.py index.html` → zéro classe `fr-*` inconnue, zéro asset manquant (retour 0).
- `npm run build` termine sans erreur.
- Graphiques : rendent sans erreur console, données conformes aux datasets passés.
- Email : validator ([Mail-Tester](https://www.mail-tester.com/) / [Litmus](https://litmus.com/)), affichage
  Outlook/Gmail/Apple Mail, images chargées, désabonnement fonctionnel.

Détail par usage : [`references/source-gouv-fr-design-system.md`](references/source-gouv-fr-design-system.md),
[`references/source-gouv-fr-pictogrammes-dsfr.md`](references/source-gouv-fr-pictogrammes-dsfr.md),
[`references/source-gouv-fr-graphiques-dsfr.md`](references/source-gouv-fr-graphiques-dsfr.md),
[`references/source-gouv-fr-templates-email.md`](references/source-gouv-fr-templates-email.md).
