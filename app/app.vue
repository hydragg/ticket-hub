<script setup lang="ts">
import { Toaster } from '~/components/ui/sonner'

useSeoMeta({
  titleTemplate: title => (title ? `${title} | TicketHub` : 'TicketHub'),
  ogSiteName: 'TicketHub',
  description: '購買演唱會、喜劇秀、劇場門票',
  ogDescription: '購買演唱會、喜劇秀、劇場門票',
})
</script>

<template>
  <NuxtLoadingIndicator color="var(--color-primary)" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster rich-colors position="top-right" />
</template>
