<script setup lang="ts">
import { toast } from 'vue-sonner'
import { ChevronRight, MapPin, Calendar, Minus, Plus } from 'lucide-vue-next'
import type { Event } from '~/types'

const { t, locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const slug = route.params.slug as string
const cartStore = useCartStore()
const { fetchEvent, fetchEvents } = useEvents()

const { data, status } = useAsyncData(
  `event-${slug}`,
  async () => {
    const res = await fetchEvent(slug)
    if (!res.data) return { event: null as Event | null, related: [] as Event[] }
    const relRes = await fetchEvents({ category: res.data.category, pageSize: 4 })
    const related = relRes.data.filter(e => e.slug !== slug).slice(0, 3)
    return { event: res.data, related }
  },
  { server: false },
)

const event = computed(() => data.value?.event ?? null)
const relatedEvents = computed(() => data.value?.related ?? [])
const isLoading = computed(() => status.value === 'idle' || status.value === 'pending')
const isNotFound = computed(() => status.value === 'success' && !event.value)

useSeoMeta({
  title: () => event.value ? `${event.value.title} | TicketHub` : 'TicketHub',
  ogTitle: () => event.value?.title ?? 'TicketHub',
  description: () => event.value?.description ?? '',
  ogDescription: () => event.value?.description ?? '',
  ogImage: () => event.value?.coverImage ?? '',
})

const quantities = ref<Record<string, number>>({})

watch(
  event,
  (e) => {
    if (e) quantities.value = Object.fromEntries(e.tickets.map(tk => [tk.id, 0]))
  },
  { immediate: true },
)

const hasSelection = computed(() => Object.values(quantities.value).some(q => q > 0))

const selectionTotal = computed(() => {
  if (!event.value) return 0
  return event.value.tickets.reduce((sum, tk) => {
    const q = quantities.value[tk.id] ?? 0
    return sum + q * tk.price
  }, 0)
})

function qty(ticketId: string): number {
  return quantities.value[ticketId] ?? 0
}

function increment(ticketId: string, max: number) {
  const cur = qty(ticketId)
  if (cur < max) quantities.value[ticketId] = cur + 1
}

function decrement(ticketId: string) {
  const cur = qty(ticketId)
  if (cur > 0) quantities.value[ticketId] = cur - 1
}

function addToCart() {
  if (!event.value) return
  for (const tk of event.value.tickets) {
    const q = qty(tk.id)
    if (q > 0) {
      cartStore.addItem({
        eventId: event.value.id,
        eventSlug: event.value.slug,
        ticketId: tk.id,
        ticketType: tk.type,
        quantity: q,
        unitPrice: tk.price,
      })
    }
  }
  quantities.value = Object.fromEntries(event.value.tickets.map(tk => [tk.id, 0]))
  toast.success(t('event.addedToCart'))
}

function scrollToTickets() {
  document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })
}

const formattedDate = computed(() => {
  if (!event.value) return ''
  return new Intl.DateTimeFormat(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Taipei',
  }).format(new Date(event.value.date))
})
</script>

<template>
  <div class="container mx-auto px-4 py-8 sm:px-6">

    <!-- Loading skeleton -->
    <div v-if="isLoading" aria-busy="true" :aria-label="$t('common.loading')">
      <div class="mb-6 flex items-center gap-2">
        <UiSkeleton class="h-4 w-10" />
        <UiSkeleton class="h-3 w-3" />
        <UiSkeleton class="h-4 w-14" />
        <UiSkeleton class="h-3 w-3" />
        <UiSkeleton class="h-4 w-48" />
      </div>
      <div class="grid gap-8 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <UiSkeleton class="aspect-video w-full rounded-xl" />
        </div>
        <div class="space-y-3 lg:col-span-2">
          <UiSkeleton class="h-5 w-20" />
          <UiSkeleton class="h-8 w-full" />
          <UiSkeleton class="h-8 w-4/5" />
          <UiSkeleton class="mt-4 h-4 w-52" />
          <UiSkeleton class="h-4 w-40" />
          <UiSkeleton class="mt-6 h-10 w-full" />
        </div>
      </div>
      <div class="mt-10 space-y-2">
        <UiSkeleton class="h-6 w-28" />
        <UiSkeleton class="h-4 w-full" />
        <UiSkeleton class="h-4 w-full" />
        <UiSkeleton class="h-4 w-2/3" />
      </div>
    </div>

    <!-- Not found -->
    <div
      v-else-if="isNotFound"
      class="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center"
    >
      <p class="text-xl font-semibold">{{ $t('event.notFound') }}</p>
      <UiButton variant="outline" :to="localePath('/events')" as="NuxtLink">
        {{ $t('event.backToEvents') }}
      </UiButton>
    </div>

    <!-- Main content -->
    <template v-else-if="event">

      <!-- Breadcrumb -->
      <nav aria-label="breadcrumb" class="mb-6">
        <ol class="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li>
            <NuxtLink
              :to="localePath('/')"
              class="transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {{ $t('nav.home') }}
            </NuxtLink>
          </li>
          <li aria-hidden="true">
            <ChevronRight class="h-3.5 w-3.5" />
          </li>
          <li>
            <NuxtLink
              :to="localePath('/events')"
              class="transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {{ $t('events.title') }}
            </NuxtLink>
          </li>
          <li aria-hidden="true">
            <ChevronRight class="h-3.5 w-3.5" />
          </li>
          <li
            aria-current="page"
            class="max-w-[200px] truncate font-medium text-foreground sm:max-w-xs"
          >
            {{ event.title }}
          </li>
        </ol>
      </nav>

      <!-- Hero -->
      <div class="grid gap-8 lg:grid-cols-5">

        <!-- Cover image + gallery -->
        <div class="lg:col-span-3">
          <div class="aspect-video overflow-hidden rounded-xl bg-muted">
            <img
              :src="event.coverImage"
              :alt="event.title"
              class="h-full w-full object-cover"
            >
          </div>
          <div
            v-if="event.images?.length"
            class="mt-3 flex gap-2 overflow-x-auto pb-1"
            role="list"
            :aria-label="$t('event.gallery')"
          >
            <img
              v-for="(img, i) in event.images"
              :key="i"
              :src="img"
              :alt="`${event.title} ${i + 1}`"
              role="listitem"
              class="h-20 w-32 shrink-0 cursor-pointer rounded-lg object-cover ring-2 ring-transparent transition-all hover:ring-primary focus-visible:outline-none focus-visible:ring-primary"
              loading="lazy"
              tabindex="0"
            >
          </div>
        </div>

        <!-- Event info sidebar -->
        <div class="lg:col-span-2">
          <UiBadge class="mb-3 capitalize">
            {{ $t(`events.categories.${event.category}`) }}
          </UiBadge>
          <h1 class="mb-4 text-2xl font-bold leading-tight sm:text-3xl">
            {{ event.title }}
          </h1>
          <div class="space-y-2.5 text-sm text-muted-foreground">
            <div class="flex items-start gap-2">
              <Calendar class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{{ formattedDate }}</span>
            </div>
            <div class="flex items-start gap-2">
              <MapPin class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{{ event.venue }}・{{ event.city }}</span>
            </div>
          </div>
          <UiButton class="mt-6 w-full" @click="scrollToTickets">
            {{ $t('events.buyTickets') }}
          </UiButton>
        </div>
      </div>

      <!-- Description -->
      <section class="mt-10" aria-labelledby="description-heading">
        <h2 id="description-heading" class="mb-3 text-xl font-semibold">
          {{ $t('event.description') }}
        </h2>
        <p class="leading-relaxed text-muted-foreground">
          {{ event.description }}
        </p>
      </section>

      <UiSeparator class="my-10" />

      <!-- Ticket selection -->
      <section id="tickets" aria-labelledby="tickets-heading">
        <h2 id="tickets-heading" class="mb-5 text-xl font-semibold">
          {{ $t('event.tickets') }}
        </h2>

        <div class="space-y-3">
          <div
            v-for="ticket in event.tickets"
            :key="ticket.id"
            class="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <!-- Ticket info -->
            <div class="min-w-0">
              <p class="font-semibold">{{ ticket.type }}</p>
              <p class="mt-0.5 text-sm">
                <span v-if="ticket.available > 0" class="text-muted-foreground">
                  {{ $t('event.available', { count: ticket.available }) }}
                </span>
                <span v-else class="font-medium text-destructive">
                  {{ $t('event.soldOut') }}
                </span>
              </p>
            </div>

            <!-- Price + quantity controls -->
            <div class="flex items-center gap-4">
              <span class="text-lg font-bold text-primary">
                NT$&nbsp;{{ ticket.price.toLocaleString() }}
              </span>

              <div
                v-if="ticket.available > 0"
                class="flex items-center gap-1"
                role="group"
                :aria-label="`${ticket.type} ${$t('event.quantity')}`"
              >
                <button
                  class="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="qty(ticket.id) === 0"
                  :aria-label="`${$t('event.decrease')} ${ticket.type}`"
                  @click="decrement(ticket.id)"
                >
                  <Minus class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span
                  class="w-8 text-center text-sm font-medium tabular-nums"
                  aria-live="polite"
                >
                  {{ qty(ticket.id) }}
                </span>
                <button
                  class="flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
                  :disabled="qty(ticket.id) >= ticket.available"
                  :aria-label="`${$t('event.increase')} ${ticket.type}`"
                  @click="increment(ticket.id, ticket.available)"
                >
                  <Plus class="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Add to cart footer -->
        <div class="mt-5 flex items-center justify-end gap-4">
          <p v-if="hasSelection" class="text-sm text-muted-foreground">
            {{ locale === 'zh-TW' ? `合計 NT$\xa0${selectionTotal.toLocaleString()}` : `Total NT$\xa0${selectionTotal.toLocaleString()}` }}
          </p>
          <UiButton size="lg" :disabled="!hasSelection" @click="addToCart">
            {{ $t('event.addToCart') }}
          </UiButton>
        </div>
      </section>

      <!-- Related events -->
      <section
        v-if="relatedEvents.length > 0"
        class="mt-14"
        aria-labelledby="related-heading"
      >
        <h2 id="related-heading" class="mb-5 text-xl font-semibold">
          {{ $t('event.related') }}
        </h2>
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <EventCard v-for="e in relatedEvents" :key="e.id" :event="e" />
        </div>
      </section>

    </template>
  </div>
</template>
