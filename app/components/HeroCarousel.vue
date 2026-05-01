<script setup lang="ts">
import useEmblaCarousel from 'embla-carousel-vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { Event } from '~/types'

const props = defineProps<{ events: Event[] }>()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

const current = ref(0)
const total = computed(() => props.events.length)
const isHovered = ref(false)

let autoplayTimer: ReturnType<typeof setInterval> | null = null
const reducedMotion = ref(false)

function startAutoplay() {
  if (reducedMotion.value || isHovered.value || total.value <= 1) return
  stopAutoplay()
  autoplayTimer = setInterval(() => emblaApi.value?.scrollNext(), 4500)
}

function stopAutoplay() {
  if (autoplayTimer !== null) {
    clearInterval(autoplayTimer)
    autoplayTimer = null
  }
}

function goPrev() {
  emblaApi.value?.scrollPrev()
}

function goNext() {
  emblaApi.value?.scrollNext()
}

function goTo(index: number) {
  emblaApi.value?.scrollTo(index)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goPrev()
  }
  if (e.key === 'ArrowRight') {
    e.preventDefault()
    goNext()
  }
}

watch(emblaApi, (api) => {
  if (!api) return
  api.on('select', () => {
    current.value = api.selectedScrollSnap()
  })
  startAutoplay()
})

onMounted(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = mq.matches
  mq.addEventListener('change', (e) => {
    reducedMotion.value = e.matches
    if (e.matches) stopAutoplay()
    else startAutoplay()
  })
})

onBeforeUnmount(stopAutoplay)

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr))
}
</script>

<template>
  <section
    v-if="total > 0"
    role="region"
    :aria-label="t('home.hero.carousel')"
    class="relative"
    @keydown="onKeydown"
    @mouseenter="isHovered = true; stopAutoplay()"
    @mouseleave="isHovered = false; startAutoplay()"
    @focusin="stopAutoplay()"
    @focusout="startAutoplay()"
  >
    <div ref="emblaRef" class="overflow-hidden">
      <div class="flex touch-pan-y">
        <div
          v-for="(event, index) in events"
          :key="event.id"
          role="group"
          aria-roledescription="slide"
          :aria-label="`${index + 1} / ${total}`"
          class="relative min-w-0 flex-[0_0_100%]"
        >
          <div
            class="relative h-[50vh] min-h-[300px] max-h-[600px] w-full overflow-hidden"
          >
            <img
              :src="event.coverImage"
              :alt="event.title"
              class="h-full w-full object-cover"
            />
            <div
              class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
            />
          </div>
          <div class="absolute inset-0 flex items-end">
            <div class="container mx-auto px-4 pb-12 sm:px-6 md:pb-16">
              <span
                class="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground"
              >
                {{ $t(`events.categories.${event.category}`) }}
              </span>
              <h2
                class="max-w-2xl text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl"
              >
                {{ event.title }}
              </h2>
              <p class="mt-2 text-sm text-white/80 sm:text-base">
                {{ formatDate(event.date) }} · {{ event.venue }}
              </p>
              <NuxtLink
                :to="localePath(`/events/${event.slug}`)"
                class="mt-4 inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {{ t('home.hero.cta') }}
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button
      v-if="total > 1"
      class="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      :aria-label="t('home.hero.prev')"
      @click="goPrev"
    >
      <ChevronLeft class="h-5 w-5" />
    </button>
    <button
      v-if="total > 1"
      class="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      :aria-label="t('home.hero.next')"
      @click="goNext"
    >
      <ChevronRight class="h-5 w-5" />
    </button>

    <div
      v-if="total > 1"
      class="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5"
      role="tablist"
      :aria-label="t('home.hero.carousel')"
    >
      <button
        v-for="(_, index) in events"
        :key="index"
        role="tab"
        :aria-selected="current === index"
        :aria-label="`${index + 1} / ${total}`"
        class="h-2 rounded-full bg-white/60 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        :class="current === index ? 'w-6 bg-white' : 'w-2'"
        @click="goTo(index)"
      />
    </div>
  </section>
</template>
