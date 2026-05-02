<script setup lang="ts">
import { Filter, X } from 'lucide-vue-next'
import type { EventCategory } from '~/types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()

const PRICE_MAX = 8000
const PRICE_STEP = 200

const ALL = 'all'
const category = ref<string>((route.query.category as string) || ALL)
const city = ref<string>((route.query.city as string) || ALL)
const dateFrom = ref<string>((route.query.dateFrom as string) ?? '')
const dateTo = ref<string>((route.query.dateTo as string) ?? '')
const priceRange = ref<[number, number]>([
  Number(route.query.priceMin ?? 0),
  Number(route.query.priceMax ?? PRICE_MAX),
])

const mobileOpen = ref(false)

const hasActiveFilters = computed(
  () =>
    !!(
      (category.value && category.value !== ALL) ||
      (city.value && city.value !== ALL) ||
      dateFrom.value ||
      dateTo.value ||
      priceRange.value[0] > 0 ||
      priceRange.value[1] < PRICE_MAX
    ),
)

const categories: Array<{ value: EventCategory; label: string }> = [
  { value: 'concert', label: t('events.categories.concert') },
  { value: 'comedy', label: t('events.categories.comedy') },
  { value: 'theater', label: t('events.categories.theater') },
  { value: 'other', label: t('events.categories.other') },
]

const cities = ['台北', '台中', '高雄']

function buildQuery() {
  const q: Record<string, string> = {}
  if (category.value && category.value !== ALL) q.category = category.value
  if (city.value && city.value !== ALL) q.city = city.value
  if (dateFrom.value) q.dateFrom = dateFrom.value
  if (dateTo.value) q.dateTo = dateTo.value
  if (priceRange.value[0] > 0) q.priceMin = String(priceRange.value[0])
  if (priceRange.value[1] < PRICE_MAX) q.priceMax = String(priceRange.value[1])
  return q
}

function applyFilters() {
  if (route.path !== localePath('/events')) return
  router.push({ query: buildQuery() })
}

function reset() {
  category.value = ALL
  city.value = ALL
  dateFrom.value = ''
  dateTo.value = ''
  priceRange.value = [0, PRICE_MAX]
  router.push({ query: {} })
}

// Select changes apply immediately
watch([category, city], applyFilters)

// Slider applies with debounce to avoid spamming navigation while dragging
const applyPrice = useDebounceFn(applyFilters, 400)
watch(priceRange, applyPrice, { deep: true })

const inputClass =
  'h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full'
</script>

<template>
  <div>
    <!-- Mobile toggle -->
    <div class="mb-3 flex items-center gap-2 md:hidden">
      <UiButton
        variant="outline"
        size="sm"
        class="gap-1.5"
        :aria-expanded="mobileOpen"
        @click="mobileOpen = !mobileOpen"
      >
        <Filter class="h-4 w-4" aria-hidden="true" />
        {{ t('events.filter.title') }}
        <UiBadge v-if="hasActiveFilters" variant="secondary" class="ml-1 h-5 px-1.5">
          ●
        </UiBadge>
      </UiButton>
      <UiButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        class="gap-1 text-muted-foreground"
        @click="reset"
      >
        <X class="h-3.5 w-3.5" />
        {{ t('events.filter.reset') }}
      </UiButton>
    </div>

    <!-- Filter form — always visible on desktop, toggleable on mobile -->
    <div
      :class="[
        'flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end',
        mobileOpen ? 'flex' : 'hidden md:flex',
      ]"
      role="search"
      :aria-label="t('events.filter.title')"
    >
      <!-- Category -->
      <div class="flex flex-col gap-1 md:w-40">
        <label class="text-xs font-medium text-muted-foreground">
          {{ t('events.filter.category') }}
        </label>
        <UiSelect v-model="category">
          <UiSelectTrigger class="h-9 text-sm">
            <UiSelectValue :placeholder="t('events.allCategories')" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="all">{{ t('events.allCategories') }}</UiSelectItem>
            <UiSelectItem
              v-for="cat in categories"
              :key="cat.value"
              :value="cat.value"
            >
              {{ cat.label }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>

      <!-- City -->
      <div class="flex flex-col gap-1 md:w-36">
        <label class="text-xs font-medium text-muted-foreground">
          {{ t('events.filter.city') }}
        </label>
        <UiSelect v-model="city">
          <UiSelectTrigger class="h-9 text-sm">
            <UiSelectValue :placeholder="t('events.allCities')" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="all">{{ t('events.allCities') }}</UiSelectItem>
            <UiSelectItem v-for="c in cities" :key="c" :value="c">
              {{ c }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>

      <!-- Date From -->
      <div class="flex flex-col gap-1 md:w-40">
        <label class="text-xs font-medium text-muted-foreground" for="filter-date-from">
          {{ t('events.filter.dateFrom') }}
        </label>
        <input
          id="filter-date-from"
          v-model="dateFrom"
          type="date"
          :class="inputClass"
          @change="applyFilters"
        >
      </div>

      <!-- Date To -->
      <div class="flex flex-col gap-1 md:w-40">
        <label class="text-xs font-medium text-muted-foreground" for="filter-date-to">
          {{ t('events.filter.dateTo') }}
        </label>
        <input
          id="filter-date-to"
          v-model="dateTo"
          type="date"
          :class="inputClass"
          @change="applyFilters"
        >
      </div>

      <!-- Price Range -->
      <div class="flex flex-col gap-2 md:w-52">
        <label class="text-xs font-medium text-muted-foreground">
          {{ t('events.filter.price') }}
          <span class="ml-1 text-foreground">
            {{
              t('events.filter.priceRange', {
                min: priceRange[0].toLocaleString(),
                max: priceRange[1].toLocaleString(),
              })
            }}
          </span>
        </label>
        <UiSlider
          v-model="priceRange"
          :min="0"
          :max="PRICE_MAX"
          :step="PRICE_STEP"
          class="mt-1"
          :aria-label="t('events.filter.price')"
        />
      </div>

      <!-- Reset (desktop) -->
      <UiButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="sm"
        class="hidden gap-1 self-end text-muted-foreground md:flex"
        @click="reset"
      >
        <X class="h-3.5 w-3.5" aria-hidden="true" />
        {{ t('events.filter.reset') }}
      </UiButton>
    </div>
  </div>
</template>
