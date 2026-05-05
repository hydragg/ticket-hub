import { isAxiosError } from 'axios'
import { ref, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { useReservationStore } from '~/stores/reservation'
import type { CreateReservationPayload } from '~/types'

const POLL_INTERVAL_MS = 30_000

export function useReservation() {
  const store = useReservationStore()
  const router = useRouter()
  const localePath = useLocalePath()
  const { t } = useI18n()

  const isSoldOut = ref(false)
  const isExpired = ref(false)

  // ── Navigation helpers ──────────────────────────────

  async function startReservation(payload: CreateReservationPayload) {
    isSoldOut.value = false
    try {
      await store.createReservation(payload)
      await router.push(localePath('/checkout'))
    }
    catch (e) {
      if (isAxiosError(e) && e.response?.status === 409) {
        isSoldOut.value = true
        return
      }
      throw e
    }
  }

  async function resumeReservation(reservationId: string) {
    isExpired.value = false
    try {
      const data = await store.fetchReservation(reservationId)
      if (data.status === 'expired' || data.status === 'cancelled') {
        isExpired.value = true
        store.clearState()
        return
      }
      await router.push(localePath('/checkout'))
    }
    catch {
      // Reservation not found or network error — clear stale local state
      store.clearState()
    }
  }

  // ── Background polling (sync with backend every 30 s) ──

  let pollTimer: ReturnType<typeof setInterval> | null = null

  function startPolling() {
    if (pollTimer !== null || !store.reservationId) return
    pollTimer = setInterval(async () => {
      const id = store.reservationId
      if (!id) {
        stopPolling()
        return
      }
      try {
        const data = await store.fetchReservation(id)
        if (data.status === 'expired' || data.status === 'cancelled') {
          stopPolling()
          isExpired.value = true
          store.clearState()
          toast.error(t('checkout.payment.expiredTitle'))
          await router.push(localePath('/events'))
        }
      }
      catch {
        stopPolling()
      }
    }, POLL_INTERVAL_MS)
  }

  function stopPolling() {
    if (pollTimer !== null) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  onUnmounted(stopPolling)

  return {
    store,
    isSoldOut,
    isExpired,
    startReservation,
    resumeReservation,
    startPolling,
    stopPolling,
  }
}
