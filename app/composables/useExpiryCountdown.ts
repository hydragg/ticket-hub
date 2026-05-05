import { ref, computed, watch, onUnmounted } from 'vue'
import type { Ref } from 'vue'

interface UseExpiryCountdownOptions {
  onExpire?: () => void
}

export function useExpiryCountdown(
  expiresAt: Ref<string | null>,
  options?: UseExpiryCountdownOptions,
) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null
  let expireFired = false

  function start() {
    if (timer !== null) return
    timer = setInterval(() => {
      now.value = Date.now()
    }, 1000)
  }

  function stop() {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
  }

  // Remaining time in whole seconds
  const remaining = computed((): number => {
    if (expiresAt.value === null) return 0
    const ms = new Date(expiresAt.value).getTime() - now.value
    return Math.max(0, Math.floor(ms / 1000))
  })

  const isExpired = computed((): boolean =>
    expiresAt.value !== null && remaining.value === 0,
  )

  const formatted = computed((): string => {
    const s = remaining.value
    const minutes = Math.floor(s / 60)
    const seconds = s % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  // Fire onExpire once when the countdown first transitions to zero.
  // flush: 'sync' ensures the callback fires within the same tick as the computed update,
  // which is required for fake-timer test environments.
  watch(isExpired, (expired) => {
    if (expired && !expireFired && options?.onExpire) {
      expireFired = true
      options.onExpire()
    }
  }, { flush: 'sync' })

  onUnmounted(stop)

  return { remaining, isExpired, formatted, start, stop }
}
