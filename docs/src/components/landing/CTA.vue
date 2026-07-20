<template>
  <section class="relative bg-white overflow-hidden">
    <!-- Header -->
    <div class="flex border-b border-zinc-200 h-16 md:h-20 bg-white">
      <div class="w-20 md:w-24 border-r border-zinc-200 flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-zinc-900">04</span>
      </div>
      <div class="flex-1 px-6 md:px-8 flex items-center justify-between">
        <h2 class="text-lg md:text-xl font-bold tracking-tighter text-zinc-900">CTA</h2>
        <span
          class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold hidden sm:inline-block"
          >CallToAction.vue</span
        >
      </div>
    </div>

    <!-- Spotlight Container -->
    <div class="spotlight-container relative min-h-[400px] md:min-h-[500px] flex flex-col bg-white">
      <div class="absolute inset-0 flex flex-col lg:flex-row bg-white z-10">
        <div class="hidden lg:block w-24 border-r border-zinc-200 shrink-0" />

        <div
          class="flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center items-start lg:items-center lg:flex-row gap-12 lg:gap-20"
        >
          <div class="flex-1 max-w-2xl relative">
            <h2
              class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tighter mb-6 md:mb-8 text-black"
            >
              Cursor physics, solved.
            </h2>
            <p class="text-zinc-600 text-base md:text-lg font-medium leading-relaxed">
              3kb runtime. Plugin architecture. Ships with spring physics, hover detection, and
              accessibility built-in.
            </p>
          </div>

          <div class="shrink-0 w-full lg:w-auto">
            <router-link
              to="/docs"
              class="inline-flex w-full lg:w-auto items-center justify-center h-14 md:h-16 px-8 md:px-12 bg-black text-white font-bold text-base md:text-lg tracking-tight hover:bg-zinc-800 transition-colors gap-3"
            >
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
            </router-link>
            <div class="mt-3 mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              pnpm add @supermousejs/core
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
