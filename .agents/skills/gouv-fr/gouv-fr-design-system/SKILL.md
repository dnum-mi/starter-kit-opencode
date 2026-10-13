---
name: gouv-fr-design-system
description: "Installer et vérifier le design system de l'État (DSFR)."
category: frontend
version: 0.3.1
author: Hermes Agent (Nous Research)
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [dsfr, design-system, etat, gouv-fr, ui, acces]
    related_skills: [gouv-fr-pictogrammes-dsfr, gouv-fr-graphiques-dsfr, gouv-fr-templates-email, gouv-fr-compliance-rgaa, gouv-fr-react-dsfr]
---

# Gouv-fr — Design System de l'État (DSFR)

Le DSFR est le design system officiel de l'administration française. Ce skill couvre installation (NPM/CDN/clone) et
vérification de conformité. Hors périmètre : emails (→ `gouv-fr-templates-email`), graphiques (→ `gouv-fr-graphiques-dsfr`),
pictogrammes en détail (→ `gouv-fr-pictogrammes-dsfr`).

## Quand utiliser

- Construire une interface conforme au design system de l'État français.
- Installer ou configurer le DSFR (NPM, CDN ou clone).
- Générer ou vérifier du HTML/CSS/JS conforme DSFR.

Don't use for: conception de templates email, visualisation de données, projets hors administration publique (usage
réservé).

## Prérequis

- Node.js ≥ 18.16.1 et npm (installation NPM), **ou**
- Internet seulement : intégration CDN jsDelivr (`references/cdn-integration.md`).
- Python 3 (stdlib seule) pour la vérification sans navigateur : `scripts/verify_dsfr.py`.

## Référence rapide
```bash
# NPM (recommandé)
npm install @gouvfr/dsfr

# CDN — version exacte vérifiée 1.15.3 ; dernière version :
# https://data.jsdelivr.com/v1/packages/npm/@gouvfr/dsfr/resolved
# <head> :
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.15.3/dist/dsfr.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.15.3/dist/utility/utility.min.css">
# avant </body> :
<script type="module" src="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.15.3/dist/dsfr.module.min.js"></script>
<script nomodule src="https://cdn.jsdelivr.net/npm/@gouvfr/dsfr@1.15.3/dist/dsfr.nomodule.min.js"></script>
```

## Procedure

### Via NPM

1. `npm install @gouvfr/dsfr`.
2. Lier `dist/dsfr.min.css` + `dist/utility/utility.min.css` dans `<head>`.
3. Charger `dist/dsfr.module.min.js` (`type="module"`) et `dist/dsfr.nomodule.min.js` (`nomodule`) avant `</body>`.
4. Critère de fin : `python3 scripts/verify_dsfr.py page.html` retourne zéro classe inconnue.

### Via CDN (sans npm)

1. Appliquer `references/cdn-integration.md`. Critère : aucun 404 sur les ressources.
2. Servir la page via HTTP (`python3 -m http.server 8080`), jamais en `file://`.

### Depuis le clone

`git clone https://github.com/GouvernementFR/dsfr.git` puis `npm install && npm run build`. `dist/` = compilés à
distribuer, `src/` = sources Sass/JS, `example/` = snippets HTML, `doc/` = docs composants.

### Thème clair / sombre

Bascule automatique selon `prefers-color-scheme` ; forcer avec `data-fr-scheme="light"` ou `"dark"`.

## Composants

Boutons, alerts, badges, cartes, formulaires, tabs, modals, accordéons, header/sidemenu/mega-menu, breadcrumbs,
skiplinks… Liste exhaustive sur [systeme-de-design.gouv.fr](https://www.systeme-de-design.gouv.fr/). Toujours vérifier
un nom de classe dans le CSS officiel avant de l'utiliser (voir Pitfalls).

## Pièges
- **Usage réservé** : le DSFR est réservé aux services de l'État (conditions d'utilisation).
- **CGU ≥ v1.15.0** : `npm install` déclenche un postinstall exigeant l'acceptation des CGU ; le GitHub Releases ne distribue plus de zip compilé — passer par NPM ou jsDelivr.
- **Ne jamais inventer les classes** (vérifiées contre le CSS 1.15.3) : bouton primaire = `fr-btn` seul — `fr-btn--primary` N'EXISTE PAS (les modificateurs sont `--secondary`, `--tertiary`, `--tertiary-no-outline`, `--sm`, `--lg`) ; skiplinks = `fr-skiplinks` + `fr-skiplinks__list` (pas `fr-skip-links`, pas `fr-nav__list`) ; breadcrumb = `fr-breadcrumb__list` / `__link` (pas `__item`) ; tagline du header = `fr-header__service-tagline` (`fr-header__service-description` N'EXISTE PAS).
- **Pas de composant « hero » en 1.15.3** : `fr-hero`, `fr-hero__desc`, `fr-hero__cta` N'EXISTENT PAS dans le CSS officiel (ni dans le clone). Bandeau titre = `<h1>` + `<p class="fr-text--lead">` + `<div class="fr-btns-group fr-btns-group--inline-md">`.
- **Callout = `fr-callout`** (pas `fr-call`) : `fr-callout__title`, `fr-callout__text`, modificateurs de couleur `fr-callout--<couleur>`. `fr-call` existe comme sélecteur nu mais n'est pas le composant.
- **Liste des liens utiles du footer** : `<ul class="fr-footer__content-list">` avec `<li>` sans classe (`fr-footer__content-item` N'EXISTE PAS) et `<a class="fr-footer__content-link">`.
- Intégration locale du paquet dsfr-clone/dist : `icons-system.min.css` est sous `utility/icons/icons-system/` et référence `../../../icons/` ; `dsfr.min.css` référence `fonts/` → copier `fonts/` ET `icons/` complets à côté, sinon 404 des icônes/polices.
- **Nom du bundle JavaScript** : `dist/dsfr.min.js` n'existe pas et renvoie 404. Utiliser `dist/dsfr.module.min.js` avec `type="module"`, complété par `dist/dsfr.nomodule.min.js` avec `nomodule`.
- **Le CSS officiel est la seule source de vérité** : `scripts/verify_dsfr.py` compare chaque classe `fr-*` du HTML aux sélecteurs réels de `dsfr.min.css` + `utility.min.css`. Se fier à cette comparaison, jamais à des listes de classes mémorisées.
- **Paquet réel plutôt que CSS recodé à la main** : installer le paquet officiel `@gouvfr/dsfr` puis servir son répertoire `dist/` complet localement est plus fidèle qu'imiter les classes. Conserver notamment `dist/fonts/` et `dist/icons/` : les feuilles de style les référencent par des URLs relatives (sur jsDelivr, la résolution est automatique).
- **Navigateur indisponible** : Chromium peut manquer (ou `libglib-2.0` système, sans sudo) → vérifier sans navigateur via `references/verify-no-browser.md`.
- **Préférence** : `npm install` et servir le paquet réel plutôt que recoder le CSS DSFR à la main.

## Vérification
- `python3 scripts/verify_dsfr.py index.html` → zéro classe `fr-*` inconnue, zéro asset manquant (code de retour 0).
- `npm run build` (depuis le clone) termine sans erreur.
- Quand un navigateur est dispo : comparer visuellement avec systeme-de-design.gouv.fr.

## Références

- `references/cdn-integration.md` — recette CDN quand npm est indisponible.
- `references/verify-no-browser.md` — méthode de vérification sans navigateur.
- `scripts/verify_dsfr.py` — comparaison des classes `fr-*` au CSS officiel (stdlib Python).
