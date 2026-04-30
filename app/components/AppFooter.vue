<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const year = new Date().getFullYear()

const footerLinks = computed(() => [
  { label: t('footer.links.about'), to: localePath('/about') },
  { label: t('footer.links.privacy'), to: localePath('/privacy') },
  { label: t('footer.links.terms'), to: localePath('/terms') },
  { label: t('footer.links.contact'), to: localePath('/contact') },
])
</script>

<template>
  <footer class="border-t bg-muted/30 py-8">
    <div class="container mx-auto px-4">
      <div class="flex flex-col items-center justify-between gap-4 md:flex-row">
        <p class="text-sm text-muted-foreground">
          {{ t('footer.copyright', { year }) }}
        </p>
        <nav class="flex flex-wrap justify-center gap-x-6 gap-y-2" :aria-label="'Footer'">
          <NuxtLink
            v-for="link in footerLinks"
            :key="link.to"
            :to="link.to"
            class="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
    </div>
  </footer>
</template>
