
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import gsap from 'gsap';

const container = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
let ctx: gsap.Context;

onMounted(() => {
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });
    
    // Initial State
    gsap.set(cursorRef.value, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.5 });
    
    // Define Nodes (selectors)
    const nodes = ['.node-1', '.node-2', '.node-3'];
    
    // Entrance
    tl.to(cursorRef.value, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' });

    // Loop through nodes
    nodes.forEach((node) => {
      // 1. Move to Node
      tl.to(cursorRef.value, {
        top: gsap.getProperty(node, 'top'),
        left: gsap.getProperty(node, 'left'),
        duration: 0.8,
        ease: 'power3.inOut'
      });

      // 2. Click Animation (Cursor scales down, Node scales up)
      tl.to(cursorRef.value, { scale: 0.8, duration: 0.1, ease: 'power1.out' })
        .to(node, { 
            scale: 1.05, 
            backgroundColor: '#000', 
            borderColor: '#000', 
            duration: 0.1 
        }, '<');

      // 3. Ripple Effect (Box Shadow Expansion) - Reduced Spread
      tl.fromTo(node, 
        { boxShadow: '0 0 0 0px rgba(0,0,0,0.2)' },
        { 
            boxShadow: '0 0 0 10px rgba(0,0,0,0)', // Reduced from 40px
            duration: 0.5, // Slightly faster
            ease: 'power1.out',
            clearProps: 'boxShadow' // Clean up for next loop
        }, 
        '<' // Start with click
      );

      // 4. Release (Cursor scales up, Node relaxes)
      tl.to(cursorRef.value, { scale: 1, duration: 0.2, ease: 'back.out(2)' }, '+=0.1')
        .to(node, { scale: 1, backgroundColor: '#FFF', borderColor: '#e4e4e7', duration: 0.4 }, '<');
      
      // Pause briefly
      tl.to({}, { duration: 0.3 });
    });

    // Exit to center
    tl.to(cursorRef.value, { top: '50%', left: '50%', duration: 0.6, ease: 'power2.inOut' })
      .to(cursorRef.value, { opacity: 0, scale: 0.5, duration: 0.4 }, '+=0.2');

  }, container.value!); // Scope to container
});

onUnmounted(() => {
  ctx.revert();
});
</script>

<template>
  <section class="relative">
     <!-- Header -->
     <div class="flex border-b border-zinc-200 h-16 md:h-20 bg-white">
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-zinc-900">02</span>
      </div>
      <div class="flex-1 px-6 md:px-8 flex items-center justify-between">
         <h2 class="text-lg md:text-xl font-bold tracking-tighter text-zinc-900">Our Mission</h2>
         <span class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold hidden sm:inline-block">manifesto.md</span>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row border-b border-zinc-200 relative overflow-hidden">
       <!-- Sidebar Gutter -->
       <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0"></div>

       <!-- Text Content -->
       <div class="flex-1 px-6 py-12 md:p-16 lg:p-24 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white relative z-10">
          <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 mb-8 text-pretty leading-[1.1]">The Mission</h2>
          <div class="prose prose-lg text-zinc-600 font-medium leading-relaxed max-w-2xl text-pretty">
            <p class="mb-6">
              We are building a unified high-performance toolchain for user interaction: including 
              <span class="text-zinc-900 font-bold"> input normalization</span>, 
              <span class="text-zinc-900 font-bold"> physics-based smoothing</span>, and a 
              <span class="text-zinc-900 font-bold"> modular rendering stage</span>.
            </p>
            <p>
              Our mission is to make the next generation of web interfaces more organic and expressive than ever before, without the performance cost of traditional animation libraries.
            </p>
          </div>
       </div>

       <!-- Graphic Content - Simulation Stage -->
       <div 
          ref="container"
          class="w-full lg:w-[480px] shrink-0 bg-zinc-50/50 relative min-h-[320px] md:min-h-[400px] flex overflow-hidden border-t border-zinc-200 lg:border-t-0"
        >
          <div class="absolute inset-0 grid-bg opacity-30 pointer-events-none"></div>
          
          <!-- Simulation Nodes -->
          <div class="node-1 absolute top-[30%] left-[20%] w-20 h-20 border border-zinc-200 bg-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 rounded-sm"></div>
          
          <!-- Node 2: Changed from rounded-full to rounded-sm -->
          <div class="node-2 absolute top-[20%] left-[80%] w-24 h-24 border border-zinc-200 bg-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 rounded-sm"></div>
          
          <div class="node-3 absolute top-[70%] left-[50%] w-48 h-16 border border-zinc-200 bg-white shadow-sm transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-sm">
             <div class="w-24 h-1 bg-zinc-100"></div>
          </div>

          <!-- The Cursor -->
          <div 
            ref="cursorRef"
            class="absolute w-6 h-6 z-20 pointer-events-none drop-shadow-xl"
          >
             <svg viewBox="0 0 24 24" fill="none" stroke="none" class="w-full h-full text-black">
                <path d="M5.5 3.5L11.5 19.5L14 12.5L21 10L5.5 3.5Z" fill="currentColor" />
             </svg>
          </div>

          <div class="absolute bottom-6 left-6 right-6 flex justify-between items-end">
             <div class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                Simulation Running
             </div>
             <div class="flex gap-1">
                <div class="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <div class="w-1 h-1 bg-zinc-300 rounded-full"></div>
             </div>
          </div>
       </div>
    </div>
  </section>
</template>
