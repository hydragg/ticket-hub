<script setup lang="ts">
import type { Event } from '~/types'

defineProps<{ events: Event[] }>()
const localePath = useLocalePath()
</script>

<template>
  <section class="container mx-auto px-4 py-10 sm:px-6">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-2xl font-bold">{{ $t('home.upcoming.title') }}</h2>
      <NuxtLink
        :to="localePath('/events')"
        class="rounded text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {{ $t('home.upcoming.viewMore') }}
      </NuxtLink>
    </div>
    <div
      v-if="events.length > 0"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
      :aria-label="$t('home.upcoming.title')"
    >
      <div v-for="event in events" :key="event.id" role="listitem">
        <EventCard :event="event" />
      </div>
    </div>
    <p v-else class="py-12 text-center text-muted-foreground">
      {{ $t('events.empty') }}
    </p>
  </section>
</template>
