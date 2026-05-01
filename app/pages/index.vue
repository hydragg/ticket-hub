<script setup lang="ts">
const { t } = useI18n()
const { fetchEvents } = useEvents()

useSeoMeta({
  title: () => `TicketHub | ${t('nav.home')}`,
  ogTitle: 'TicketHub',
})

const { data: eventsData, status } = useAsyncData(
  'home-events',
  () => fetchEvents(),
  { server: false },
)

const allEvents = computed(() => eventsData.value?.data ?? [])

const featuredEvents = computed(() => allEvents.value.filter((e) => e.isFeatured))

const upcomingEvents = computed(() =>
  [...allEvents.value].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  ),
)

const isLoading = computed(
  () => status.value === 'idle' || status.value === 'pending',
)
</script>

<template>
  <main id="main-content">
    <div
      v-if="isLoading"
      class="flex min-h-[60vh] items-center justify-center"
      aria-live="polite"
      aria-busy="true"
    >
      <p class="text-muted-foreground">{{ $t('common.loading') }}</p>
    </div>

    <template v-else-if="status === 'success'">
      <HeroCarousel :events="featuredEvents" />
      <CategorySection />
      <FeaturedEvents :events="featuredEvents" />
      <UpcomingEvents :events="upcomingEvents" />
    </template>

    <div
      v-else
      class="flex min-h-[60vh] items-center justify-center"
    >
      <p class="text-destructive">{{ $t('common.error') }}</p>
    </div>
  </main>
</template>
