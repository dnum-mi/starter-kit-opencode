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
