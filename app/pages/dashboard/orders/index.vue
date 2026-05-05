<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useReservationStore } from '~/stores/reservation'
import { useReservation } from '~/composables/useReservation'
import type { Order, OrderStatus } from '~/types'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { fetchOrders } = useOrders()
const { resumeReservation } = useReservation()
const reservationStore = useReservationStore()
const api = useApi()

useSeoMeta({ title: () => `${t('dashboard.ordersPage.title')} | TicketHub` })

const { data: orders, status, refresh } = useAsyncData(
  'dashboard-orders',
  async () => {
    const res = await fetchOrders()
    return res.data
  },
  { server: false },
)

const isLoading = computed(() => status.value === 'idle' || status.value === 'pending')

const pendingOrders = computed(() =>
  (orders.value ?? []).filter(
    o => o.status === 'pending_seats' || o.status === 'pending_payment',
  ),
)

const completedOrders = computed(() =>
  (orders.value ?? []).filter(
    o => o.status !== 'pending_seats' && o.status !== 'pending_payment',
  ),
)

function statusClass(s: OrderStatus): string {
  if (s === 'confirmed') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (s === 'pending_seats' || s === 'pending_payment')
    return 'bg-amber-100 text-amber-700 border-amber-200'
  if (s === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (s === 'cancelled') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(iso))
}

// ── Actions for pending orders ───────────────────────

const isResuming = ref<string | null>(null)

async function handleResume(order: Order) {
  if (!order.reservationId) return
  isResuming.value = order.id
  try {
    await resumeReservation(order.reservationId)
  }
  finally {
    isResuming.value = null
  }
}

const isCancellingId = ref<string | null>(null)

async function handleCancelPending(order: Order) {
  if (!order.reservationId) return
  if (!confirm(t('dashboard.ordersPage.cancelPendingConfirm'))) return
  isCancellingId.value = order.id
  try {
    await api.delete(`/reservations/${order.reservationId}`)
    if (reservationStore.reservationId === order.reservationId) {
      reservationStore.clearState()
    }
    await refresh()
  }
  catch {
    toast.error(t('common.error'))
  }
  finally {
    isCancellingId.value = null
  }
}
</script>

<template>
  <DashboardShell>
    <div>
      <h1 class="mb-6 text-2xl font-bold">{{ $t('dashboard.ordersPage.title') }}</h1>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-3" aria-busy="true" :aria-label="$t('common.loading')">
        <UiSkeleton v-for="i in 3" :key="i" class="h-24 w-full rounded-lg" />
      </div>

      <template v-else>

        <!-- ── Pending / Incomplete orders ── -->
        <section v-if="pendingOrders.length" class="mb-8" aria-labelledby="pending-heading">
          <h2
            id="pending-heading"
            class="mb-3 flex items-center gap-2 text-base font-semibold text-amber-700"
          >
            <span
              class="inline-block h-2 w-2 rounded-full bg-amber-500"
              aria-hidden="true"
            />
            {{ $t('dashboard.ordersPage.pendingSection') }}
          </h2>

          <div class="space-y-3">
            <div
              v-for="order in pendingOrders"
              :key="order.id"
              class="rounded-lg border-2 border-amber-200 bg-amber-50 p-4"
            >
              <div class="flex gap-4">
                <img
                  v-if="order.event?.coverImage"
                  :src="order.event.coverImage"
                  :alt="order.event.title ?? ''"
                  class="h-16 w-24 shrink-0 rounded-md object-cover"
                  loading="lazy"
                >
                <div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
                  <div class="flex items-start justify-between gap-3">
                    <p class="line-clamp-2 font-medium leading-tight">
                      {{ order.event?.title ?? order.eventId }}
                    </p>
                    <span
                      class="shrink-0 rounded border px-2 py-0.5 text-xs font-medium"
                      :class="statusClass(order.status)"
                    >
                      {{ $t(`dashboard.ordersPage.status.${order.status}`) }}
                    </span>
                  </div>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{{ formatDate(order.createdAt) }}</span>
                    <span class="font-semibold text-foreground">
                      NT$&nbsp;{{ order.total.toLocaleString() }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="mt-3 flex items-center justify-end gap-2 border-t border-amber-200 pt-3">
                <UiButton
                  variant="outline"
                  size="sm"
                  :disabled="isCancellingId === order.id"
                  @click="handleCancelPending(order)"
                >
                  {{ $t('dashboard.ordersPage.cancelPending') }}
                </UiButton>
                <UiButton
                  size="sm"
                  :disabled="isResuming === order.id"
                  @click="handleResume(order)"
                >
                  {{ isResuming === order.id ? $t('common.loading') : $t('dashboard.ordersPage.resume') }}
                </UiButton>
              </div>
            </div>
          </div>
        </section>

        <!-- ── Empty state (no orders at all) ── -->
        <div
          v-if="!pendingOrders.length && !completedOrders.length"
          class="flex flex-col items-center gap-4 py-20 text-center"
        >
          <p class="text-muted-foreground">{{ $t('dashboard.ordersPage.empty') }}</p>
          <UiButton variant="outline" as-child>
            <NuxtLink :to="localePath('/events')">
              {{ $t('dashboard.ordersPage.browseEvents') }}
            </NuxtLink>
          </UiButton>
        </div>

        <!-- ── Completed / other orders ── -->
        <div v-if="completedOrders.length" class="space-y-3">
          <NuxtLink
            v-for="order in completedOrders"
            :key="order.id"
            :to="localePath(`/dashboard/orders/${order.id}`)"
            class="flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <img
              v-if="order.event?.coverImage"
              :src="order.event.coverImage"
              :alt="order.event.title ?? ''"
              class="h-16 w-24 shrink-0 rounded-md object-cover"
              loading="lazy"
            >
            <div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <div class="flex items-start justify-between gap-3">
                <p class="line-clamp-2 font-medium leading-tight">
                  {{ order.event?.title ?? order.eventId }}
                </p>
                <span
                  class="shrink-0 rounded border px-2 py-0.5 text-xs font-medium"
                  :class="statusClass(order.status)"
                >
                  {{ $t(`dashboard.ordersPage.status.${order.status}`) }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{{ formatDate(order.createdAt) }}</span>
                <span class="font-semibold text-foreground">
                  NT$&nbsp;{{ order.total.toLocaleString() }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

      </template>
    </div>
  </DashboardShell>
</template>
