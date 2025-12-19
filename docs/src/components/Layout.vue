
<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from './Navbar.vue';
import Footer from './Footer.vue';
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const route = useRoute();
let mouse: Supermouse | null = null;

const initCursor = () => {
  if (mouse) return;
  
  mouse = new Supermouse({
    smoothness: 0.15,
    enableTouch: false,
    hideCursor: true,
    ignoreOnNative: true,
    magnet: {
      enabled: true,
      padding: 15,
      strength: 0.3,
      stickStrength: 1.0
    }
  });

  mouse
    .use(Dot({ 
      size: 6, 
      color: 'black' 
    }))
    .use(Ring({ 
      size: 24, 
      color: '#a1a1aa', // zinc-400
      enableSkew: true
    }));
};

const destroyCursor = () => {
  if (mouse) {
    mouse.destroy();
    mouse = null;
  }
};

onMounted(() => {
  // Only init if not on playground initially
  if (route.name !== 'PLAYGROUND') {
    initCursor();
  }
});

onUnmounted(() => {
  destroyCursor();
});

// Watch route changes to toggle default cursor
watch(
  () => route.name,
  (newPage) => {
    if (newPage === 'PLAYGROUND') {
      destroyCursor();
    } else {
      initCursor();
    }
  }
);
</script>

<template>
  <div class="relative min-h-screen bg-white">
    <!-- Main Container -->
    <div class="relative mx-auto max-w-[1440px] bg-white min-h-screen border-x border-zinc-200 shadow-2xl shadow-zinc-100 flex flex-col">
      <Navbar />
      <main class="relative z-10 flex-1">
        <slot />
      </main>
      <Footer />
    </div>
  </div>
</template>
