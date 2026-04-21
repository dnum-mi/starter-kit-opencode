<script setup lang="ts">
import { DsfrHeader, DsfrFooter } from '@gouvminint/vue-dsfr'
import CounterDisplay from './components/CounterDisplay.vue'
</script>

<template>
  <DsfrHeader
    home-label="Accueil"
    home-to="/"
    service-title="CoFabNum"
    service-description="Application de démonstration"
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
