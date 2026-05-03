<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import { CheckCircleIcon, ClockIcon, Minus, Plus, Trash2 } from 'lucide-vue-next'
import type { Order } from '~/types'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()
const cartStore = useCartStore()
const { fetchEvent } = useEvents()
const { createOrder } = useOrders()

// ── Steps ────────────────────────────────────────────
const currentStep = ref<1 | 2 | 3 | 4>(1)

const steps = computed(() => [
  { key: 'seat', label: t('checkout.steps.seat') },
  { key: 'confirm', label: t('checkout.steps.confirm') },
  { key: 'payment', label: t('checkout.steps.payment') },
  { key: 'done', label: t('checkout.steps.done') },
])

// Redirect when cart is empty (after mount to allow SSR)
onMounted(() => {
  if (cartStore.isEmpty) {
    void router.push(localePath('/events'))
  }
})

// ── Event data ───────────────────────────────────────
const eventSlug = computed(() => cartStore.items[0]?.eventSlug ?? null)

const { data: event } = useAsyncData(
  'checkout-event',
  async () => {
    if (!eventSlug.value) return null
    const res = await fetchEvent(eventSlug.value)
    return res.data ?? null
  },
  { server: false },
)

// ── Step 1: Seat selection ───────────────────────────
const selectedSeats = ref<Record<string, string[]>>({})

const allSeatsSelected = computed(() =>
  cartStore.items.length > 0
  && cartStore.items.every(
    item => (selectedSeats.value[item.ticketId]?.length ?? 0) >= item.quantity,
  ),
)

function formatSelectedSeats(ticketId: string): string {
  const seats = selectedSeats.value[ticketId] ?? []
  return seats.map(id => id.split(':')[1] ?? id).join(', ')
}

// ── Step 2: Order actions ────────────────────────────
function decreaseItemQty(ticketId: string) {
  const item = cartStore.items.find(i => i.ticketId === ticketId)
  if (!item) return
  if (item.quantity <= 1) {
    removeItem(ticketId)
    return
  }
  cartStore.updateQuantity(item.eventId, ticketId, item.quantity - 1)
  const seats = selectedSeats.value[ticketId]
  if (seats && seats.length >= item.quantity) {
    selectedSeats.value = { ...selectedSeats.value, [ticketId]: seats.slice(0, item.quantity - 1) }
  }
}

function increaseItemQty(ticketId: string) {
  const item = cartStore.items.find(i => i.ticketId === ticketId)
  if (!item) return
  cartStore.updateQuantity(item.eventId, ticketId, item.quantity + 1)
}

function removeItem(ticketId: string) {
  const item = cartStore.items.find(i => i.ticketId === ticketId)
  if (item) cartStore.removeItem(item.eventId, ticketId)
  selectedSeats.value = Object.fromEntries(
    Object.entries(selectedSeats.value).filter(([k]) => k !== ticketId),
  )
}

const orderTotal = computed(() =>
  cartStore.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
)

// ── Step 3: Countdown + payment ──────────────────────
const {
  isExpired: countdownIsExpired,
  formatted: countdownFormatted,
  start: startCountdown,
  stop: stopCountdown,
} = useExpiryCountdown(computed(() => cartStore.expiresAt))

const showExpiredModal = ref(false)

watch(countdownIsExpired, (expired) => {
  if (expired && currentStep.value === 3) {
    showExpiredModal.value = true
  }
})

function handleExpired() {
  cartStore.clearCart()
  void router.push(localePath('/events'))
}

// Payment form
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
const completedOrder = ref<Order | null>(null)

const onPaymentSubmit = handleSubmit(async () => {
  const firstItem = cartStore.items[0]
  if (!firstItem) return
  isSubmitting.value = true
  try {
    const res = await createOrder({
      eventId: firstItem.eventId,
      items: cartStore.items.map(i => ({ ticketId: i.ticketId, quantity: i.quantity })),
    })
    completedOrder.value = res.data
    cartStore.clearCart()
    stopCountdown()
    currentStep.value = 4
  }
  catch {
    toast.error(t('common.error'))
  }
  finally {
    isSubmitting.value = false
  }
})

// ── Navigation ───────────────────────────────────────
function goToStep(step: 1 | 2 | 3 | 4) {
  if (step === 3 && cartStore.isExpired) {
    handleExpired()
    return
  }
  currentStep.value = step
  if (step === 3) startCountdown()
}

// SEO
useSeoMeta({ title: () => `${t('checkout.steps.seat')} | TicketHub` })
</script>

<template>
  <div class="container mx-auto max-w-2xl px-4 py-8">
    <!-- Stepper -->
    <CheckoutStepper
      v-if="currentStep < 4"
      :steps="steps"
      :current="currentStep"
      class="mb-10"
    />

    <!-- ── Step 1: Seat Selection ── -->
    <section v-if="currentStep === 1" aria-labelledby="step1-heading">
      <h1 id="step1-heading" class="mb-2 text-2xl font-bold">
        {{ $t('checkout.seat.title') }}
      </h1>
      <p class="mb-6 text-sm text-muted-foreground">
        {{ $t('checkout.seat.instruction') }}
      </p>

      <SeatMap v-model="selectedSeats" :cart-items="cartStore.items" />

      <div class="mt-8 flex justify-end">
        <UiButton size="lg" :disabled="!allSeatsSelected" @click="goToStep(2)">
          {{ $t('checkout.seat.continue') }}
        </UiButton>
      </div>
    </section>

    <!-- ── Step 2: Order Confirmation ── -->
    <section v-else-if="currentStep === 2" aria-labelledby="step2-heading">
      <h1 id="step2-heading" class="mb-6 text-2xl font-bold">
        {{ $t('checkout.confirm.title') }}
      </h1>

      <!-- Event info card -->
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
        </div>
      </div>

      <!-- Cart items or empty state -->
      <template v-if="!cartStore.isEmpty">
        <div class="rounded-lg border">
          <div class="divide-y">
            <div
              v-for="item in cartStore.items"
              :key="item.ticketId"
              class="flex flex-wrap items-start gap-3 p-4 sm:items-center"
            >
              <!-- Ticket info -->
              <div class="min-w-0 flex-1">
                <p class="font-medium">{{ item.ticketType }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">
                  {{ formatSelectedSeats(item.ticketId) || '–' }}
                </p>
              </div>

              <!-- Price -->
              <span class="text-sm text-muted-foreground">
                NT$&nbsp;{{ item.unitPrice.toLocaleString() }} ×
              </span>

              <!-- Quantity controls -->
              <div
                class="flex items-center gap-1"
                role="group"
                :aria-label="`${item.ticketType} ${$t('checkout.confirm.qty')}`"
              >
                <button
                  class="flex h-7 w-7 items-center justify-center rounded border border-input bg-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="item.quantity <= 1"
                  :aria-label="`${$t('checkout.confirm.qty')} -1`"
                  @click="decreaseItemQty(item.ticketId)"
                >
                  <Minus class="h-3 w-3" aria-hidden="true" />
                </button>
                <span class="w-7 text-center text-sm font-medium tabular-nums" aria-live="polite">
                  {{ item.quantity }}
                </span>
                <button
                  class="flex h-7 w-7 items-center justify-center rounded border border-input bg-background transition-colors hover:bg-accent"
                  :aria-label="`${$t('checkout.confirm.qty')} +1`"
                  @click="increaseItemQty(item.ticketId)"
                >
                  <Plus class="h-3 w-3" aria-hidden="true" />
                </button>
              </div>

              <!-- Subtotal -->
              <span class="w-24 text-right text-sm font-semibold">
                NT$&nbsp;{{ (item.quantity * item.unitPrice).toLocaleString() }}
              </span>

              <!-- Remove -->
              <button
                class="ml-1 flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :aria-label="`${$t('checkout.confirm.remove')} ${item.ticketType}`"
                @click="removeItem(item.ticketId)"
              >
                <Trash2 class="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <!-- Total -->
          <div class="flex items-center justify-between border-t bg-muted/40 px-4 py-3">
            <span class="font-semibold">{{ $t('checkout.confirm.total') }}</span>
            <span class="text-xl font-bold">
              NT$&nbsp;{{ orderTotal.toLocaleString() }}
            </span>
          </div>
        </div>

        <div class="mt-8 flex items-center justify-between">
          <UiButton variant="outline" @click="goToStep(1)">
            {{ $t('checkout.confirm.back') }}
          </UiButton>
          <UiButton @click="goToStep(3)">
            {{ $t('checkout.confirm.continue') }}
          </UiButton>
        </div>
      </template>

      <!-- Empty cart -->
      <div v-else class="py-16 text-center">
        <p class="text-muted-foreground">{{ $t('checkout.confirm.emptyCart') }}</p>
        <UiButton class="mt-4" variant="outline" as-child>
          <NuxtLink :to="localePath('/events')">
            {{ $t('checkout.confirm.goEvents') }}
          </NuxtLink>
        </UiButton>
      </div>
    </section>

    <!-- ── Step 3: Payment ── -->
    <section v-else-if="currentStep === 3" aria-labelledby="step3-heading">
      <h1 id="step3-heading" class="mb-6 text-2xl font-bold">
        {{ $t('checkout.payment.title') }}
      </h1>

      <!-- Countdown timer -->
      <div
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

      <!-- Payment form -->
      <form class="space-y-5" novalidate @submit.prevent="onPaymentSubmit">
        <!-- Card number -->
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

        <!-- Cardholder name -->
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

        <!-- Expiry + CVV -->
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

        <!-- Navigation -->
        <div class="flex items-center justify-between pt-3">
          <UiButton type="button" variant="outline" @click="goToStep(2)">
            {{ $t('checkout.payment.back') }}
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

      <!-- Session expired overlay -->
      <div
        v-if="showExpiredModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        role="alertdialog"
        aria-labelledby="expired-title"
        aria-describedby="expired-desc"
        aria-modal="true"
      >
        <div class="mx-4 max-w-sm rounded-xl border bg-card p-8 text-center shadow-lg">
          <ClockIcon class="mx-auto mb-4 h-12 w-12 text-destructive" aria-hidden="true" />
          <h2 id="expired-title" class="mb-2 text-xl font-bold">
            {{ $t('checkout.payment.expiredTitle') }}
          </h2>
          <p id="expired-desc" class="mb-6 text-sm text-muted-foreground">
            {{ $t('checkout.payment.expiredDesc') }}
          </p>
          <UiButton @click="handleExpired">
            {{ $t('checkout.payment.restart') }}
          </UiButton>
        </div>
      </div>
    </section>

    <!-- ── Step 4: Order Complete ── -->
    <section
      v-else-if="currentStep === 4"
      class="py-16 text-center"
      aria-labelledby="step4-heading"
    >
      <CheckCircleIcon
        class="mx-auto mb-6 h-20 w-20 text-emerald-500"
        aria-hidden="true"
      />
      <h1 id="step4-heading" class="mb-3 text-3xl font-bold">
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
          <NuxtLink :to="localePath('/dashboard/orders')">
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
  </div>
</template>
