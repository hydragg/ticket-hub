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

    <!-- ── Skeleton ── -->
    <template v-if="isLoading">

      <!-- Hero skeleton -->
      <div class="relative h-[50vh] min-h-[300px] max-h-[600px] w-full">
        <UiSkeleton class="h-full w-full rounded-none" />

        <!-- prev / next buttons -->
        <UiSkeleton class="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-muted-foreground/30" />
        <UiSkeleton class="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-muted-foreground/30" />

        <!-- dot tabs -->
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          <UiSkeleton class="h-2 w-6 rounded-full bg-muted-foreground/50" />
          <UiSkeleton class="h-2 w-2 rounded-full bg-muted-foreground/30" />
          <UiSkeleton class="h-2 w-2 rounded-full bg-muted-foreground/30" />
        </div>

        <!-- text overlay -->
        <div class="absolute bottom-0 left-0 w-full container mx-auto px-4 pb-12 sm:px-6 md:pb-16">
          <UiSkeleton class="mb-3 h-6 w-24 rounded-full" />
          <UiSkeleton class="mb-2 h-9 w-2/3 max-w-lg" />
          <UiSkeleton class="mb-4 h-4 w-1/2 max-w-sm" />
          <UiSkeleton class="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <!-- Category skeleton -->
      <section class="container mx-auto px-4 py-10 sm:px-6">
        <UiSkeleton class="mb-6 h-7 w-32" />
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="n in 4"
            :key="n"
            class="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
          >
            <UiSkeleton class="h-12 w-12 shrink-0 rounded-lg" />
            <div class="flex-1 space-y-2">
              <UiSkeleton class="h-4 w-24" />
              <UiSkeleton class="h-3 w-36" />
            </div>
          </div>
        </div>
      </section>

      <!-- Featured events skeleton -->
      <section class="py-10">
        <div class="container mx-auto px-4 sm:px-6">
          <div class="mb-6 flex items-center justify-between">
            <UiSkeleton class="h-7 w-36" />
            <UiSkeleton class="h-4 w-16" />
          </div>
          <div class="flex gap-5 overflow-hidden pb-4">
            <div
              v-for="n in 4"
              :key="n"
              class="w-72 flex-shrink-0 overflow-hidden rounded-xl border border-border sm:w-80"
            >
              <UiSkeleton class="aspect-video w-full rounded-none" />
              <div class="p-4 space-y-2">
                <UiSkeleton class="h-4 w-4/5" />
                <UiSkeleton class="h-4 w-3/5" />
                <UiSkeleton class="h-3 w-2/5" />
                <UiSkeleton class="mt-3 h-3 w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Upcoming events skeleton -->
      <section class="container mx-auto px-4 py-10 sm:px-6">
        <div class="mb-6 flex items-center justify-between">
          <UiSkeleton class="h-7 w-36" />
          <UiSkeleton class="h-4 w-16" />
        </div>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="n in 6"
            :key="n"
            class="overflow-hidden rounded-xl border border-border"
          >
            <UiSkeleton class="aspect-video w-full rounded-none" />
            <div class="p-4 space-y-2">
              <UiSkeleton class="h-4 w-4/5" />
              <UiSkeleton class="h-4 w-3/5" />
              <UiSkeleton class="h-3 w-2/5" />
              <UiSkeleton class="mt-3 h-3 w-1/3" />
            </div>
          </div>
        </div>
      </section>

    </template>

    <!-- ── Loaded ── -->
    <template v-else-if="status === 'success'">
      <HeroCarousel :events="featuredEvents" />
      <CategorySection />
      <FeaturedEvents :events="featuredEvents" />
      <UpcomingEvents :events="upcomingEvents" />
    </template>

    <!-- ── Error ── -->
    <div
      v-else
      class="flex min-h-[60vh] items-center justify-center"
    >
      <p class="text-destructive">{{ $t('common.error') }}</p>
    </div>

  </main>
</template>
