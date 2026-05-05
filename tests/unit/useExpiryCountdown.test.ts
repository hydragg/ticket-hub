import { ref, defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { useExpiryCountdown } from '~/composables/useExpiryCountdown'

function isoAfter(ms: number) {
  return new Date(Date.now() + ms).toISOString()
}

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

    it('remaining equals seconds until expiry for a future ISO string', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(isoAfter(5_000))))
      expect(result.remaining.value).toBe(5)
    })

    it('remaining is 0 for a past ISO string', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(isoAfter(-1_000))))
      expect(result.remaining.value).toBe(0)
    })

    it('isExpired is true for a past ISO string', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(isoAfter(-1_000))))
      expect(result.isExpired.value).toBe(true)
    })
  })

  describe('formatted output', () => {
    it('formats 90 seconds as 01:30', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(isoAfter(90_000))))
      expect(result.formatted.value).toBe('01:30')
    })

    it('formats 20 minutes as 20:00', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(isoAfter(20 * 60_000))))
      expect(result.formatted.value).toBe('20:00')
    })

    it('pads single-digit seconds with a leading zero', () => {
      const { result } = withSetup(() => useExpiryCountdown(ref(isoAfter(65_000))))
      expect(result.formatted.value).toBe('01:05')
    })
  })

  describe('timer', () => {
    it('remaining decreases as the interval ticks', () => {
      const expiresAt = ref(isoAfter(10_000))
      const { result } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      vi.advanceTimersByTime(3_000)
      expect(result.remaining.value).toBe(7)
    })

    it('stop() prevents further updates', () => {
      const expiresAt = ref(isoAfter(10_000))
      const { result } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      vi.advanceTimersByTime(2_000)
      const snapshot = result.remaining.value
      result.stop()
      vi.advanceTimersByTime(3_000)
      expect(result.remaining.value).toBe(snapshot)
    })

    it('calling start() twice does not create duplicate intervals', () => {
      const expiresAt = ref(isoAfter(10_000))
      const { result } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      result.start()
      vi.advanceTimersByTime(1_000)
      expect(result.remaining.value).toBe(9)
    })

    it('unmount automatically stops the timer', () => {
      const expiresAt = ref(isoAfter(10_000))
      const { result, wrapper } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      vi.advanceTimersByTime(1_000)
      wrapper.unmount()
      const snapshot = result.remaining.value
      vi.advanceTimersByTime(3_000)
      expect(result.remaining.value).toBe(snapshot)
    })

    it('becomes expired after the countdown reaches zero', () => {
      const expiresAt = ref(isoAfter(2_000))
      const { result } = withSetup(() => useExpiryCountdown(expiresAt))
      result.start()
      vi.advanceTimersByTime(3_000)
      expect(result.remaining.value).toBe(0)
      expect(result.isExpired.value).toBe(true)
    })
  })

  describe('onExpire callback', () => {
    it('fires onExpire when the countdown reaches zero', () => {
      const onExpire = vi.fn()
      const expiresAt = ref(isoAfter(2_000))
      const { result } = withSetup(() => useExpiryCountdown(expiresAt, { onExpire }))
      result.start()
      vi.advanceTimersByTime(3_000)
      expect(onExpire).toHaveBeenCalledOnce()
    })

    it('fires onExpire only once even if the timer keeps ticking', () => {
      const onExpire = vi.fn()
      const expiresAt = ref(isoAfter(1_000))
      const { result } = withSetup(() => useExpiryCountdown(expiresAt, { onExpire }))
      result.start()
      vi.advanceTimersByTime(5_000)
      expect(onExpire).toHaveBeenCalledOnce()
    })

    it('does not fire onExpire when expiresAt is null', () => {
      const onExpire = vi.fn()
      const { result } = withSetup(() => useExpiryCountdown(ref(null), { onExpire }))
      result.start()
      vi.advanceTimersByTime(5_000)
      expect(onExpire).not.toHaveBeenCalled()
    })

    it('does not fire onExpire for an already-expired string (no transition)', () => {
      const onExpire = vi.fn()
      // Already past — isExpired starts as true, no watch transition fires
      const { result } = withSetup(() =>
        useExpiryCountdown(ref(isoAfter(-5_000)), { onExpire }),
      )
      result.start()
      vi.advanceTimersByTime(2_000)
      expect(result.isExpired.value).toBe(true)
      expect(onExpire).not.toHaveBeenCalled()
    })
  })
})
