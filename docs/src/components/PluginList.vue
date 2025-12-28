
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import gsap from 'gsap';

const container = ref<HTMLElement | null>(null);
const cursorRef = ref<HTMLElement | null>(null);
const moduleRef = ref<HTMLElement | null>(null);
const coreRef = ref<HTMLElement | null>(null);
const renderRef = ref<HTMLElement | null>(null);

let ctx: gsap.Context;

onMounted(() => {
  ctx = gsap.context(() => {
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 1 });

    // Initial Positions
    gsap.set(moduleRef.value, { top: '75%', left: '25%', opacity: 1, scale: 1, backgroundColor: '#18181b', color: '#fff', borderColor: '#18181b', boxShadow: 'none' });
    gsap.set(cursorRef.value, { top: '80%', left: '80%', opacity: 0, scale: 1 });
    gsap.set('.slot-target', { borderColor: '#e4e4e7', backgroundColor: 'transparent' });
    gsap.set([coreRef.value, renderRef.value], { borderColor: '#e4e4e7', color: '#a1a1aa', backgroundColor: '#ffffff', scale: 1 });
    gsap.set('.pluginDot', { backgroundColor: '#fbbf24'} );

    // 1. Cursor Enters
    tl.to(cursorRef.value, { opacity: 1, top: '78%', left: '30%', duration: 0.6, ease: 'power2.out' })
    
    // 2. Grabs Module
    .to(cursorRef.value, { scale: 0.8, duration: 0.1 })
    .to(moduleRef.value, { scale: 1.05, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', duration: 0.1 }, '<')
    
    // 3. Drags to Slot
    .to([cursorRef.value, moduleRef.value], { 
      top: '50%', 
      left: '50%', 
      duration: 0.8, 
      ease: 'power3.inOut' 
    })
    
    // 4. Release & Snap
    .to(cursorRef.value, { scale: 1, duration: 0.15 })
    .to(moduleRef.value, { scale: 1, boxShadow: 'none', duration: 0.15 }, '<')
    
    // 4.5 Light up effect
    .to('.pluginDot', { backgroundColor: '#34d399' } )
    // 5. Connect Effect
    .to([coreRef.value, moduleRef.value, renderRef.value], {
        borderColor: '#000000',
        color: '#000000',
        backgroundColor: '#ffffff',
        scale: 1.01,
        duration: 0.1,
        stagger: 0.08,
        ease: 'power1.out'
    })
    .to('.slot-target', { borderColor: 'transparent', duration: 0.1 }, '-=0.2')

    // 6. Cursor Leaves
    .to(cursorRef.value, { top: '20%', left: '80%', opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.2')

    // 7. Reset Sequence
    .to(moduleRef.value, { opacity: 0, duration: 0.3, delay: 0.5 })
    .to([coreRef.value, renderRef.value], {
        borderColor: '#e4e4e7',
        color: '#a1a1aa',
        backgroundColor: '#ffffff',
        scale: 1,
        duration: 0.3
    }, '<');

  }, container.value!);
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
        <span class="mono text-lg font-bold text-zinc-900">01</span>
      </div>
      <div class="flex-1 px-6 md:px-8 flex items-center justify-between">
         <h2 class="text-lg md:text-xl font-bold tracking-tighter text-zinc-900">Ecosystem</h2>
         <span class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold hidden sm:inline-block">plugins.json</span>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row border-b border-zinc-200">
       <!-- Sidebar Gutter -->
       <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-zinc-50/30"></div>
       
       <!-- Content Container -->
       <div class="flex-1 flex flex-col lg:flex-row">
          
          <!-- Text Block -->
          <div class="flex-1 px-6 py-12 md:p-16 lg:p-24 bg-white relative z-10">
             <div class="max-w-2xl">
                <h3 class="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 mb-6 md:mb-8 leading-[1.05]">
                    Plugins are first-class citizens.
                </h3>
                <p class="text-base sm:text-lg text-zinc-600 font-medium leading-relaxed mb-8 text-pretty">
                    Supermouse isn't a monolith. It's a tiny kernel that coordinates independent modules. 
                    From the <span class="text-black font-bold">Dot</span> cursor to the <span class="text-black font-bold">Magnetic</span> effect, everything is a plugin.
                </p>
                <div class="flex flex-col sm:flex-row gap-4">
                    <router-link to="/docs/advanced/authoring" class="inline-flex h-12 items-center justify-center px-6 bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors">
                        Write a Plugin
                    </router-link>
                    <router-link to="/docs/plugins/dot" class="inline-flex h-12 items-center justify-center px-6 border border-zinc-200 text-zinc-900 font-bold text-sm hover:bg-zinc-50 transition-colors">
                        Browse Ecosystem
                    </router-link>
                </div>
             </div>
          </div>

          <!-- Graphic Block - Modular Stack Simulation -->
          <div 
            ref="container"
            class="w-full lg:w-[480px] shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 bg-zinc-50/50 relative min-h-[320px] md:min-h-[400px] flex overflow-hidden"
          >
              <div class="absolute inset-0 grid-bg opacity-30 pointer-events-none"></div>
              
              <!-- The Stack -->
              <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 w-48">
                  <div ref="coreRef" class="stack-item h-12 w-full bg-white border border-zinc-200 shadow-sm flex items-center px-4 relative z-10 transition-colors">
                      <span class="mono text-[10px] font-bold text-inherit">CORE</span>
                  </div>
                  <!-- The Empty Slot -->
                  <div class="slot-target h-12 w-full border-2 border-dashed border-zinc-300 bg-zinc-100/50 flex items-center justify-center box-border relative z-0">
                      <span class="mono text-[10px] font-bold text-zinc-300 opacity-50">SLOT</span>
                  </div>
                  <div ref="renderRef" class="stack-item h-12 w-full bg-white border border-zinc-200 shadow-sm flex items-center px-4 relative z-10 transition-colors">
                      <span class="mono text-[10px] font-bold text-inherit">RENDER</span>
                  </div>
              </div>

              <!-- Draggable Module -->
              <div 
                ref="moduleRef"
                class="absolute w-48 h-12 bg-zinc-900 border border-zinc-900 shadow-xl flex items-center px-4 z-20 transform -translate-x-1/2 -translate-y-1/2 transition-colors"
              >
                  <div class="pluginDot w-2 h-2 bg-emerald-400 border-zinc-900 border border-solid rounded-sm mr-3"></div>
                  <span class="mono text-[10px] font-bold inherit uppercase tracking-widest flex-1">
                    @supermouse/plugin
                  </span>
              </div>

              <!-- Cursor -->
              <div 
                ref="cursorRef"
                class="absolute z-30 w-6 h-6 pointer-events-none drop-shadow-xl transform -translate-x-1/2 -translate-y-1/2"
              >
                 <svg viewBox="0 0 24 24" fill="none" stroke="none" class="w-full h-full text-black">
                    <path d="M5.5 3.5L11.5 19.5L14 12.5L21 10L5.5 3.5Z" fill="currentColor" />
                 </svg>
              </div>

              <div class="absolute bottom-6 left-0 right-0 text-center">
                 <p class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                    Modular Runtime
                 </p>
              </div>
          </div>

       </div>
    </div>
  </section>
</template>
