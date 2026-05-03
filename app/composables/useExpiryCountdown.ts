import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'

export function useExpiryCountdown(expiresAt: Ref<number | null>) {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | null = null

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

  const remaining = computed((): number => {
    if (expiresAt.value === null) return 0
    return Math.max(0, expiresAt.value - now.value)
  })

  const isExpired = computed((): boolean => expiresAt.value !== null && remaining.value === 0)

  const formatted = computed((): string => {
    const ms = remaining.value
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  })

  onUnmounted(stop)

  return { remaining, isExpired, formatted, start, stop }
}
