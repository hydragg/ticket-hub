<script setup lang="ts">
import type { Event } from '~/types'

const props = defineProps<{ event: Event }>()
const { locale } = useI18n()
const localePath = useLocalePath()

const minPrice = computed(() =>
  Math.min(...props.event.tickets.map((t) => t.price))
)

const isAvailable = computed(() =>
  props.event.tickets.some((t) => t.available > 0)
)

const formattedDate = computed(() =>
  new Intl.DateTimeFormat(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(props.event.date))
)
</script>

<template>
  <NuxtLink
    :to="localePath(`/events/${event.slug}`)"
    class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  >
    <div class="relative aspect-video overflow-hidden">
      <img
        :src="event.coverImage"
        :alt="event.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      >
      <span
        class="absolute left-2 top-2 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground"
      >
        {{ $t(`events.categories.${event.category}`) }}
      </span>
    </div>
    <div class="flex flex-1 flex-col p-4">
      <h3
        class="line-clamp-2 font-semibold leading-snug text-card-foreground transition-colors group-hover:text-primary"
      >
        {{ event.title }}
      </h3>
      <p class="mt-1.5 text-sm text-muted-foreground">{{ formattedDate }}</p>
      <p class="text-sm text-muted-foreground">{{ event.venue }}・{{ event.city }}</p>
      <div class="mt-auto flex items-center justify-between pt-3">
        <span v-if="!isAvailable" class="text-sm font-semibold text-destructive">
          {{ $t('events.soldOut') }}
        </span>
        <template v-else>
          <span class="text-xs text-muted-foreground">{{ $t('events.from') }}</span>
          <span class="text-base font-bold text-primary">
            NT$&nbsp;{{ minPrice.toLocaleString() }}
          </span>
        </template>
      </div>
    </div>
  </NuxtLink>
</template>
