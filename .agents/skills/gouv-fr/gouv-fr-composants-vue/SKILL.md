---
name: gouv-fr-composants-vue
description: "Installer et utiliser VueDsfr (composants Vue 3 DSFR)."
category: frontend
version: 1.0.0
author: Hermes Agent (Nous Research)
license: MIT
platforms: [linux, macos]
metadata:
  hermes:
    tags: [dsfr, vue, vuejs, vue-3, composants, etat, gouv-fr, ui]
    related_skills: [gouv-fr-design-system, gouv-fr-graphiques-dsfr, gouv-fr-templates-email, gouv-fr-compliance-rgaa, gouv-fr-react-dsfr, gouv-fr-lasuite-ui-kit]
---

# Gouv-fr — Composants Vue (VueDsfr)

VueDsfr (`@gouvminint/vue-dsfr`) : portage en **Vue 3** du Système de Design de l'État français (DSFR). Utilisable comme
plugin ou en imports nommés.

## Quand utiliser

- Construire une application Vue 3 conforme DSFR (composants, formulaires, navigation).
- Intégrer des composants DSFR dans un projet Vue 3 / Vue CLI / Nuxt 3.
- Générer du code Vue SFC conforme DSFR.

Don't use for: visualisation de données (→ `gouv-fr-graphiques-dsfr`), emails (→ `gouv-fr-templates-email`), ou projets hors
administration publique.

## Prérequis

- Vue 3 (`vue@^3.4.0`).
- npm ou yarn/pnpm.
- Le DSFR CSS (`@gouvfr/dsfr`) installé côté projet.

## Référence rapide
```bash
npm install @gouvminint/vue-dsfr
```

### Installation comme plugin (recommandé)

```js
import { createApp } from 'vue'
import App from './App.vue'
import VueDsfr from '@gouvminint/vue-dsfr'

const app = createApp(App)
app.use(VueDsfr)
app.mount('#app')
```

### Imports nommés (sans plugin)

```js
import { DsfrHeader, DsfrButton, DsfrBreadcrumb, DsfrCard, VIcon } from '@gouvminint/vue-dsfr'

const app = createApp(App)
  .component('DsfrHeader', DsfrHeader)
  .component('DsfrButton', DsfrButton)
  .component('DsfrBreadcrumb', DsfrBreadcrumb)
  .component('DsfrCard', DsfrCard)
  .component('VIcon', VIcon)
  .mount('#app')
```

### Intégration Nuxt 3

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  css: [
    '@gouvfr/dsfr/dist/core/core.main.min.css',
    '@gouvfr/dsfr/dist/component/component.main.min.css',
    '@gouvfr/dsfr/dist/utility/utility.main.min.css',
    '@gouvfr/dsfr/dist/scheme/scheme.min.css',
    '@gouvminint/vue-dsfr/styles',
  ],
  // VueDsfr fonctionne avec le plugin vite unplugin-auto-import
  // voir docs.vue-ds.fr/composants pour la configuration Vite complète
})
```

## Composants principaux

Tous les composants sont préfixés `Dsfr` (sauf `VIcon`) :

| Catégorie | Composants clés |
|---|---|
| Navigation | `DsfrHeader`, `DsfrSideMenu`, `DsfrBreadcrumb`, `DsfrNavigation`, `DsfrTabs` |
| Formulaires | `DsfrInput`, `DsfrSelect`, `DsfrCheckbox`, `DsfrCheckboxSet`, `DsfrRadioButton`, `DsfrRadioButtonSet`,
`DsfrToggleSwitch`, `DsfrRange`, `DsfrMultiselect`, `DsfrFileUpload`, `DsfrInputGroup`, `DsfrFieldset` |
| Boutons | `DsfrButton`, `DsfrButtonGroup`, `DsfrSegmented`, `DsfrSegmentedSet` |
| Alerts/Notices | `DsfrAlert`, `DsfrNotice`, `DsfrCallout`, `DsfrHighlight` |
| Badges/Tags | `DsfrBadge`, `DsfrTag`, `DsfrTags` |
| Cartes | `DsfrCard`, `DsfrTiles`, `DsfrTile` |
| Modales/Dialog | `DsfrModal`, `DsfrConsent` |
| Accordéons | `DsfrAccordion`, `DsfrAccordionsGroup` |
| Navigation | `DsfrStepper`, `DsfrPagination`, `DsfrBackToTop` |
| Tableaux | `DsfrTable` + enfants |
| Icônes | `VIcon` (collections personnalisables) |
| Liens/Partage | `DsfrFranceConnect`, `DsfrShare`, `DsfrFollow`, `DsfrNewsLetter`, `DsfrLanguageSelector` |
| Divers | `DsfrQuote`, `DsfrTranscription`, `DsfrErrorPage`, `DsfrFileDownload` |

## Utilisation en template

```vue
<template>
  <DsfrButton @click="handleClick">Cliquez-moi</DsfrButton>
  <DsfrInput label="Nom" placeholder="Votre nom" />
  <DsfrAlert alertType="info" title="Information" />
</template>

<script setup>
import { DsfrButton, DsfrInput, DsfrAlert } from '@gouvminint/vue-dsfr'
</script>
```

## CSS — Ordre d'import obligatoire

Les composants VueDsfr nécessitent **toutes** les couches CSS du DSFR :

1. `@gouvfr/dsfr/dist/core/core.main.min.css` — socle minimal
2. `@gouvfr/dsfr/dist/component/component.main.min.css` — composants DSFR
3. `@gouvfr/dsfr/dist/utility/utility.main.min.css` — utilitaires + icônes
4. `@gouvfr/dsfr/dist/scheme/scheme.min.css` — thèmes clair/sombre
5. `@gouvminint/vue-dsfr/styles` — styles propres à VueDsfr

## Pièges
- **CSS incomplet** : si l'une des 5 couches CSS manque, les composants se rendent mal (couleurs, icônes, espacements cassés). Toujours importer les 5 couches.
- **Préfixe `Dsfr`** : tous les composants DSFR-Vue commencent par `Dsfr` (sauf `VIcon`). Ne pas utiliser les classes `fr-*` en direct avec les composants Vue — c'est le composant qui gère les classes.
- **Plugins Vite** : `vue-ds.fr/composants` décrit un setup Vite avec `unplugin-auto-import` et `unplugin-vue-components` (resolver `vueDsfrComponentResolver`). En mode "sans plugin", enregistrer chaque composant explicitement via `.component()`.
- **Nuxt 3** : utiliser les CSS dans `nuxt.config.ts` et laisser le resolver de `unplugin-vue-components` gérer l'auto-import. Ne pas mixer imports manuels et auto-import.
- **Icônes personnalisées** : utiliser `customIconCollectionsCreator` du meta package pour ajouter ses propres collections. Les collections sont dans le fichier `icons/` du projet.
- **Le DSFR est réservé à l'État** : ne pas utiliser hors administration publique.
- **Versionning** : vérifier la version npm la plus récente (`npm view @gouvminint/vue-dsfr version`) — la version exacte importe pour la compatibilité CSS.

## Vérification
- Les composants rendent avec les classes `fr-*` attendues (inspecter le DOM ou utiliser la console Vue DevTools).
- Les styles sont complets : aucun composant rendu avec des polices cassées, icônes manquantes, ou couleurs par défaut.
- Les événements émettent les événements attendus (`@change`, `@update:modelValue`, etc.) pour les composants formulaires.
- Le thème clair/sombre (`data-fr-scheme`) est correctement appliqué.

## Références

- Docs officielles : [docs.vue-ds.fr](https://docs.vue-ds.fr/)
- Demo : [vue-ds.fr](https://vue-ds.fr/)
- NPM : [@gouvminint/vue-dsfr](https://www.npmjs.com/package/@gouvminint/vue-dsfr)
- Source : [GitHub — betagouv/vue-dsfr](https://github.com/betagouv/vue-dsfr)