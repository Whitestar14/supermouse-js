
<script setup lang="ts">
import { ref } from 'vue';

const mobileMenuOpen = ref(false);
const isSpinning = ref(false);
const showVersionMenu = ref(false);

const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : '';
};

const triggerSpin = (e: MouseEvent) => {
  isSpinning.value = true;
  setTimeout(() => {
    isSpinning.value = false;
  }, 700);
};
</script>

<template>
  <nav class="relative w-full border-b border-zinc-200 bg-white z-[50]">
    <div class="flex items-stretch h-16 md:h-20 bg-white relative z-50">
      
      <!-- 1. Logo Column (Fixed Width, Border Right) -->
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0 bg-white">
         <router-link to="/" class="group block p-4" @click.capture="triggerSpin">
            <!-- App Logo / Cursor SVG -->
            <div 
                class="w-8 h-8 transition-all duration-500 ease-out"
                :class="[
                    isSpinning ? 'rotate-[315deg] scale-125' : '-rotate-45 group-hover:scale-110'
                ]"
            >
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full drop-shadow-sm">
                  <g transform="rotate(90 16 16)">
                    <path d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z" fill="#F2F5F8" />
                    <path d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z" fill="#111920" />
                  </g>
                </svg>
            </div>
         </router-link>
      </div>

      <!-- 2. Brand Column (Fluid Flex-1, Border Right) -->
      <!-- This consumes available space, pushing Links/Github to the far right -->
      <div class="flex-1 flex items-center px-6 md:px-8 border-r border-zinc-200 bg-white min-w-0">
        <div class="flex items-center gap-4">
            <router-link to="/" class="flex items-center text-lg md:text-xl font-bold tracking-tighter text-zinc-900 group">
              <div class="flex items-baseline">
                <span>supermouse</span><div class="w-[0.2em] h-[0.2em] bg-current rounded-full mx-[0.05em] relative top-[1px]"></div><span>js</span>
              </div>
            </router-link>

            <!-- Version Dropdown -->
            <div class="relative group">
                <button 
                    @click="showVersionMenu = !showVersionMenu" 
                    class="flex items-center gap-1 text-[10px] font-bold text-zinc-400 tracking-widest uppercase hover:text-black transition-colors relative top-[1px]"
                >
                    v2
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                
                <div v-if="showVersionMenu" 
                     @mouseleave="showVersionMenu = false"
                     class="absolute top-full left-0 mt-2 w-40 bg-white border border-zinc-200 shadow-xl py-1 z-50">
                    <div class="px-4 py-2 text-[10px] font-bold text-black uppercase tracking-widest bg-zinc-50">
                        Select Version
                    </div>
                    <a href="#" class="block px-4 py-2 text-xs font-medium text-black hover:bg-zinc-50 flex items-center justify-between">
                        v2 <span class="w-1.5 h-1.5 bg-black rounded-full"></span>
                    </a>
                    <a href="https://github.com/Whitestar14/supermouse-js/" target="_blank" class="block px-4 py-2 text-xs font-medium text-zinc-500 hover:text-black hover:bg-zinc-50 flex items-center justify-between">
                        v1
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Mobile Trigger (Appears here on mobile) -->
        <div class="md:hidden ml-auto">
           <button @click="toggleMenu" class="group relative flex items-center justify-center w-10 h-10 outline-none">
              <div class="flex flex-col gap-1.5">
                  <span class="w-6 h-0.5 bg-black transition-transform" :class="mobileMenuOpen ? 'rotate-45 translate-y-2' : ''"></span>
                  <span class="w-6 h-0.5 bg-black transition-opacity" :class="mobileMenuOpen ? 'opacity-0' : ''"></span>
                  <span class="w-6 h-0.5 bg-black transition-transform" :class="mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''"></span>
              </div>
           </button>
        </div>
      </div>

      <!-- 3. Navigation Links Column (Shrink-0, Border Right) -->
      <div class="hidden md:flex h-full border-r border-zinc-200 items-center px-8 gap-8 bg-white shrink-0">
            <router-link to="/" 
              class="mono text-[11px] uppercase tracking-[0.1em] font-bold text-zinc-400 hover:text-black transition-colors" 
              active-class="!text-black underline decoration-2 underline-offset-4 decoration-black">
              Home
            </router-link>
            <router-link to="/docs" 
              class="mono text-[11px] uppercase tracking-[0.1em] font-bold text-zinc-400 hover:text-black transition-colors" 
              active-class="!text-black underline decoration-2 underline-offset-4 decoration-black">
              Docs
            </router-link>
            <router-link to="/labs" 
              class="mono text-[11px] uppercase tracking-[0.1em] font-bold text-zinc-400 hover:text-black transition-colors" 
              active-class="!text-black underline decoration-2 underline-offset-4 decoration-black">
              Labs
            </router-link>
      </div>

      <!-- 4. Github Column (Shrink-0) -->
      <div class="hidden md:flex h-full items-center px-8 bg-white shrink-0">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 mono text-[11px] uppercase tracking-[0.1em] font-bold text-zinc-400 hover:text-black transition-colors">
            Github
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
            </a>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <div class="md:hidden fixed inset-0 top-[64px] bg-white z-40 transition-all duration-300 ease-in-out flex flex-col"
         :class="mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'">
         
         <div class="absolute inset-0 grid-bg opacity-50 pointer-events-none"></div>
         
         <div class="relative z-10 flex flex-col gap-8 p-12 mt-4">
            <router-link to="/" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
              Home
            </router-link>
            <router-link to="/docs" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
              Docs
            </router-link>
            <router-link to="/labs" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
              Labs
            </router-link>
            <a href="https://github.com" target="_blank" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
               Github
            </a>
         </div>
    </div>
  </nav>
</template>
