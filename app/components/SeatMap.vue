<script setup lang="ts">
import type { CartItem } from '~/types'

const props = defineProps<{
  cartItems: CartItem[]
  modelValue: Record<string, string[]>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string[]>]
}>()

const COLS = 10
const ROWS = 3

interface ZoneStyle {
  available: string
  selected: string
  header: string
}

const ZONE_STYLES: ZoneStyle[] = [
  {
    available: 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700',
    selected: 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white',
    header: 'text-blue-700',
  },
  {
    available: 'bg-violet-100 hover:bg-violet-200 border-violet-300 text-violet-700',
    selected: 'bg-violet-500 hover:bg-violet-600 border-violet-600 text-white',
    header: 'text-violet-700',
  },
  {
    available: 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-700',
    selected: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white',
    header: 'text-emerald-700',
  },
  {
    available: 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-700',
    selected: 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white',
    header: 'text-amber-700',
  },
]

const DEFAULT_ZONE_STYLE: ZoneStyle = ZONE_STYLES[0] ?? {
  available: 'bg-blue-100 hover:bg-blue-200 border-blue-300 text-blue-700',
  selected: 'bg-blue-500 hover:bg-blue-600 border-blue-600 text-white',
  header: 'text-blue-700',
}

function getZoneStyle(idx: number): ZoneStyle {
  return ZONE_STYLES[idx % ZONE_STYLES.length] ?? DEFAULT_ZONE_STYLE
}

function seatId(ticketId: string, row: number, col: number): string {
  return `${ticketId}:${String.fromCharCode(65 + row)}${col + 1}`
}

function seatLabel(row: number, col: number): string {
  return `${String.fromCharCode(65 + row)}${col + 1}`
}

function isSold(ticketId: string, row: number, col: number): boolean {
  let hash = 0
  for (const char of ticketId) {
    hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0
  }
  return Math.abs(hash + row * 1000 + col) % 10 < 3
}

function isSelected(ticketId: string, id: string): boolean {
  return (props.modelValue[ticketId] ?? []).includes(id)
}

function remainingCount(ticketId: string, quantity: number): number {
  return Math.max(0, quantity - (props.modelValue[ticketId]?.length ?? 0))
}

function toggleSeat(ticketId: string, id: string, quantity: number) {
  const current = [...(props.modelValue[ticketId] ?? [])]
  const idx = current.indexOf(id)
  if (idx !== -1) {
    current.splice(idx, 1)
  }
  else if (current.length < quantity) {
    current.push(id)
  }
  emit('update:modelValue', { ...props.modelValue, [ticketId]: current })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stage indicator -->
    <div class="flex justify-center">
      <div class="rounded-md bg-muted px-12 py-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {{ $t('checkout.seat.stage') }}
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
      <div class="flex items-center gap-1.5">
        <div class="h-4 w-4 rounded border border-blue-300 bg-blue-100" aria-hidden="true" />
        <span>{{ $t('checkout.seat.legend.available') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="h-4 w-4 rounded border border-gray-300 bg-gray-200" aria-hidden="true" />
        <span>{{ $t('checkout.seat.legend.sold') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="h-4 w-4 rounded bg-blue-500" aria-hidden="true" />
        <span>{{ $t('checkout.seat.legend.selected') }}</span>
      </div>
    </div>

    <!-- Zones -->
    <div
      v-for="(item, zoneIdx) in cartItems"
      :key="item.ticketId"
      class="rounded-lg border bg-card p-4"
      role="group"
      :aria-labelledby="`zone-label-${item.ticketId}`"
    >
      <!-- Zone header -->
      <div class="mb-3 flex items-center justify-between">
        <h3
          :id="`zone-label-${item.ticketId}`"
          class="text-sm font-semibold"
          :class="getZoneStyle(zoneIdx).header"
        >
          {{ item.ticketType }}
        </h3>
        <span
          class="text-xs font-medium transition-colors"
          :class="remainingCount(item.ticketId, item.quantity) === 0 ? 'text-emerald-600' : 'text-muted-foreground'"
          aria-live="polite"
          aria-atomic="true"
        >
          {{
            remainingCount(item.ticketId, item.quantity) === 0
              ? $t('checkout.seat.allSelected')
              : $t('checkout.seat.remaining', { count: remainingCount(item.ticketId, item.quantity) })
          }}
        </span>
      </div>

      <!-- Seat grid -->
      <div
        class="grid gap-1"
        :style="{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }"
      >
        <template v-for="row in ROWS" :key="row">
          <button
            v-for="col in COLS"
            :key="col"
            type="button"
            class="flex h-7 min-w-0 items-center justify-center rounded border text-[9px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
            :class="
              isSold(item.ticketId, row - 1, col - 1)
                ? 'border-gray-300 bg-gray-200 text-gray-400'
                : isSelected(item.ticketId, seatId(item.ticketId, row - 1, col - 1))
                  ? getZoneStyle(zoneIdx).selected
                  : getZoneStyle(zoneIdx).available
            "
            :disabled="isSold(item.ticketId, row - 1, col - 1)"
            :aria-label="`${item.ticketType} ${seatLabel(row - 1, col - 1)} — ${
              isSold(item.ticketId, row - 1, col - 1)
                ? $t('checkout.seat.legend.sold')
                : isSelected(item.ticketId, seatId(item.ticketId, row - 1, col - 1))
                  ? $t('checkout.seat.legend.selected')
                  : $t('checkout.seat.legend.available')
            }`"
            :aria-pressed="
              !isSold(item.ticketId, row - 1, col - 1)
                ? isSelected(item.ticketId, seatId(item.ticketId, row - 1, col - 1))
                : undefined
            "
            @click="toggleSeat(item.ticketId, seatId(item.ticketId, row - 1, col - 1), item.quantity)"
          >
            {{ seatLabel(row - 1, col - 1) }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
