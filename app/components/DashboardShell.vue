<template>
  <div class="container mx-auto max-w-5xl px-4 py-8">
    <div class="flex flex-col gap-8 lg:flex-row lg:gap-12">
      <aside class="shrink-0 lg:w-52">
        <DashboardNav />
      </aside>
      <div class="min-w-0 flex-1">
        <slot />
      </div>
    </div>
  </div>
</template>
