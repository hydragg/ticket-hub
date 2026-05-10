<script setup lang="ts">
import { isAxiosError } from 'axios'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import { CheckCircleIcon, ClockIcon } from 'lucide-vue-next'
import { useReservationStore } from '~/stores/reservation'
import type { CartItem, Order } from '~/types'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const reservationStore = useReservationStore()
const { completeOrder } = useOrders()

// ── Session restore on mount ─────────────────────────
const isRestoring = ref(true)

onMounted(async () => {
  const id = reservationStore.reservationId
  if (!id) {
    await router.replace(localePath('/events'))
    return
  }
  try {
    const data = await reservationStore.fetchReservation(id)
    if (data.status === 'expired' || data.status === 'cancelled') {
      toast.error(t('checkout.payment.expiredTitle'))
      reservationStore.clearState()
      await router.replace(localePath('/events'))
      return
    }
    startCountdown()
    startPolling()
  }
  catch {
    reservationStore.clearState()
    await router.replace(localePath('/events'))
  }
  finally {
    isRestoring.value = false
  }
})

// 30-second background poll to sync expiry with backend
let pollTimer: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    const id = reservationStore.reservationId
    if (!id) { stopPolling(); return }
    try {
      const data = await reservationStore.fetchReservation(id)
      if (data.status === 'expired' || data.status === 'cancelled') stopPolling()
    }
    catch { stopPolling() }
  }, 30_000)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

onUnmounted(stopPolling)

// ── Computed state ───────────────────────────────────
const reservation = computed(() => reservationStore.reservation)
const currentStep = computed(() => reservationStore.currentStep)
const isDone = ref(false)
const completedOrder = ref<Order | null>(null)

const steps = computed(() => [
  { key: 'seat', label: t('checkout.steps.seat') },
  { key: 'payment', label: t('checkout.steps.payment') },
  { key: 'done', label: t('checkout.steps.done') },
])

const stepperCurrent = computed((): 1 | 2 | 3 =>
  isDone.value ? 3 : currentStep.value,
)

// ── Event data ───────────────────────────────────────
const eventSlug = computed(() => reservationStore.eventSlug)

const { data: event } = useAsyncData(
  'checkout-event',
  async () => {
    if (!eventSlug.value) return null
    const { fetchEvent } = useEvents()
    const res = await fetchEvent(eventSlug.value)
    return res.data ?? null
  },
  { server: false },
)

// ── Step 1: Seat selection ───────────────────────────
const selectedSeats = ref<Record<string, string[]>>({})

const seatMapItems = computed((): CartItem[] => {
  const rsv = reservation.value
  if (!rsv || !event.value) return []
  const ticket = event.value.tickets.find(tk => tk.id === rsv.ticketId)
  if (!ticket) return []
  return [{
    eventId: rsv.eventId,
    eventSlug: eventSlug.value ?? '',
    ticketId: rsv.ticketId,
    ticketType: ticket.type,
    quantity: rsv.quantity,
    unitPrice: ticket.price,
  }]
})

const allSeatsSelected = computed(() => {
  const rsv = reservation.value
  if (!rsv) return false
  return (selectedSeats.value[rsv.ticketId]?.length ?? 0) >= rsv.quantity
})

const isUpdatingSeats = ref(false)

async function confirmSeats() {
  const rsv = reservation.value
  if (!rsv) return
  const seats = selectedSeats.value[rsv.ticketId] ?? []
  isUpdatingSeats.value = true
  try {
    await reservationStore.updateSeats(seats)
    startCountdown()
    startPolling()
  }
  catch (e) {
    if (isAxiosError(e) && e.response?.status === 410) {
      toast.error(t('checkout.payment.expiredTitle'))
      reservationStore.clearState()
      await router.push(localePath('/events'))
    }
    else {
      toast.error(t('common.error'))
    }
  }
  finally {
    isUpdatingSeats.value = false
  }
}

// ── Countdown ────────────────────────────────────────
const expiresAt = computed(() => reservation.value?.expiresAt ?? null)

async function handleExpire() {
  await reservationStore.cancelReservation()
  toast.error(t('checkout.payment.expiredTitle'))
  await router.push(localePath('/events'))
}

const { formatted: countdownFormatted, start: startCountdown } = useExpiryCountdown(
  expiresAt,
  { onExpire: handleExpire },
)

// ── Cancel dialog ────────────────────────────────────
const showCancelDialog = ref(false)
const isCancelling = ref(false)
const cancelDialogRef = ref<HTMLElement | null>(null)

watch(showCancelDialog, (show) => {
  if (show) nextTick(() => cancelDialogRef.value?.querySelector<HTMLElement>('button')?.focus())
})

function trapCancelFocus(e: KeyboardEvent) {
  if (e.key !== 'Tab') return
  e.preventDefault()
  const btns = cancelDialogRef.value?.querySelectorAll<HTMLElement>('button')
  if (!btns?.length) return
  const first = btns[0]
  const last = btns[btns.length - 1]
  if (!first || !last) return
  if (e.shiftKey) { if (document.activeElement === first) last.focus() }
  else { if (document.activeElement === last) first.focus() }
}

async function handleCancel() {
  isCancelling.value = true
  try {
    await reservationStore.cancelReservation()
    await router.push(localePath('/events'))
  }
  finally {
    isCancelling.value = false
    showCancelDialog.value = false
  }
}

// ── Step 2: Payment form ─────────────────────────────
const paymentSchema = toTypedSchema(
  z.object({
    cardNumber: z
      .string()
      .refine(v => /^\d{16}$/.test(v.replace(/[\s-]/g, '')), 'Enter a valid 16-digit card number'),
    cardHolder: z.string().min(2, 'Cardholder name is required'),
    expiry: z.string().regex(/^\d{2}\/\d{2}$/, 'Format: MM/YY'),
    cvv: z.string().regex(/^\d{3,4}$/, 'Enter 3 or 4 digits'),
  }),
)

const { handleSubmit, defineField, errors } = useForm({ validationSchema: paymentSchema })
const [cardNumber] = defineField('cardNumber')
const [cardHolder] = defineField('cardHolder')
const [expiry] = defineField('expiry')
const [cvv] = defineField('cvv')

const isSubmitting = ref(false)

const orderTotal = computed(() => {
  const rsv = reservation.value
  if (!rsv || !event.value) return 0
  const ticket = event.value.tickets.find(tk => tk.id === rsv.ticketId)
  return (ticket?.price ?? 0) * rsv.quantity
})

const onPaymentSubmit = handleSubmit(async (values) => {
  const rsv = reservation.value
  if (!rsv) return
  isSubmitting.value = true
  try {
    const result = await completeOrder({
      reservationId: rsv.id,
      paymentInfo: {
        cardHolder: values.cardHolder,
        cardNumber: values.cardNumber,
        expiry: values.expiry,
        cvv: values.cvv,
      },
    })
    completedOrder.value = result.data
    reservationStore.completeReservation()
    isDone.value = true
    stopPolling()
  }
  catch (e) {
    if (isAxiosError(e) && e.response?.status === 410) {
      toast.error(t('checkout.payment.expiredTitle'))
      reservationStore.clearState()
      await router.push(localePath('/events'))
    }
    else {
      toast.error(t('common.error'))
    }
  }
  finally {
    isSubmitting.value = false
  }
})

// SEO
useSeoMeta({ title: () => `${t('checkout.steps.seat')} | TicketHub` })
</script>

<template>
  <div class="container mx-auto max-w-2xl px-4 py-8">

    <!-- Restoring session -->
    <div v-if="isRestoring" class="space-y-6" aria-busy="true" :aria-label="$t('common.loading')">
      <div class="flex gap-4">
        <UiSkeleton class="h-2 flex-1 rounded-full" />
        <UiSkeleton class="h-2 flex-1 rounded-full" />
        <UiSkeleton class="h-2 flex-1 rounded-full" />
      </div>
      <UiSkeleton class="h-8 w-48" />
      <UiSkeleton class="h-64 w-full" />
    </div>

    <template v-else-if="reservation || isDone">

      <!-- Stepper (hidden on done screen) -->
      <CheckoutStepper
        v-if="!isDone"
        :steps="steps"
        :current="stepperCurrent"
        class="mb-6"
      />

      <!-- Countdown strip (visible during seat + payment steps) -->
      <div
        v-if="!isDone && reservation"
        class="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <ClockIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
        <span class="text-sm font-medium tabular-nums">
          {{ $t('checkout.payment.timeLeft', { time: countdownFormatted }) }}
        </span>
      </div>

      <!-- ── Step 1: Seat Selection ── -->
      <section v-if="!isDone && currentStep === 1" aria-labelledby="step1-heading">
        <h1 id="step1-heading" class="mb-2 text-2xl font-bold">
          {{ $t('checkout.seat.title') }}
        </h1>
        <p class="mb-4 text-sm text-muted-foreground">
          {{ $t('checkout.seat.instruction') }}
        </p>

        <!-- Reservation summary -->
        <div v-if="reservation" class="mb-6 rounded-lg border bg-card p-4">
          <p class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {{ $t('checkout.reservation.title') }}
          </p>
          <div class="flex items-center justify-between">
            <div>
              <p class="font-semibold">
                {{ seatMapItems[0]?.ticketType ?? '—' }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ $t('checkout.reservation.qty', { count: reservation.quantity }) }}
              </p>
            </div>
            <p class="text-lg font-bold text-primary">
              NT$&nbsp;{{ orderTotal.toLocaleString() }}
            </p>
          </div>
        </div>

        <SeatMap v-model="selectedSeats" :cart-items="seatMapItems" />

        <div class="mt-8 flex items-center justify-between">
          <UiButton
            variant="outline"
            :disabled="isCancelling"
            @click="showCancelDialog = true"
          >
            {{ $t('checkout.cancel.button') }}
          </UiButton>
          <UiButton
            size="lg"
            :disabled="!allSeatsSelected || isUpdatingSeats"
            @click="confirmSeats"
          >
            {{ isUpdatingSeats ? $t('common.loading') : $t('checkout.seat.continue') }}
          </UiButton>
        </div>
      </section>

      <!-- ── Step 2: Payment ── -->
      <section v-else-if="!isDone && currentStep === 2" aria-labelledby="step2-heading">
        <h1 id="step2-heading" class="mb-6 text-2xl font-bold">
          {{ $t('checkout.payment.title') }}
        </h1>

        <!-- Event summary -->
        <div v-if="event" class="mb-6 flex gap-4 rounded-lg border bg-card p-4">
          <img
            :src="event.coverImage"
            :alt="event.title"
            class="h-20 w-28 shrink-0 rounded-md object-cover"
            loading="lazy"
          >
          <div class="min-w-0">
            <h2 class="font-semibold leading-tight">{{ event.title }}</h2>
            <p class="mt-1 text-sm text-muted-foreground">{{ event.venue }}・{{ event.city }}</p>
            <p v-if="reservation" class="mt-1 text-sm font-medium">
              {{ seatMapItems[0]?.ticketType }} × {{ reservation.quantity }}
              <span class="ml-2 font-bold text-primary">NT$&nbsp;{{ orderTotal.toLocaleString() }}</span>
            </p>
          </div>
        </div>

        <!-- Payment form -->
        <form class="space-y-5" novalidate @submit.prevent="onPaymentSubmit">
          <div class="space-y-1.5">
            <UiLabel for="card-number">{{ $t('checkout.payment.cardNumber') }}</UiLabel>
            <UiInput
              id="card-number"
              v-model="cardNumber"
              placeholder="1234 5678 9012 3456"
              autocomplete="cc-number"
              inputmode="numeric"
            />
            <p v-if="errors.cardNumber" class="text-sm text-destructive" role="alert">
              {{ errors.cardNumber }}
            </p>
          </div>

          <div class="space-y-1.5">
            <UiLabel for="card-holder">{{ $t('checkout.payment.cardHolder') }}</UiLabel>
            <UiInput
              id="card-holder"
              v-model="cardHolder"
              placeholder="CARD HOLDER NAME"
              autocomplete="cc-name"
            />
            <p v-if="errors.cardHolder" class="text-sm text-destructive" role="alert">
              {{ errors.cardHolder }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <UiLabel for="expiry">{{ $t('checkout.payment.expiry') }}</UiLabel>
              <UiInput
                id="expiry"
                v-model="expiry"
                placeholder="MM/YY"
                autocomplete="cc-exp"
                inputmode="numeric"
                maxlength="5"
              />
              <p v-if="errors.expiry" class="text-sm text-destructive" role="alert">
                {{ errors.expiry }}
              </p>
            </div>
            <div class="space-y-1.5">
              <UiLabel for="cvv">{{ $t('checkout.payment.cvv') }}</UiLabel>
              <UiInput
                id="cvv"
                v-model="cvv"
                placeholder="123"
                autocomplete="cc-csc"
                inputmode="numeric"
                maxlength="4"
              />
              <p v-if="errors.cvv" class="text-sm text-destructive" role="alert">
                {{ errors.cvv }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-between pt-3">
            <UiButton
              type="button"
              variant="outline"
              :disabled="isCancelling"
              @click="showCancelDialog = true"
            >
              {{ $t('checkout.cancel.button') }}
            </UiButton>
            <UiButton type="submit" size="lg" :disabled="isSubmitting">
              {{
                isSubmitting
                  ? $t('checkout.payment.processing')
                  : $t('checkout.payment.submit', { amount: orderTotal.toLocaleString() })
              }}
            </UiButton>
          </div>
        </form>
      </section>

      <!-- ── Step 3: Done ── -->
      <section
        v-else-if="isDone"
        class="py-16 text-center"
        aria-labelledby="done-heading"
      >
        <CheckCircleIcon class="mx-auto mb-6 h-20 w-20 text-emerald-500" aria-hidden="true" />
        <h1 id="done-heading" class="mb-3 text-3xl font-bold">
          {{ $t('checkout.done.title') }}
        </h1>
        <p class="mb-4 text-muted-foreground">
          {{ $t('checkout.done.description') }}
        </p>
        <p v-if="completedOrder" class="mb-8 font-mono text-sm font-medium text-muted-foreground">
          {{ $t('checkout.done.orderNumber') }}: {{ completedOrder.id }}
        </p>
        <div class="flex flex-wrap justify-center gap-3">
          <UiButton as-child>
            <NuxtLink
              :to="completedOrder ? localePath(`/dashboard/orders/${completedOrder.id}`) : localePath('/dashboard/orders')"
            >
              {{ $t('checkout.done.viewOrders') }}
            </NuxtLink>
          </UiButton>
          <UiButton variant="outline" as-child>
            <NuxtLink :to="localePath('/')">
              {{ $t('checkout.done.backHome') }}
            </NuxtLink>
          </UiButton>
        </div>
      </section>

    </template>

    <!-- ── Cancel confirmation dialog ── -->
    <div
      v-if="showCancelDialog"
      ref="cancelDialogRef"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      role="alertdialog"
      aria-labelledby="cancel-title"
      aria-describedby="cancel-desc"
      aria-modal="true"
      @keydown="trapCancelFocus"
    >
      <div class="mx-4 max-w-sm rounded-xl border bg-card p-8 text-center shadow-lg">
        <h2 id="cancel-title" class="mb-2 text-xl font-bold">
          {{ $t('checkout.cancel.title') }}
        </h2>
        <p id="cancel-desc" class="mb-6 text-sm text-muted-foreground">
          {{ $t('checkout.cancel.desc') }}
        </p>
        <div class="flex justify-center gap-3">
          <UiButton variant="outline" :disabled="isCancelling" @click="showCancelDialog = false">
            {{ $t('checkout.cancel.back') }}
          </UiButton>
          <UiButton variant="destructive" :disabled="isCancelling" @click="handleCancel">
            {{ isCancelling ? $t('common.loading') : $t('checkout.cancel.confirm') }}
          </UiButton>
        </div>
      </div>
    </div>

  </div>
</template>
