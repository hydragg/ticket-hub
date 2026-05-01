<script setup lang="ts">
import type { Event } from '~/types'

defineProps<{ events: Event[] }>()
const localePath = useLocalePath()
</script>

<template>
  <section v-if="events.length > 0" class="py-10">
    <div class="container mx-auto px-4 sm:px-6">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-2xl font-bold">{{ $t('home.featured.title') }}</h2>
        <NuxtLink
          :to="localePath('/events')"
          class="rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {{ $t('home.featured.viewAll') }}
        </NuxtLink>
      </div>
    </div>
    <div class="container mx-auto px-4 sm:px-6">
      <div
        class="flex gap-5 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
        :aria-label="$t('home.featured.title')"
      >
        <div
          v-for="event in events"
          :key="event.id"
          role="listitem"
          class="w-72 flex-shrink-0 sm:w-80"
        >
          <EventCard :event="event" />
        </div>
      </div>
    </div>
  </section>
</template>
