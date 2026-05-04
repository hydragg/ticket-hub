import { mount } from '@vue/test-utils'
import CheckoutStepper from '~/components/CheckoutStepper.vue'

const steps = [
  { key: 'seats', label: '選座' },
  { key: 'review', label: '確認' },
  { key: 'payment', label: '付款' },
  { key: 'done', label: '完成' },
]

function mountStepper(current: number) {
  return mount(CheckoutStepper, {
    props: { steps, current },
    global: { mocks: { $t: (k: string) => k } },
  })
}

describe('CheckoutStepper', () => {
  describe('rendering', () => {
    it('renders the correct number of step items', () => {
      const wrapper = mountStepper(1)
      expect(wrapper.findAll('li')).toHaveLength(4)
    })

    it('renders all step labels', () => {
      const wrapper = mountStepper(1)
      const text = wrapper.text()
      expect(text).toContain('選座')
      expect(text).toContain('確認')
      expect(text).toContain('付款')
      expect(text).toContain('完成')
    })
  })

  describe('aria-current', () => {
    it('sets aria-current="step" on the current step only', () => {
      const wrapper = mountStepper(2)
      const items = wrapper.findAll('li')
      expect(items[0]?.attributes('aria-current')).toBeUndefined()
      expect(items[1]?.attributes('aria-current')).toBe('step')
      expect(items[2]?.attributes('aria-current')).toBeUndefined()
      expect(items[3]?.attributes('aria-current')).toBeUndefined()
    })

    it('moves aria-current when current prop changes', async () => {
      const wrapper = mountStepper(1)
      expect(wrapper.findAll('li')[0]?.attributes('aria-current')).toBe('step')
      await wrapper.setProps({ current: 3 })
      expect(wrapper.findAll('li')[0]?.attributes('aria-current')).toBeUndefined()
      expect(wrapper.findAll('li')[2]?.attributes('aria-current')).toBe('step')
    })
  })

  describe('checkmark icons', () => {
    it('shows no checkmarks when on step 1', () => {
      expect(mountStepper(1).findAll('svg')).toHaveLength(0)
    })

    it('shows one checkmark when on step 2', () => {
      expect(mountStepper(2).findAll('svg')).toHaveLength(1)
    })

    it('shows checkmarks for all completed steps', () => {
      // current=4 means steps 1,2,3 are complete
      expect(mountStepper(4).findAll('svg')).toHaveLength(3)
    })
  })

  describe('step numbers', () => {
    it('shows the step number for the current and future steps', () => {
      const wrapper = mountStepper(2)
      // Step 2 (current) + Steps 3,4 (future) → 3 number spans inside aria-hidden circles
      const circleSpans = wrapper.findAll('[aria-hidden="true"] span')
      expect(circleSpans).toHaveLength(3)
      expect(circleSpans[0]?.text()).toBe('2')
      expect(circleSpans[1]?.text()).toBe('3')
      expect(circleSpans[2]?.text()).toBe('4')
    })
  })
})
