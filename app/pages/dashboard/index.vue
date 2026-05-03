<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const localePath = useLocalePath()
await navigateTo(localePath('/dashboard/profile'), { replace: true })
</script>

<template>
  <div />
</template>
