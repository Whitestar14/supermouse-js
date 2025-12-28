
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { math } from '@supermousejs/utils';

const container = ref<HTMLElement | null>(null);

// Physics state
const mouse = ref({ x: 0, y: 0 });
const pos = ref({ x: 0, y: 0 });
const currentRadius = ref(0);
const isHover = ref(false);

let rafId = 0;

const updateMouse = (e: MouseEvent) => {
  if (container.value) {
    const rect = container.value.getBoundingClientRect();
    mouse.value = { 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    };
  }
};

const loop = () => {
  const smoothness = 0.1;
  
  // Smooth position
  pos.value.x = math.lerp(pos.value.x, mouse.value.x, smoothness);
  pos.value.y = math.lerp(pos.value.y, mouse.value.y, smoothness);
  
  // Smooth size (Expansion/Contraction)
  const targetR = isHover.value ? 400 : 0;
  currentRadius.value = math.lerp(currentRadius.value, targetR, 0.08);

  rafId = requestAnimationFrame(loop);
};

onMounted(() => {
  rafId = requestAnimationFrame(loop);
});

onUnmounted(() => {
  cancelAnimationFrame(rafId);
});
</script>

<template>
  <section class="relative bg-white overflow-hidden">
    <!-- Header -->
    <div class="flex border-t border-b border-zinc-200 h-16 md:h-20 bg-white relative z-30">
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-zinc-900">04</span>
      </div>
      <div class="flex-1 px-6 md:px-8 flex items-center">
           <span class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">CallToAction.vue</span>
      </div>
    </div>

    <!-- Main Interactive Container -->
    <div 
      ref="container"
      class="relative min-h-[400px] md:min-h-[500px] flex flex-col group bg-white cursor-none"
      @mousemove="updateMouse"
      @mouseenter="isHover = true"
      @mouseleave="isHover = false"
    >
      <!-- Content Layer (Black Text on White) -->
      <div class="absolute inset-0 flex flex-col lg:flex-row bg-white z-10">
          <!-- Gutter -->
          <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-zinc-50/50"></div>
          
          <!-- Content -->
          <div class="flex-1 px-6 py-12 md:p-16 lg:p-24 flex flex-col justify-center items-start lg:items-center lg:flex-row gap-10 lg:gap-20">
             <div class="flex-1 max-w-2xl relative z-10">
                <div class="absolute inset-0 grid-bg opacity-30 pointer-events-none mix-blend-multiply"></div>
                <h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tighter mb-6 md:mb-8 text-black relative z-10">
                  Ready to upgrade your interaction game?
                </h2>
                <p class="text-zinc-600 text-base sm:text-lg md:text-xl font-medium leading-relaxed relative z-10">
                  Supermouse v2 is designed to vanish into your workflow while making your UI stand out.
                </p>
             </div>
             
             <div class="relative z-10 shrink-0 w-full lg:w-auto">
                 <router-link to="/docs" class="inline-flex w-full lg:w-auto items-center justify-center h-14 md:h-16 px-8 md:px-10 bg-black text-white font-bold text-base md:text-lg tracking-tight hover:bg-zinc-800 transition-colors">
                   Get Started
                 </router-link>
                 <div class="mt-4 mono text-[10px] text-zinc-400 uppercase tracking-widest text-center lg:text-left">
                    Available on npm
                 </div>
             </div>
          </div>
      </div>

      <!-- Spotlight Layer -->
      <!-- We use a WHITE circle with mix-blend-mode: difference.
           White Background + White Circle (Difference) = Black
           Black Text + White Circle (Difference) = White
      -->
      <div 
        class="absolute top-0 left-0 pointer-events-none z-50 mix-blend-difference will-change-transform hidden md:block"
        :style="{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
        }"
      >
        <div 
          class="bg-white rounded-full will-change-transform"
          :style="{
            width: `${currentRadius * 2}px`,
            height: `${currentRadius * 2}px`,
            transform: `translate(-50%, -50%)`
          }"
        ></div>
      </div>

    </div>
  </section>
</template>
