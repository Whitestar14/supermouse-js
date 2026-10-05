<script setup lang="ts">
import UiButton from "@components/ui/UiButton.vue";
</script>

<template>
  <section class="relative bg-surface overflow-hidden">
    <!-- Header -->
    <div class="flex border-b border-border h-16 md:h-20 bg-surface">
      <div class="w-20 md:w-24 border-r border-border flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-inverse">04</span>
      </div>
      <div class="flex-1 px-6 md:px-8 flex items-center justify-between">
        <h2 class="text-lg md:text-xl font-bold tracking-tighter text-inverse">CTA</h2>
        <span
          class="mono text-[10px] text-subtle uppercase tracking-widest font-bold hidden sm:inline-block"
          >CallToAction.vue</span
        >
      </div>
    </div>

    <!-- Spotlight Container -->
    <div class="spotlight-container relative min-h-100 md:min-h-125 flex flex-col bg-surface">
      <div class="absolute inset-0 flex flex-col lg:flex-row bg-surface z-10">
        <div class="hidden lg:block w-24 border-r border-border shrink-0" />

        <div
          class="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center items-start lg:items-center lg:flex-row gap-12 lg:gap-20"
        >
          <div class="flex-1 max-w-2xl relative">
            <h2
              class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tighter mb-6 md:mb-8 text-inverse"
            >
              Build your first cursor in five minutes.
            </h2>
            <p class="text-body text-base md:text-lg font-medium leading-relaxed">
              Writing custom cursors doesn't have to be painful or difficult. Not sure where to get
              started? You can start at the very first page or look up the
              <NuxtLink to="/docs/guide/cookbook" class="link">Cookbook</NuxtLink> for some
              inspiration.
            </p>
          </div>

          <div class="shrink-0 w-full lg:w-auto">
            <UiButton to="/docs" size="lg" block class="lg:w-auto">
              <span>Get Started</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                class="size-5"
              >
                <path stroke-linecap="square" stroke-linejoin="miter" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </UiButton>
            <div class="mt-3 mono text-[10px] text-subtle uppercase tracking-widest font-bold">
              pnpm add @supermousejs/core
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
