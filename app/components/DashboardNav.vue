<script setup lang="ts">
import { UserIcon, PackageIcon, LockIcon } from 'lucide-vue-next'

const { t } = useI18n()
const localePath = useLocalePath()
const { user } = useAuth()

const navLinks = computed(() => [
  { label: t('dashboard.profile'), to: localePath('/dashboard/profile'), icon: UserIcon },
  { label: t('dashboard.orders'), to: localePath('/dashboard/orders'), icon: PackageIcon },
  { label: t('dashboard.password'), to: localePath('/dashboard/password'), icon: LockIcon },
])

const initials = computed(() => {
  const name = user.value?.name ?? ''
  return (
    name
      .split(' ')
      .map(n => n[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
})
</script>

<template>
  <div>
    <!-- User avatar + name (desktop) -->
    <div class="mb-6 hidden items-center gap-3 px-2 lg:flex">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
        aria-hidden="true"
      >
        {{ initials }}
      </div>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold">{{ user?.name }}</p>
        <p class="truncate text-xs text-muted-foreground">{{ user?.email }}</p>
      </div>
    </div>

    <!-- Nav -->
    <nav :aria-label="$t('dashboard.nav')">
      <!-- Mobile: horizontal scroll -->
      <div class="flex gap-1 overflow-x-auto pb-1 lg:hidden">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          active-class="bg-accent !text-foreground"
        >
          <component :is="link.icon" class="h-4 w-4" aria-hidden="true" />
          {{ link.label }}
        </NuxtLink>
      </div>

      <!-- Desktop: vertical -->
      <div class="hidden flex-col gap-0.5 lg:flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          active-class="bg-accent !text-foreground"
        >
          <component :is="link.icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
          {{ link.label }}
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
