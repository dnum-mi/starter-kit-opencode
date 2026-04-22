# vue-dsfr-app Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer une application Vue 3 + VueDsfr avec un compteur interactif dans un nouveau package monorepo.

**Architecture:** Scaffold officiel `create-vue-dsfr` (Vue 3 + TS), nettoyage du router et Pinia, composant CounterDisplay avec état local `reactive`. Vite dev server configuré pour onyxia WaaS.

**Tech Stack:** Vue 3, TypeScript, VueDsfr, Vite, Vitest, @antfu/eslint-config

---

### Task 0: Créer la branche et préparer le dossier

**Files:**
- Create: `apps/vue-dsfr-app/` (dossier vide)

- [ ] **Step 1: Créer la branche et le dossier**

```bash
git checkout -b vue-dsfr-app
mkdir -p apps/vue-dsfr-app
```

---

### Task 1: Scaffold l'app avec `create-vue-dsfr`

**Files:**
- Create: `apps/vue-dsfr-app/package.json`
- Create: `apps/vue-dsfr-app/tsconfig.json`
- Create: `apps/vue-dsfr-app/vite.config.ts`
- Create: `apps/vue-dsfr-app/index.html`
- Create: `apps/vue-dsfr-app/src/main.ts`
- Create: `apps/vue-dsfr-app/src/App.vue`
- Create: `apps/vue-dsfr-app/src/components/` (scaffold inclut des exemples)

- [ ] **Step 1: Scaffold avec create-vue-dsfr**

```bash
cd apps/vue-dsfr-app
pnpm create vue-dsfr . -- --template vue-ts
```

Répondre aux prompts :
- Framework: **Vue 3**
- TypeScript: **Yes**
- Router: accept (on retirera ensuite)
- Pinia: accept (on retirera ensuite)
- Vite config: accept
- ESLint: accept
- Vitest: accept
- Playwright: no
- Cypress: no

- [ ] **Step 2: Installer les dépendances**

```bash
cd apps/vue-dsfr-app
pnpm install
```

- [ ] **Step 3: Remonter au root du repo et installer**

```bash
cd /home/onyxia/work/fabrique-numerique-conventions
# Vérifier que pnpm-workspace.yaml existe ou le créer
```

- [ ] **Step 4: Installer depuis le root**

```bash
pnpm install
```

---

### Task 2: Configurer Vite dev server

**Files:**
- Modify: `apps/vue-dsfr-app/vite.config.ts`

- [ ] **Step 1: Ajouter la config server**

Ouvrir `apps/vue-dsfr-app/vite.config.ts` et ajouter/modifier :

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: [
      'user-d05d0a57-f200-49cf-8193-5d0cd01ebbf0-246549-user.onyxia.waas.numerique-interieur.com'
    ]
  }
})
```

---

### Task 3: Nettoyer router et Pinia

**Files:**
- Delete: `apps/vue-dsfr-app/src/router/` (dossier complet)
- Delete: `apps/vue-dsfr-app/src/stores/` (dossier complet)
- Modify: `apps/vue-dsfr-app/src/main.ts`
- Modify: `apps/vue-dsfr-app/src/App.vue`
- Modify: `apps/vue-dsfr-app/package.json` (retirer les dépendances inutiles)

- [ ] **Step 1: Supprimer router et stores**

```bash
rm -rf apps/vue-dsfr-app/src/router
rm -rf apps/vue-dsfr-app/src/stores
```

- [ ] **Step 2: Simplifier main.ts**

Remplacer le contenu de `apps/vue-dsfr-app/src/main.ts` par :

```ts
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
```

- [ ] **Step 3: Vérifier package.json**

Vérifier dans `apps/vue-dsfr-app/package.json` que `vue-router` et `pinia` sont retirés des dépendances.

---

### Task 4: Écrire les tests de CounterDisplay

**Files:**
- Create: `apps/vue-dsfr-app/src/components/__tests__/CounterDisplay.test.ts`

- [ ] **Step 1: Créer le fichier de test**

```ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CounterDisplay from '../CounterDisplay.vue'

describe('CounterDisplay', () => {
  it('affiche 0 au démarrage', () => {
    const wrapper = mount(CounterDisplay)
    expect(wrapper.text()).toContain('0')
  })

  it('incrémente le compteur', async () => {
    const wrapper = mount(CounterDisplay)
    const incrementBtn = wrapper.findAll('button').find(el => el.text().includes('+'))
    if (incrementBtn) {
      await incrementBtn.trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('1')
    }
  })

  it('décrémente le compteur quand > 0', async () => {
    const wrapper = mount(CounterDisplay)
    const incrementBtn = wrapper.findAll('button').find(el => el.text().includes('+'))
    const decrementBtn = wrapper.findAll('button').find(el => el.text().includes('-'))
    
    if (incrementBtn && decrementBtn) {
      await incrementBtn.trigger('click')
      await nextTick()
      await decrementBtn.trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('0')
    }
  })

  it('ne descend pas sous 0', async () => {
    const wrapper = mount(CounterDisplay)
    const decrementBtn = wrapper.findAll('button').find(el => el.text().includes('-'))
    
    if (decrementBtn) {
      await decrementBtn.trigger('click')
      await nextTick()
      // Doit rester à 0
      expect(wrapper.text()).toContain('0')
    }
  })

  it('réinitialise le compteur', async () => {
    const wrapper = mount(CounterDisplay)
    const incrementBtn = wrapper.findAll('button').find(el => el.text().includes('+'))
    const resetBtn = wrapper.findAll('button').find(el => el.text().includes('Reset'))
    
    if (incrementBtn && resetBtn) {
      await incrementBtn.trigger('click')
      await nextTick()
      await incrementBtn.trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('2')
      await resetBtn.trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('0')
    }
  })
})
```

- [ ] **Step 2: Lancer les tests (doit échouer - component n'existe pas encore)**

```bash
cd apps/vue-dsfr-app
pnpm test -- src/components/__tests__/CounterDisplay.test.ts --run
```

Expected: FAIL avec "Failed to resolve import CounterDisplay.vue"

---

### Task 5: Implémenter CounterDisplay

**Files:**
- Create: `apps/vue-dsfr-app/src/components/CounterDisplay.vue`

- [ ] **Step 1: Créer le composant CounterDisplay.vue**

```vue
<script setup lang="ts">
import { reactive } from 'vue'
import { DsfrButton } from '@gouvminint/vue-dsfr'

const state = reactive({
  count: 0
})

const increment = () => {
  state.count++
}

const decrement = () => {
  if (state.count > 0) {
    state.count--
  }
}

const reset = () => {
  state.count = 0
}
</script>

<template>
  <div class="counter-display">
    <h2>Compteur</h2>
    <p class="counter-value">{{ state.count }}</p>
    <div class="counter-actions">
      <DsfrButton
        label="-"
        priority="secondary"
        size="sm"
        @click="decrement"
      />
      <DsfrButton
        label="Reset"
        priority="secondary"
        size="sm"
        @click="reset"
      />
      <DsfrButton
        label="+"
        priority="secondary"
        size="sm"
        @click="increment"
      />
    </div>
  </div>
</template>

<style scoped>
.counter-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.counter-value {
  font-size: 4rem;
  font-weight: bold;
}

.counter-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
```

- [ ] **Step 2: Lancer les tests (doit passer)**

```bash
cd apps/vue-dsfr-app
pnpm test -- src/components/__tests__/CounterDisplay.test.ts --run
```

Expected: tous les tests PASS

---

### Task 6: Mettre à jour App.vue

**Files:**
- Modify: `apps/vue-dsfr-app/src/App.vue`

- [ ] **Step 1: Remplacer App.vue**

```vue
<script setup lang="ts">
import { DsfrHeader, DsfrFooter } from '@gouvminint/vue-dsfr'
import CounterDisplay from './components/CounterDisplay.vue'
</script>

<template>
  <DsfrHeader
    home-link-title="Accueil"
    home-link-to="/"
    brand-top="République Française"
    title="CoFabNum"
    description="Application de démonstration"
  />
  <main>
    <CounterDisplay />
  </main>
  <DsfrFooter />
</template>

<style scoped>
main {
  max-width: 60rem;
  margin: 0 auto;
  padding: 2rem;
}
</style>
```

- [ ] **Step 2: Lancer les tests globaux**

```bash
cd apps/vue-dsfr-app
pnpm test -- --run
```

Expected: tous les tests PASS

---

### Task 7: Vérifications finales

**Files:**
- `apps/vue-dsfr-app/` (vérifier que tout build)

- [ ] **Step 1: Build de production**

```bash
cd apps/vue-dsfr-app
pnpm build
```

Expected: build réussi dans `dist/`

- [ ] **Step 2: Lint**

```bash
cd apps/vue-dsfr-app
pnpm lint
```

Expected: pas d'erreurs

- [ ] **Step 3: Test dev server**

```bash
cd apps/vue-dsfr-app
pnpm dev
```

Expected: serveur sur `0.0.0.0:5000`

- [ ] **Step 4: Commit**

```bash
cd /home/onyxia/work/fabrique-numerique-conventions
git add .
git commit -m "feat: add vue-dsfr-app counter demo

Scaffold Vue 3 + VueDsfr app with interactive counter component.
Features: increment, decrement (floor 0), reset.
Vite dev server configured for onyxia WaaS (port 5000)."
```

---

### Notes d'implémentation

- VueDsfr doit être importé depuis `@gouvminint/vue-dsfr`
- `DsfrButton` supporte `label`, `priority`, `size`, `@click`
- Les composants DSFR ont des props typées — vérifier les props existantes dans la version installée
- `@vue/test-utils` v2 avec Vitest pour les tests unitaires
- Si `DsfrButton` n'existe pas dans la version de VueDsfr, adapter vers `DsfrButtonSimple` ou bouton HTML natif avec classes DSFR
