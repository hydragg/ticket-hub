import { ref, defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useExpiryCountdown } from '~/composables/useExpiryCountdown'

function withSetup<T>(composable: () => T) {
  let result!: T
  const Wrapper = defineComponent({
    setup() {
      result = composable()
      return {}
    },
    template: '<div />',
  })
  const wrapper = mount(Wrapper)
  return { result, wrapper }
}

describe('useExpiryCountdown', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  describe('initial state', () => {
    it('remaining is 0 when expiresAt is null', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(null)))
      expect(result.remaining.value).toBe(0)
    })

    it('isExpired is false when expiresAt is null', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(null)))
      expect(result.isExpired.value).toBe(false)
    })

    it('formatted shows 00:00 when expiresAt is null', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(null)))
      expect(result.formatted.value).toBe('00:00')
    })

    it('remaining equals the ms difference for a future timestamp', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(Date.now() + 5_000)))
      expect(result.remaining.value).toBe(5_000)
    })

    it('remaining is 0 for a past timestamp', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(Date.now() - 1_000)))
      expect(result.remaining.value).toBe(0)
    })

    it('isExpired is true for a past timestamp', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(Date.now() - 1_000)))
      expect(result.isExpired.value).toBe(true)
    })
  })

  describe('formatted output', () => {
    it('formats 90 seconds as 01:30', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(Date.now() + 90_000)))
      expect(result.formatted.value).toBe('01:30')
    })

    it('formats 20 minutes as 20:00', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(Date.now() + 20 * 60_000)))
      expect(result.formatted.value).toBe('20:00')
    })

    it('pads single-digit seconds with a leading zero', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(Date.now() + 65_000)))
      expect(result.formatted.value).toBe('01:05')
    })
  })

  describe('timer', () => {
    it('remaining decreases as the interval ticks', () => {
      const expiresAt = ref(Date.now() + 10_000)
      const { result } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      vi.advanceTimersByTime(3_000)
      expect(result.remaining.value).toBe(7_000)
    })

    it('stop() prevents further updates', () => {
      const expiresAt = ref(Date.now() + 10_000)
      const { result } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      vi.advanceTimersByTime(2_000)
      const snapshot = result.remaining.value
      result.stop()
      vi.advanceTimersByTime(3_000)
      expect(result.remaining.value).toBe(snapshot)
    })

    it('calling start() twice does not create duplicate intervals', () => {
      const expiresAt = ref(Date.now() + 10_000)
      const { result } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      result.start()
      vi.advanceTimersByTime(1_000)
      // If two intervals ran, remaining would drop by 2000 (each tick updates now to current time)
      // With one interval, remaining should be exactly 9000
      expect(result.remaining.value).toBe(9_000)
    })

    it('unmount automatically stops the timer', () => {
      const expiresAt = ref(Date.now() + 10_000)
      const { result, wrapper } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      vi.advanceTimersByTime(1_000)
      wrapper.unmount()
      const snapshot = result.remaining.value
      vi.advanceTimersByTime(3_000)
      expect(result.remaining.value).toBe(snapshot)
    })

    it('becomes expired after the countdown reaches zero', () => {
      const expiresAt = ref(Date.now() + 2_000)
      const { result } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      vi.advanceTimersByTime(3_000)
      expect(result.remaining.value).toBe(0)
      expect(result.isExpired.value).toBe(true)
    })
  })
})
