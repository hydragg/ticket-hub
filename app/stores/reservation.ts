import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type {
  CreateReservationPayload,
  Reservation,
  UpdateReservationSeatsPayload,
  ApiResponse,
} from '~/types'

interface ReservationApiData {
  reservation: Reservation
  eventSlug: string
}

interface ReservationWithTimer extends Reservation {
  remainingSeconds: number
}

export const useReservationStore = defineStore('reservation', () => {
  const api = useApi()

  // Persisted so the user can resume after closing/reopening the tab
  const reservationId = useLocalStorage<string | null>('ticketing:reservationId', null)
  const eventSlug = useLocalStorage<string | null>('ticketing:eventSlug', null)

  const currentStep = ref<1 | 2 | 3>(1)
  const reservation = ref<Reservation | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function createReservation(payload: CreateReservationPayload) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.post<ApiResponse<ReservationApiData>>(
        '/reservations',
        payload,
      )
      reservation.value = data.data.reservation
      reservationId.value = data.data.reservation.id
      eventSlug.value = data.data.eventSlug
      currentStep.value = 1
      return data.data
    }
    catch (e) {
      error.value = 'reservation_failed'
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  async function fetchReservation(id: string) {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await api.get<ApiResponse<ReservationWithTimer>>(
        `/reservations/${id}`,
      )
      reservation.value = data.data
      reservationId.value = id
      if (data.data.status === 'pending_seats') currentStep.value = 1
      else if (data.data.status === 'pending_payment') currentStep.value = 2
      return data.data
    }
    catch (e) {
      error.value = 'fetch_failed'
      throw e
    }
    finally {
      isLoading.value = false
    }
  }

  async function updateSeats(seats: string[]) {
    if (!reservationId.value) throw new Error('No active reservation')
    isLoading.value = true
    try {
      const payload: UpdateReservationSeatsPayload = { selectedSeats: seats }
      const { data } = await api.patch<ApiResponse<Reservation>>(
        `/reservations/${reservationId.value}/seats`,
        payload,
      )
      reservation.value = data.data
      currentStep.value = 2
      return data.data
    }
    finally {
      isLoading.value = false
    }
  }

  async function cancelReservation() {
    const id = reservationId.value
    // Clear state first so UI responds immediately
    clearState()
    if (id) {
      try {
        await api.delete(`/reservations/${id}`)
      }
      catch {
        // Ignore — local state already cleared
      }
    }
  }

  function completeReservation() {
    clearState()
  }

  function clearState() {
    reservation.value = null
    reservationId.value = null
    eventSlug.value = null
    currentStep.value = 1
    error.value = null
  }

  return {
    reservationId,
    eventSlug,
    currentStep,
    reservation,
    isLoading,
    error,
    createReservation,
    fetchReservation,
    updateSeats,
    cancelReservation,
    completeReservation,
    clearState,
  }
})
