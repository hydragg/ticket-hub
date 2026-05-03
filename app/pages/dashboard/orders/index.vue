<script setup lang="ts">
import type { OrderStatus } from '~/types'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { fetchOrders } = useOrders()

useSeoMeta({ title: () => `${t('dashboard.ordersPage.title')} | TicketHub` })

const { data: orders, status } = useAsyncData(
  'dashboard-orders',
  async () => {
    const res = await fetchOrders()
    return res.data
  },
  { server: false },
)

const isLoading = computed(() => status.value === 'idle' || status.value === 'pending')

function statusClass(s: OrderStatus): string {
  if (s === 'confirmed') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
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
</script>

<template>
  <DashboardShell>
    <div>
      <h1 class="mb-6 text-2xl font-bold">{{ $t('dashboard.ordersPage.title') }}</h1>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-3" aria-busy="true" :aria-label="$t('common.loading')">
        <UiSkeleton v-for="i in 3" :key="i" class="h-24 w-full rounded-lg" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!orders?.length"
        class="flex flex-col items-center gap-4 py-20 text-center"
      >
        <p class="text-muted-foreground">{{ $t('dashboard.ordersPage.empty') }}</p>
        <UiButton variant="outline" as-child>
          <NuxtLink :to="localePath('/events')">
            {{ $t('dashboard.ordersPage.browseEvents') }}
          </NuxtLink>
        </UiButton>
      </div>

      <!-- Orders list -->
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="order in orders"
          :key="order.id"
          :to="localePath(`/dashboard/orders/${order.id}`)"
          class="flex gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <!-- Event cover -->
          <img
            v-if="order.event?.coverImage"
            :src="order.event.coverImage"
            :alt="order.event.title ?? ''"
            class="h-16 w-24 shrink-0 rounded-md object-cover"
            loading="lazy"
          >

          <!-- Info -->
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
    </div>
  </DashboardShell>
</template>
