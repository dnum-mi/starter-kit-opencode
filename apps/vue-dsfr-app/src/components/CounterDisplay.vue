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
        secondary
        size="sm"
        @click="decrement"
      />
      <DsfrButton
        label="Reset"
        secondary
        size="sm"
        @click="reset"
      />
      <DsfrButton
        label="+"
        secondary
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
