import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { Event } from '~/types'

// mockNuxtImport is a macro transpiled by @nuxt/test-utils Vite plugin.
// It replaces the auto-imported symbol for the duration of the test file.
mockNuxtImport('useI18n', () => {
  return () => ({ locale: { value: 'zh-TW' } })
})

mockNuxtImport('useLocalePath', () => {
  return () => (path: string) => path
})

const { default: EventCard } = await import('~/components/EventCard.vue')

// ---------------------------------------------------------------------------

const baseEvent: Event = {
  id: 'evt-1',
  slug: 'test-concert',
  title: '測試演唱會',
  description: '一場精彩的演出',
  date: '2026-08-15T19:00:00.000Z',
  venue: '台北小巨蛋',
  city: '台北',
  category: 'concert',
  coverImage: '/images/test.jpg',
  tickets: [
    { id: 't1', type: 'VIP', price: 3000, available: 10, total: 50 },
    { id: 't2', type: '一般', price: 1200, available: 5, total: 100 },
  ],
}

function mountCard(event: Event) {
  return mount(EventCard, {
    props: { event },
    global: {
      mocks: { $t: (k: string) => k },
      stubs: { NuxtLink: { template: '<a><slot /></a>' } },
    },
  })
}

describe('EventCard', () => {
  describe('price display', () => {
    it('shows the minimum ticket price', () => {
      const wrapper = mountCard(baseEvent)
      expect(wrapper.text()).toContain('1,200')
    })

    it('shows the single price when there is only one ticket tier', () => {
      const event: Event = {
        ...baseEvent,
        tickets: [{ id: 't1', type: 'VIP', price: 5000, available: 10, total: 50 }],
      }
      const wrapper = mountCard(event)
      expect(wrapper.text()).toContain('5,000')
    })
  })

  describe('availability', () => {
    it('shows the soldOut key when all tickets are unavailable', () => {
      const event: Event = {
        ...baseEvent,
        tickets: [
          { id: 't1', type: 'VIP', price: 3000, available: 0, total: 50 },
          { id: 't2', type: '一般', price: 1200, available: 0, total: 100 },
        ],
      }
      const wrapper = mountCard(event)
      expect(wrapper.text()).toContain('events.soldOut')
    })

    it('does not show soldOut when at least one ticket is available', () => {
      const wrapper = mountCard(baseEvent)
      expect(wrapper.text()).not.toContain('events.soldOut')
    })

    it('shows "from" prefix key when tickets are available', () => {
      const wrapper = mountCard(baseEvent)
      expect(wrapper.text()).toContain('events.from')
    })
  })

  describe('metadata', () => {
    it('renders the event title', () => {
      const wrapper = mountCard(baseEvent)
      expect(wrapper.text()).toContain('測試演唱會')
    })

    it('renders the venue and city', () => {
      const wrapper = mountCard(baseEvent)
      expect(wrapper.text()).toContain('台北小巨蛋')
      expect(wrapper.text()).toContain('台北')
    })

    it('renders the cover image with the event title as alt text', () => {
      const wrapper = mountCard(baseEvent)
      const img = wrapper.find('img')
      expect(img.attributes('alt')).toBe('測試演唱會')
      expect(img.attributes('src')).toBe('/images/test.jpg')
    })
  })
})
