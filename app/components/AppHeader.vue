<script setup lang="ts">
import { MenuIcon, XIcon, TicketIcon, GlobeIcon } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const { isAuthenticated, user, logout } = useAuth()

const mobileOpen = ref(false)

const navLinks = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.events'), to: localePath('/events') },
])

const otherLocale = computed(() => (locale.value === 'zh-TW' ? 'en' : 'zh-TW'))
const otherLocaleLabel = computed(() => (locale.value === 'zh-TW' ? 'EN' : '中文'))

async function handleLogout() {
  mobileOpen.value = false
  await logout()
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <div class="container mx-auto flex h-16 items-center gap-6 px-4">
      <!-- Logo -->
      <NuxtLink
        :to="localePath('/')"
        class="flex shrink-0 items-center gap-2 font-bold text-lg"
      >
        <TicketIcon class="h-5 w-5 text-primary" aria-hidden="true" />
        TicketHub
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden items-center gap-6 md:flex" :aria-label="t('nav.home')">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          active-class="!text-foreground"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Right side -->
      <div class="ml-auto flex items-center gap-2">
        <!-- Language toggle -->
        <NuxtLink
          :to="switchLocalePath(otherLocale)"
          class="hidden items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex"
          :aria-label="`Switch to ${otherLocaleLabel}`"
        >
          <GlobeIcon class="h-4 w-4" aria-hidden="true" />
          {{ otherLocaleLabel }}
        </NuxtLink>

        <!-- Desktop: authenticated -->
        <template v-if="isAuthenticated">
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="sm" class="hidden md:inline-flex">
                {{ user?.name }}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-48">
              <DropdownMenuItem as-child>
                <NuxtLink :to="localePath('/dashboard/profile')">
                  {{ t('nav.profile') }}
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem as-child>
                <NuxtLink :to="localePath('/dashboard/orders')">
                  {{ t('nav.orders') }}
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-destructive focus:text-destructive"
                @click="handleLogout"
              >
                {{ t('nav.logout') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </template>

        <!-- Desktop: guest -->
        <template v-else>
          <Button variant="ghost" size="sm" as-child class="hidden md:inline-flex">
            <NuxtLink :to="localePath('/auth/login')">{{ t('nav.login') }}</NuxtLink>
          </Button>
          <Button size="sm" as-child class="hidden md:inline-flex">
            <NuxtLink :to="localePath('/auth/register')">{{ t('nav.register') }}</NuxtLink>
          </Button>
        </template>

        <!-- Mobile hamburger -->
        <Sheet v-model:open="mobileOpen">
          <SheetTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="md:hidden"
              :aria-label="t('nav.openMenu')"
            >
              <MenuIcon class="h-5 w-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="flex w-72 flex-col">
            <SheetHeader>
              <SheetTitle class="flex items-center gap-2 text-left">
                <TicketIcon class="h-5 w-5 text-primary" aria-hidden="true" />
                TicketHub
              </SheetTitle>
            </SheetHeader>

            <nav class="mt-6 flex flex-col gap-1" :aria-label="t('nav.home')">
              <NuxtLink
                v-for="link in navLinks"
                :key="link.to"
                :to="link.to"
                class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                active-class="bg-accent !text-foreground"
                @click="mobileOpen = false"
              >
                {{ link.label }}
              </NuxtLink>
            </nav>

            <Separator class="my-4" />

            <!-- Mobile: authenticated -->
            <template v-if="isAuthenticated">
              <div class="flex flex-col gap-1">
                <NuxtLink
                  :to="localePath('/dashboard/profile')"
                  class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  @click="mobileOpen = false"
                >
                  {{ t('nav.profile') }}
                </NuxtLink>
                <NuxtLink
                  :to="localePath('/dashboard/orders')"
                  class="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  @click="mobileOpen = false"
                >
                  {{ t('nav.orders') }}
                </NuxtLink>
              </div>
              <Separator class="my-4" />
              <Button variant="ghost" class="w-full justify-start text-destructive hover:text-destructive" @click="handleLogout">
                {{ t('nav.logout') }}
              </Button>
            </template>

            <!-- Mobile: guest -->
            <template v-else>
              <div class="flex flex-col gap-2">
                <Button variant="outline" as-child>
                  <NuxtLink :to="localePath('/auth/login')" @click="mobileOpen = false">
                    {{ t('nav.login') }}
                  </NuxtLink>
                </Button>
                <Button as-child>
                  <NuxtLink :to="localePath('/auth/register')" @click="mobileOpen = false">
                    {{ t('nav.register') }}
                  </NuxtLink>
                </Button>
              </div>
            </template>

            <!-- Mobile: language toggle -->
            <div class="mt-auto">
              <NuxtLink
                :to="switchLocalePath(otherLocale)"
                class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                @click="mobileOpen = false"
              >
                <GlobeIcon class="h-4 w-4" aria-hidden="true" />
                {{ otherLocaleLabel }}
              </NuxtLink>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  </header>
</template>
