import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'

// ── External mocks (hoisted before composable import) ──────────────────────

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios')
  return { ...actual, isAxiosError: (e: unknown) => !!(e as Record<string, unknown>)?._isAxiosError }
})

vi.mock('vue-sonner', () => ({ toast: { error: vi.fn() } }))

// ── Store mock ──────────────────────────────────────────────────────────────

const mockClearState = vi.fn()
const mockCreateReservation = vi.fn()
const mockFetchReservation = vi.fn()
const mockReservationId = ref<string | null>(null)

vi.mock('~/stores/reservation', () => ({
  useReservationStore: () => ({
    reservationId: mockReservationId,
    createReservation: mockCreateReservation,
    fetchReservation: mockFetchReservation,
    clearState: mockClearState,
  }),
}))

// ── Nuxt composable mocks ───────────────────────────────────────────────────

const mockPush = vi.fn()
mockNuxtImport('useRouter', () => () => ({ push: mockPush }))
mockNuxtImport('useLocalePath', () => () => (path: string) => path)
mockNuxtImport('useI18n', () => () => ({ t: (k: string) => k }))

// ── Composable import (after all mocks are registered) ─────────────────────

const { useReservation } = await import('~/composables/useReservation')

// ── Helper ──────────────────────────────────────────────────────────────────

function withSetup<T>(composable: () => T): T {
  let result!: T
  const Wrapper = defineComponent({
    setup() {
      result = composable()
      return {}
    },
    template: '<div />',
  })
  mount(Wrapper)
  return result
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const PAYLOAD = { eventId: 'evt-1', ticketId: 'tk-1', quantity: 2 }

function make409Error() {
  return Object.assign(new Error('sold out'), {
    _isAxiosError: true,
    response: { status: 409 },
  })
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('useReservation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReservationId.value = null
  })

  describe('startReservation()', () => {
    it('calls store.createReservation with the payload', async () => {
      mockCreateReservation.mockResolvedValue({})
      const { startReservation } = withSetup(useReservation)
      await startReservation(PAYLOAD)
      expect(mockCreateReservation).toHaveBeenCalledWith(PAYLOAD)
    })

    it('navigates to /checkout on success', async () => {
      mockCreateReservation.mockResolvedValue({})
      const { startReservation } = withSetup(useReservation)
      await startReservation(PAYLOAD)
      expect(mockPush).toHaveBeenCalledWith('/checkout')
    })

    it('sets isSoldOut and does not navigate on 409', async () => {
      mockCreateReservation.mockRejectedValueOnce(make409Error())
      const { startReservation, isSoldOut } = withSetup(useReservation)
      await startReservation(PAYLOAD)
      expect(isSoldOut.value).toBe(true)
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('resets isSoldOut to false at the start of a new call', async () => {
      mockCreateReservation.mockRejectedValueOnce(make409Error())
      const { startReservation, isSoldOut } = withSetup(useReservation)
      await startReservation(PAYLOAD)
      expect(isSoldOut.value).toBe(true)
      mockCreateReservation.mockResolvedValueOnce({})
      await startReservation(PAYLOAD)
      expect(isSoldOut.value).toBe(false)
    })
  })

  describe('resumeReservation()', () => {
    it('navigates to /checkout for pending_seats status', async () => {
      mockFetchReservation.mockResolvedValue({ status: 'pending_seats' })
      const { resumeReservation } = withSetup(useReservation)
      await resumeReservation('rsv-1')
      expect(mockPush).toHaveBeenCalledWith('/checkout')
    })

    it('navigates to /checkout for pending_payment status', async () => {
      mockFetchReservation.mockResolvedValue({ status: 'pending_payment' })
      const { resumeReservation } = withSetup(useReservation)
      await resumeReservation('rsv-1')
      expect(mockPush).toHaveBeenCalledWith('/checkout')
    })

    it('sets isExpired and clears state for expired status', async () => {
      mockFetchReservation.mockResolvedValue({ status: 'expired' })
      const { resumeReservation, isExpired } = withSetup(useReservation)
      await resumeReservation('rsv-1')
      expect(isExpired.value).toBe(true)
      expect(mockClearState).toHaveBeenCalledOnce()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('sets isExpired and clears state for cancelled status', async () => {
      mockFetchReservation.mockResolvedValue({ status: 'cancelled' })
      const { resumeReservation, isExpired } = withSetup(useReservation)
      await resumeReservation('rsv-1')
      expect(isExpired.value).toBe(true)
      expect(mockClearState).toHaveBeenCalledOnce()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('clears state on network error without navigating', async () => {
      mockFetchReservation.mockRejectedValueOnce(new Error('network'))
      const { resumeReservation } = withSetup(useReservation)
      await resumeReservation('rsv-1')
      expect(mockClearState).toHaveBeenCalledOnce()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })
})
