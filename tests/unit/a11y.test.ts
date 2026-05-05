import { mount } from '@vue/test-utils'
import { axe } from 'vitest-axe'
import * as axeMatchers from 'vitest-axe/matchers'
import type { CartItem } from '~/types'
import CheckoutStepper from '~/components/CheckoutStepper.vue'
import SeatMap from '~/components/SeatMap.vue'

expect.extend(axeMatchers)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const steps = [
  { key: 'seats', label: '選座' },
  { key: 'review', label: '確認' },
  { key: 'payment', label: '付款' },
  { key: 'done', label: '完成' },
]

const mockCartItem: CartItem = {
  eventId: 'evt-1',
  eventSlug: 'evt-1',
  ticketId: 'ticket-a',
  ticketType: 'VIP',
  quantity: 2,
  unitPrice: 500,
}

const globalMocks = {
  global: {
    mocks: {
      $t: (k: string, args?: Record<string, unknown>) =>
        args ? `${k}:${JSON.stringify(args)}` : k,
    },
  },
}

// ---------------------------------------------------------------------------
// CheckoutStepper a11y
// ---------------------------------------------------------------------------

describe('CheckoutStepper a11y', () => {
  it('has no violations on step 1', async () => {
    const wrapper = mount(CheckoutStepper, {
      props: { steps, current: 1 },
      ...globalMocks,
    })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('has no violations mid-flow (step 3)', async () => {
    const wrapper = mount(CheckoutStepper, {
      props: { steps, current: 3 },
      ...globalMocks,
    })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })

  it('has no violations on final step', async () => {
    const wrapper = mount(CheckoutStepper, {
      props: { steps, current: 4 },
      ...globalMocks,
    })
    expect(await axe(wrapper.element)).toHaveNoViolations()
  })
})

// The "region" rule requires all content be inside a landmark.
// In real usage SeatMap lives inside <main>, but when mounted in isolation it fails this rule.
// Disable it for component-level scans; full-page audits catch true violations.
const seatMapAxeOptions = { rules: { region: { enabled: false } } }

// ---------------------------------------------------------------------------
// SeatMap a11y
// ---------------------------------------------------------------------------

describe('SeatMap a11y', () => {
  it('has no violations with empty selection', async () => {
    const wrapper = mount(SeatMap, {
      props: { cartItems: [mockCartItem], modelValue: {} },
      ...globalMocks,
    })
    expect(await axe(wrapper.element, seatMapAxeOptions)).toHaveNoViolations()
  })

  it('has no violations with some seats selected', async () => {
    const wrapper = mount(SeatMap, {
      props: {
        cartItems: [mockCartItem],
        modelValue: { 'ticket-a': ['ticket-a:A1'] },
      },
      ...globalMocks,
    })
    expect(await axe(wrapper.element, seatMapAxeOptions)).toHaveNoViolations()
  })

  it('has no violations with multiple zones', async () => {
    const item2: CartItem = { ...mockCartItem, ticketId: 'ticket-b', ticketType: 'Standard' }
    const wrapper = mount(SeatMap, {
      props: { cartItems: [mockCartItem, item2], modelValue: {} },
      ...globalMocks,
    })
    expect(await axe(wrapper.element, seatMapAxeOptions)).toHaveNoViolations()
  })
})
