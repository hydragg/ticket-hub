<script setup lang="ts">
import { QrCodeIcon } from 'lucide-vue-next'
import type { OrderStatus } from '~/types'

definePageMeta({ middleware: 'auth' })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const id = route.params.id as string
const { fetchOrder } = useOrders()

useSeoMeta({ title: () => `${t('dashboard.orderDetail.title')} | TicketHub` })

const { data: order, status } = useAsyncData(
  `dashboard-order-${id}`,
  async () => {
    const res = await fetchOrder(id)
    return res.data ?? null
  },
  { server: false },
)

const isLoading = computed(() => status.value === 'idle' || status.value === 'pending')
const isNotFound = computed(() => status.value === 'success' && !order.value)

function statusClass(s: OrderStatus): string {
  if (s === 'confirmed') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (s === 'pending') return 'bg-amber-100 text-amber-700 border-amber-200'
  if (s === 'cancelled') return 'bg-red-100 text-red-700 border-red-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
</script>

<template>
  <DashboardShell>
    <div>
      <!-- Back link -->
      <NuxtLink
        :to="localePath('/dashboard/orders')"
        class="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden="true">←</span>
        {{ $t('dashboard.orderDetail.back') }}
      </NuxtLink>

      <!-- Loading -->
      <div v-if="isLoading" class="space-y-4" aria-busy="true" :aria-label="$t('common.loading')">
        <UiSkeleton class="h-8 w-48" />
        <UiSkeleton class="h-32 w-full rounded-lg" />
        <UiSkeleton class="h-48 w-full rounded-lg" />
      </div>

      <!-- Not found -->
      <div v-else-if="isNotFound" class="py-20 text-center">
        <p class="text-muted-foreground">{{ $t('dashboard.orderDetail.notFound') }}</p>
      </div>

      <!-- Order detail -->
      <template v-else-if="order">
        <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 class="text-2xl font-bold">{{ $t('dashboard.orderDetail.title') }}</h1>
          <span
            class="rounded border px-3 py-1 text-sm font-medium"
            :class="statusClass(order.status)"
          >
            {{ $t(`dashboard.ordersPage.status.${order.status}`) }}
          </span>
        </div>

        <!-- Order meta -->
        <div class="mb-6 rounded-lg border bg-card p-4 text-sm">
          <dl class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {{ $t('dashboard.orderDetail.orderNumber') }}
              </dt>
              <dd class="mt-0.5 font-mono font-medium">{{ order.id }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {{ $t('dashboard.orderDetail.date') }}
              </dt>
              <dd class="mt-0.5">{{ formatDate(order.createdAt) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Event info -->
        <div v-if="order.event" class="mb-6 flex gap-4 rounded-lg border bg-card p-4">
          <img
            :src="order.event.coverImage"
            :alt="order.event.title"
            class="h-20 w-28 shrink-0 rounded-md object-cover"
            loading="lazy"
          >
          <div class="min-w-0">
            <p class="font-semibold leading-tight">{{ order.event.title }}</p>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ order.event.venue }}・{{ order.event.city }}
            </p>
          </div>
        </div>

        <!-- Ticket items -->
        <div class="mb-6 rounded-lg border">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b bg-muted/40">
                <th class="px-4 py-3 text-left font-medium text-muted-foreground">
                  {{ $t('dashboard.orderDetail.ticketType') }}
                </th>
                <th class="px-4 py-3 text-center font-medium text-muted-foreground">
                  {{ $t('dashboard.orderDetail.qty') }}
                </th>
                <th class="px-4 py-3 text-right font-medium text-muted-foreground">
                  {{ $t('dashboard.orderDetail.unitPrice') }}
                </th>
                <th class="px-4 py-3 text-right font-medium text-muted-foreground">
                  {{ $t('dashboard.orderDetail.unitPrice') === $t('dashboard.orderDetail.total') ? '' : $t('dashboard.orderDetail.total') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="item in order.items" :key="item.ticketId">
                <td class="px-4 py-3 font-medium">{{ item.ticketType }}</td>
                <td class="px-4 py-3 text-center tabular-nums">{{ item.quantity }}</td>
                <td class="px-4 py-3 text-right tabular-nums text-muted-foreground">
                  NT$&nbsp;{{ item.unitPrice.toLocaleString() }}
                </td>
                <td class="px-4 py-3 text-right font-semibold tabular-nums">
                  NT$&nbsp;{{ (item.quantity * item.unitPrice).toLocaleString() }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t bg-muted/40">
                <td colspan="3" class="px-4 py-3 text-right font-semibold">
                  {{ $t('dashboard.orderDetail.total') }}
                </td>
                <td class="px-4 py-3 text-right text-lg font-bold">
                  NT$&nbsp;{{ order.total.toLocaleString() }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- QR Code placeholder -->
        <div class="flex flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center">
          <h2 class="font-semibold">{{ $t('dashboard.orderDetail.qrTitle') }}</h2>
          <div
            class="flex items-center justify-center rounded-lg bg-muted p-6"
            aria-label="QR Code placeholder"
          >
            <QrCodeIcon class="h-32 w-32 text-foreground" aria-hidden="true" />
          </div>
          <p class="font-mono text-sm font-medium">{{ order.id }}</p>
          <p class="text-xs text-muted-foreground">{{ $t('dashboard.orderDetail.qrHint') }}</p>
        </div>
      </template>
    </div>
  </DashboardShell>
</template>
