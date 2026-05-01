<script setup lang="ts">
import { Music, Smile, Sparkles, LayoutGrid } from 'lucide-vue-next'

const localePath = useLocalePath()

const categories = [
  {
    key: 'concert',
    icon: Music,
    href: '/events?category=concert',
    colorClass:
      'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 dark:text-blue-400',
  },
  {
    key: 'comedy',
    icon: Smile,
    href: '/events?category=comedy',
    colorClass:
      'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 dark:text-yellow-400',
  },
  {
    key: 'theater',
    icon: Sparkles,
    href: '/events?category=theater',
    colorClass:
      'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 dark:text-purple-400',
  },
  {
    key: 'all',
    icon: LayoutGrid,
    href: '/events',
    colorClass:
      'bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400',
  },
] as const
</script>

<template>
  <section class="container mx-auto px-4 py-10 sm:px-6">
    <h2 class="mb-6 text-2xl font-bold">{{ $t('home.categories.title') }}</h2>
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <NuxtLink
        v-for="cat in categories"
        :key="cat.key"
        :to="localePath(cat.href)"
        class="flex flex-col items-center justify-center gap-3 rounded-xl p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        :class="cat.colorClass"
      >
        <component :is="cat.icon" class="h-8 w-8" aria-hidden="true" />
        <span class="font-semibold">{{ $t(`home.categories.${cat.key}`) }}</span>
      </NuxtLink>
    </div>
  </section>
</template>
