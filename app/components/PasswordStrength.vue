<script setup lang="ts">
const props = defineProps<{ password: string }>()
const { t } = useI18n()

const score = computed(() => {
  if (!props.password) return 0
  let s = 0
  if (props.password.length >= 8) s++
  if (/[A-Z]/.test(props.password)) s++
  if (/[0-9]/.test(props.password)) s++
  if (/[^A-Za-z0-9]/.test(props.password)) s++
  return s
})

const label = computed(() => {
  if (score.value <= 1) return t('auth.passwordStrength.weak')
  if (score.value === 2) return t('auth.passwordStrength.fair')
  if (score.value === 3) return t('auth.passwordStrength.good')
  return t('auth.passwordStrength.strong')
})

const bars = computed(() =>
  [1, 2, 3, 4].map(n => ({
    active: score.value >= n,
    color:
      score.value <= 1 ? 'bg-destructive'
      : score.value === 2 ? 'bg-yellow-500'
      : score.value === 3 ? 'bg-blue-500'
      : 'bg-green-500',
  })),
)
</script>

<template>
  <div v-if="password" class="mt-2 space-y-1" aria-live="polite">
    <div class="flex gap-1" role="img" :aria-label="`${t('auth.passwordStrength.label')}: ${label}`">
      <div
        v-for="(bar, i) in bars"
        :key="i"
        class="h-1.5 flex-1 rounded-full transition-all duration-300"
        :class="bar.active ? bar.color : 'bg-muted'"
      />
    </div>
    <p class="text-xs text-muted-foreground">
      {{ t('auth.passwordStrength.label') }}：<span :class="score <= 1 ? 'text-destructive' : score === 2 ? 'text-yellow-500' : score === 3 ? 'text-blue-500' : 'text-green-500'">{{ label }}</span>
    </p>
  </div>
</template>
