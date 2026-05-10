<script setup lang="ts">
import { Music, Smile, Sparkles, LayoutGrid, ChevronRight } from 'lucide-vue-next'

const localePath = useLocalePath()

const categories = [
  { key: 'concert', icon: Music, href: '/events?category=concert' },
  { key: 'comedy', icon: Smile, href: '/events?category=comedy' },
  { key: 'theater', icon: Sparkles, href: '/events?category=theater' },
  { key: 'all', icon: LayoutGrid, href: '/events' },
] as const
</script>

<template>
  <section class="container mx-auto px-4 py-10 sm:px-6">
    <h2 class="mb-6 text-2xl font-bold">{{ $t('home.categories.title') }}</h2>
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="cat in categories"
        :key="cat.key"
        :to="localePath(cat.href)"
        class="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div class="shrink-0 rounded-lg bg-muted p-3 transition-colors group-hover:bg-primary/10">
          <component :is="cat.icon" class="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-card-foreground">{{ $t(`home.categories.${cat.key}`) }}</p>
          <p class="mt-0.5 truncate text-sm text-muted-foreground">{{ $t(`home.categories.${cat.key}Desc`) }}</p>
        </div>
        <ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
      </NuxtLink>
    </div>
  </section>
</template>
