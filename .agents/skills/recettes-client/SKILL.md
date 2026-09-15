---
name: recettes-client
description: Use when building Vue 3 or Nuxt 3 frontend projects for Fabrique Numérique — DSFR compliance, VueDsfr scaffolding, composable patterns like toaster, and testing setup
allowed-tools: Read Write Bash
---

# CoFabNum Client Recipes

Vue 3 with **VueDsfr** (DSFR port) and **Nuxt 3**. Ministry of Interior requires DSFR.

## Vue 3

### Scaffolding

```console
pnpm create vue-dsfr
# Answer: Vue 3 + TS
```

### What create-vue-dsfr includes

- TypeScript config, ESLint config
- VueDsfr dependencies
- Example app with header
- Minimal router (2 routes) + minimal store
- `unplugin-auto-import` + `unplugin-vue-components`

### Dépendances & setup DSFR (obligatoire)

Le rendu conforme DSFR dépend de la **feuille de style officielle `@gouvfr/dsfr`**, pas du bundle interne de VueDsfr. Pincer les deux dépendances et importer le CSS officiel dans le point d'entrée de l'app :

```jsonc
// package.json
{
  "dependencies": {
    "@gouvfr/dsfr": "^1.11.0", // feuille de style DSFR officielle
    "@gouvminint/vue-dsfr": "^8.0.0"
  }
}
```

```ts
// src/main.ts
import '@gouvfr/dsfr/dist/dsfr.min.css' // CSS DSFR officiel et à jour
import { createApp } from 'vue'
import VueDsfr from '@gouvminint/vue-dsfr'
import App from './App.vue'

createApp(App).use(VueDsfr).mount('#app')
```

- N'importe **pas** `@gouvminint/vue-dsfr/styles` seul : c'est une copie vieillie du CSS, et sans dépendance directe à `@gouvfr/dsfr` la version DSFR n'est ni verrouillée ni à jour.
- Vérifie la version installée (`pnpm list @gouvminint/vue-dsfr`) — évite les vieilles versions (ex. 3.x) qui embarquaient un vieux CSS DSFR.

### Recommended additions

- [date-fns](https://date-fns.org/) for date manipulation
- [Pinia](https://pinia.vuejs.org) for state
- [Vue Router](https://router.vuejs.org)
- [UnoCSS](https://unocss.dev) for styling

### Testing stack

- **Vitest** — test runner
- **Vue Testing Library** — component testing
- **Jest DOM** — assertions (compatible with Vitest, do NOT use Jest)
- **Playwright** — E2E and component tests

### Folder architecture

See [conventions-cofabnum] for the full Vue.js structure. Key: views in folders with co-located tests and sub-components.

## Nuxt 3

### Scaffolding

```console
pnpm create vue-dsfr
# Answer: Nuxt 3 + TS
```

### When to use Nuxt 3

- SEO-critical applications (SSR)
- Fast first paint (SSG)
- File-based routing needed
- Auto-imports desired

### What create-vue-dsfr includes

- TypeScript, ESLint, VueDsfr (Nuxt 3 compatible)
- Example app, minimal store

## Toaster (Alert System)

A shared composable + component pattern for DSFR-compatible alerts.

### composable: `useToaster`

```ts
// src/composables/use-toaster.ts
import { getRandomId, type TitleTag } from '@gouvminint/vue-dsfr'

export type Message = {
  id?: string
  title?: string
  description: string
  type: 'info' | 'success' | 'warning' | 'error'
  closeable: boolean
  titleTag: TitleTag
  timeout?: number
}

const messages: Message[] = reactive<Message[]>([])
const timeouts: Record<string, number> = {}

export const useToaster = () => {
  const removeMessage = (id: string) => {
    const idx = messages.findIndex(m => m.id === id)
    clearTimeout(timeouts[id])
    if (idx !== -1) messages.splice(idx, 1)
  }

  const addMessage = (message: Message) => {
    message.id ??= getRandomId('toaster')
    messages.push(message)
    if (message.timeout) {
      timeouts[message.id!] = window.setTimeout(
        () => removeMessage(message.id!),
        message.timeout
      )
    }
  }

  return { messages, addMessage, removeMessage }
}
```

Les IDs sont générés via `getRandomId('toaster')` importé de VueDsfr — **ne réimplémente pas** ton propre générateur d'ID.

### component: `AppToaster.vue`

```vue
<script setup lang="ts">
import { DsfrAlert } from '@gouvminint/vue-dsfr'
import type { Message } from '@/composables/use-toaster'
defineProps<{ messages: Message[] }>()
const emit = defineEmits(['close-message'])
const close = (id: string) => emit('close-message', id)
</script>

<template>
  <div class="toaster-container">
    <transition-group name="list" tag="div" class="toasters">
      <DsfrAlert
        v-for="msg in messages" :key="msg.id"
        class="app-alert" v-bind="msg"
        @close="close(msg.id!)"
      />
    </transition-group>
  </div>
</template>

<style scoped>
.toaster-container {
  pointer-events: none; position: fixed; bottom: 1rem; width: 100%; z-index: 1;
}
.toasters { display: flex; flex-direction: column; align-items: center; }
.app-alert { background: var(--grey-1000-50); width: 90%; pointer-events: all; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateY(30px); }
</style>
```

### Usage

```vue
<script setup>
import AppToaster from '@/components/AppToaster.vue'
import useToaster from '@/composables/use-toaster'
const toaster = useToaster()
toaster.addMessage({ description: 'Saved', type: 'success', closeable: true, titleTag: 'h3', timeout: 3000 })
</script>
<template>
  <DsfrHeader /* ... */ />
  <router-view />
  <AppToaster :messages="toaster.messages" @close-message="toaster.removeMessage($event)" />
</template>
```

## Form Inputs — DsfrInput

Real `DsfrInputProps` (from `@gouvminint/vue-dsfr`, confirmed against `node_modules/@gouvminint/vue-dsfr/**/DsfrInput.types.d.ts`):

| Prop | Type | Purpose |
|------|------|---------|
| `modelValue` | `string \| number` | v-model |
| `label` | `string` | Field label |
| `labelVisible` | `boolean` | Show/hide label |
| `hint` | `string` | Help text |
| `isInvalid` | `boolean` | Error state (red border + error styling) |
| `isValid` | `boolean` | Success state |
| `isTextarea` | `boolean` | Render as `<textarea>` |
| `isWithWrapper` | `boolean` | Wrap in `.fr-input-group` |

```vue
<DsfrInput
  v-model="email"
  label="Email"
  :is-invalid="!!errors.email"
  :hint="errors.email ?? 'Format attendu : nom@domaine.fr'"
/>
```

There is **no `native-validators` prop** — validation/error state is driven by `isInvalid` + `hint`/`errorMessage`, handled in your own validation logic (e.g. VeeValidate, Zod).

## Layout, typo & tokens DSFR

Utilise les utilitaires et tokens DSFR **au lieu de réinventer le layout en CSS maison** :

- **Conteneur / grille** : `fr-container`, `fr-grid-row` (+ `fr-grid-row--center`, `fr-grid-row--gutters`) et colonnes `fr-col-12 fr-col-md-6`… (responsive par défaut).
- **Espacement** : utilitaires `fr-py-*w`, `fr-px-*w`, `fr-mt-*w`, `fr-mb-*w` (ex. `fr-py-6w`, `fr-mb-2w`).
- **Typographie** : `fr-h1`…`fr-h6`, `fr-display--md`, `fr-text--lg`, `fr-text--sm`, `fr-text--bold` — pas de `font-size`/`font-weight` codés en dur.
- **Couleurs / tokens** : toujours via les variables DSFR (`--bf-500`, `--red-marianne-425-625`, `--border-default-grey`, `--background-default-grey`, …) — jamais de valeurs hex en dur (`#000091`, `#ce0500`).

```vue
<section class="fr-container fr-py-6w">
  <div class="fr-grid-row fr-grid-row--center">
    <div class="fr-col-12 fr-col-md-6">
      <h1 class="fr-h3">Titre</h1>
      <p class="fr-text--lg">Sous-texte</p>
    </div>
  </div>
</section>
```

## Gotchas

- **DSFR is mandatory** — Ministry of Interior projects must use VueDsfr, not a generic component library
- **Package name is `@gouvminint/vue-dsfr`, not `@gouvfr/dsfr-vue`** — and components are prefixed `Dsfr*` (`DsfrInput`, `DsfrButton`), not `Fr*`. A plan referencing `@gouvfr/dsfr-vue`/`FrInput` is hallucinated — verify against `package.json` and `node_modules/@gouvminint/vue-dsfr` before coding (see the verification checklist in `AGENTS.md`)
- **Vue component files need 2+ words** — `LoginForm.vue` not `Form.vue` (exception: `App.vue`)
- **Jest DOM with Vitest** — do NOT install Jest, Jest DOM is compatible with Vitest directly
- **Toaster timeouts must clean up** — always `clearTimeout` on remove to prevent memory leaks
- **`getRandomId` from VueDsfr** — use the library's utility, don't generate your own IDs
- **Transition group needs CSS** — `pointer-events: none` on container but `pointer-events: all` on alerts so they're clickable
- **Playwright on Onyxia requires `--no-sandbox`** — the container runs as root without a sandbox; add `args: ['--no-sandbox']` to the browser launch options in `playwright.config.ts` or tests will fail to launch Chromium
