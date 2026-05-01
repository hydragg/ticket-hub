<template>
  <div class="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
    <UiSkeleton class="aspect-video w-full rounded-none" />
    <div class="flex flex-1 flex-col gap-2 p-4">
      <UiSkeleton class="h-5 w-full" />
      <UiSkeleton class="h-5 w-3/4" />
      <UiSkeleton class="mt-1 h-4 w-1/2" />
      <UiSkeleton class="h-4 w-2/3" />
      <div class="mt-auto flex items-center justify-between pt-3">
        <UiSkeleton class="h-4 w-8" />
        <UiSkeleton class="h-5 w-24" />
      </div>
    </div>
  </div>
</template>
