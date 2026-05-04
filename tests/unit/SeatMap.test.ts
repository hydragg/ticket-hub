import { mount } from '@vue/test-utils'
import type { CartItem } from '~/types'
import SeatMap from '~/components/SeatMap.vue'

const ROWS = 3
const COLS = 10
const TOTAL_SEATS = ROWS * COLS

const mockItem: CartItem = {
  eventId: 'evt-1',
  eventSlug: 'evt-1',
  ticketId: 'ticket-a',
  ticketType: 'VIP',
  quantity: 2,
  unitPrice: 500,
}

function mountMap(cartItems: CartItem[], modelValue: Record<string, string[]> = {}) {
  return mount(SeatMap, {
    props: { cartItems, modelValue },
    global: {
      mocks: {
        $t: (k: string, args?: Record<string, unknown>) =>
          args ? `${k}:${JSON.stringify(args)}` : k,
      },
    },
  })
}

function getAvailableButtons(wrapper: ReturnType<typeof mountMap>) {
  return wrapper.findAll('button').filter(b => !b.element.hasAttribute('disabled'))
}

describe('SeatMap', () => {
  describe('layout', () => {
    it('renders ROWS × COLS buttons per zone', () => {
      const wrapper = mountMap([mockItem])
      expect(wrapper.findAll('button')).toHaveLength(TOTAL_SEATS)
    })

    it('renders one role="group" section per cart item', () => {
      const item2: CartItem = { ...mockItem, ticketId: 'ticket-b', ticketType: 'Standard' }
      const wrapper = mountMap([mockItem, item2])
      expect(wrapper.findAll('[role="group"]')).toHaveLength(2)
      expect(wrapper.findAll('button')).toHaveLength(TOTAL_SEATS * 2)
    })
  })

  describe('sold seats', () => {
    it('disables some seats (isSold is deterministic)', () => {
      const wrapper = mountMap([mockItem])
      const disabled = wrapper.findAll('button[disabled]')
      expect(disabled.length).toBeGreaterThan(0)
      expect(disabled.length).toBeLessThan(TOTAL_SEATS)
    })

    it('does not emit when a disabled seat is clicked', async () => {
      const wrapper = mountMap([mockItem])
      const soldBtn = wrapper.findAll('button').find(b => b.element.hasAttribute('disabled'))
      expect(soldBtn).toBeDefined()
      await soldBtn!.trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('seat selection', () => {
    it('emits update:modelValue with the selected seat when an available seat is clicked', async () => {
      const wrapper = mountMap([mockItem])
      const btn = getAvailableButtons(wrapper)[0]
      expect(btn).toBeDefined()
      await btn!.trigger('click')
      const emitted = wrapper.emitted('update:modelValue')
      expect(emitted).toBeDefined()
      const payload = emitted![0]![0] as Record<string, string[]>
      expect(payload['ticket-a']).toHaveLength(1)
    })

    it('deselects a seat when clicked again', async () => {
      const wrapper = mountMap([mockItem])
      const btn = getAvailableButtons(wrapper)[0]!
      await btn.trigger('click')
      const firstPayload = wrapper.emitted('update:modelValue')![0]![0] as Record<string, string[]>

      await wrapper.setProps({ modelValue: firstPayload })
      await btn.trigger('click')
      const secondPayload = wrapper.emitted('update:modelValue')![1]![0] as Record<string, string[]>
      expect(secondPayload['ticket-a']).toHaveLength(0)
    })

    it('does not exceed the item quantity when selecting seats', async () => {
      const wrapper = mountMap([mockItem]) // quantity = 2
      const available = getAvailableButtons(wrapper)

      await available[0]!.trigger('click')
      const after1 = wrapper.emitted('update:modelValue')![0]![0] as Record<string, string[]>
      await wrapper.setProps({ modelValue: after1 })

      await available[1]!.trigger('click')
      const after2 = wrapper.emitted('update:modelValue')![1]![0] as Record<string, string[]>
      await wrapper.setProps({ modelValue: after2 })
      expect(after2['ticket-a']).toHaveLength(2)

      // Clicking a third available seat should not increase count beyond quantity
      await available[2]!.trigger('click')
      const after3 = wrapper.emitted('update:modelValue')![2]![0] as Record<string, string[]>
      expect(after3['ticket-a']).toHaveLength(2)
    })
  })

  describe('seat labels', () => {
    it('labels seats with row letter + column number (A1, A2, …, C10)', () => {
      const wrapper = mountMap([mockItem])
      const buttons = wrapper.findAll('button')
      // First seat: row 0, col 0 → A1
      expect(buttons[0]?.text()).toBe('A1')
      // Last seat: row 2, col 9 → C10
      expect(buttons[TOTAL_SEATS - 1]?.text()).toBe('C10')
    })
  })

  describe('aria-live remaining count', () => {
    it('shows remaining count text when seats are not fully selected', () => {
      const wrapper = mountMap([mockItem])
      const live = wrapper.find('[aria-live="polite"]')
      expect(live.exists()).toBe(true)
      // With nothing selected, count = 2 (the quantity)
      expect(live.text()).toContain('checkout.seat.remaining')
    })

    it('shows allSelected text when all seats are filled', async () => {
      const wrapper = mountMap([mockItem])
      const available = getAvailableButtons(wrapper)

      await available[0]!.trigger('click')
      const after1 = wrapper.emitted('update:modelValue')![0]![0] as Record<string, string[]>
      await wrapper.setProps({ modelValue: after1 })

      await available[1]!.trigger('click')
      const after2 = wrapper.emitted('update:modelValue')![1]![0] as Record<string, string[]>
      await wrapper.setProps({ modelValue: after2 })

      expect(wrapper.find('[aria-live="polite"]').text()).toBe('checkout.seat.allSelected')
    })
  })
})
