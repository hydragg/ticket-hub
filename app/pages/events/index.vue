<script setup lang="ts">
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { EventCategory } from '~/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { fetchEvents } = useEvents()

useSeoMeta({ title: () => `${t('events.title')} | TicketHub` })

const PAGE_SIZE = 9

function buildFetchParams() {
  return {
    category: (route.query.category as EventCategory) || undefined,
    city: (route.query.city as string) || undefined,
    dateFrom: (route.query.dateFrom as string) || undefined,
    dateTo: (route.query.dateTo as string) || undefined,
    priceMin: route.query.priceMin ? Number(route.query.priceMin) : undefined,
    priceMax: route.query.priceMax ? Number(route.query.priceMax) : undefined,
    page: Number(route.query.page ?? 1),
    pageSize: PAGE_SIZE,
  }
}

const { data, status, refresh } = useAsyncData(
  'events-list',
  () => fetchEvents(buildFetchParams()),
  { server: false },
)

const localePath = useLocalePath()

// Only re-fetch when still on this page — guards against the watch firing
// after route has already changed to a different page.
watch(
  () => route.query,
  () => {
    if (route.path === localePath('/events')) refresh()
  },
  { deep: true },
)

const events = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.total ?? 0)
const currentPage = computed(() => Number(route.query.page ?? 1))
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const isLoading = computed(
  () => status.value === 'idle' || status.value === 'pending',
)

function goToPage(page: number) {
  router.push({ query: { ...route.query, page: page > 1 ? String(page) : undefined } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <main id="main-content" class="container mx-auto px-4 py-8 sm:px-6">
    <h1 class="mb-6 text-3xl font-bold">{{ $t('events.title') }}</h1>

    <!-- Filters -->
    <div class="mb-6">
      <EventsFilter />
    </div>

    <!-- Results count -->
    <p
      class="mb-4 text-sm text-muted-foreground"
      aria-live="polite"
      aria-atomic="true"
    >
      <template v-if="!isLoading">
        {{ $t('events.count', { count: total }) }}
      </template>
    </p>

    <!-- Loading skeletons -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      :aria-label="$t('common.loading')"
    >
      <SkeletonCard v-for="i in PAGE_SIZE" :key="i" />
    </div>

    <!-- Events grid -->
    <div
      v-else-if="status === 'success' && events.length > 0"
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
      :aria-label="$t('events.title')"
    >
      <div v-for="event in events" :key="event.id" role="listitem">
        <EventCard :event="event" />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="status === 'success' && events.length === 0"
      class="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center"
    >
      <p class="text-lg font-medium">{{ $t('events.empty') }}</p>
      <p class="text-sm text-muted-foreground">
        {{ $t('events.filter.reset') }}?
      </p>
      <UiButton variant="outline" @click="router.push({ query: {} })">
        {{ $t('events.filter.reset') }}
      </UiButton>
    </div>

    <!-- Error state -->
    <div
      v-else-if="status === 'error'"
      class="flex min-h-[40vh] items-center justify-center"
    >
      <p class="text-destructive">{{ $t('common.error') }}</p>
    </div>

    <!-- Pagination -->
    <div
      v-if="!isLoading && totalPages > 1"
      class="mt-10 flex items-center justify-center gap-3"
      role="navigation"
      :aria-label="$t('events.pagination.info', { page: currentPage, total: totalPages })"
    >
      <UiButton
        variant="outline"
        size="sm"
        :disabled="currentPage <= 1"
        :aria-label="$t('events.pagination.prev')"
        @click="goToPage(currentPage - 1)"
      >
        <ChevronLeft class="h-4 w-4" aria-hidden="true" />
        {{ $t('events.pagination.prev') }}
      </UiButton>

      <span class="text-sm text-muted-foreground" aria-current="page">
        {{
          $t('events.pagination.info', { page: currentPage, total: totalPages })
        }}
      </span>

      <UiButton
        variant="outline"
        size="sm"
        :disabled="currentPage >= totalPages"
        :aria-label="$t('events.pagination.next')"
        @click="goToPage(currentPage + 1)"
      >
        {{ $t('events.pagination.next') }}
        <ChevronRight class="h-4 w-4" aria-hidden="true" />
      </UiButton>
    </div>
  </main>
</template>
