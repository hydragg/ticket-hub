<script setup lang="ts">
interface Step {
  key: string
  label: string
}

defineProps<{
  steps: Step[]
  current: number
}>()
</script>

<template>
  <nav :aria-label="$t('checkout.stepsNav')">
    <ol class="flex items-start">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="flex flex-1 flex-col items-center"
        :aria-current="index + 1 === current ? 'step' : undefined"
      >
        <div class="flex w-full items-center">
          <!-- Left connector -->
          <div
            class="h-0.5 flex-1 transition-colors duration-300"
            :class="index === 0 ? 'invisible' : index < current ? 'bg-primary' : 'bg-border'"
          />
          <!-- Step circle -->
          <div
            class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300"
            :class="[
              index + 1 < current
                ? 'bg-primary text-primary-foreground'
                : index + 1 === current
                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground',
            ]"
            aria-hidden="true"
          >
            <svg
              v-if="index + 1 < current"
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="3"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <!-- Right connector -->
          <div
            class="h-0.5 flex-1 transition-colors duration-300"
            :class="index === steps.length - 1 ? 'invisible' : index + 1 < current ? 'bg-primary' : 'bg-border'"
          />
        </div>
        <!-- Label -->
        <span
          class="mt-2 text-xs font-medium transition-colors"
          :class="
            index + 1 === current
              ? 'text-primary'
              : index + 1 < current
                ? 'text-foreground'
                : 'text-muted-foreground'
          "
        >
          {{ step.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
