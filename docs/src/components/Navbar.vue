<script setup lang="ts">
import { ref } from 'vue';
import { APP_VERSION } from '../constants';

const mobileMenuOpen = ref(false);
const isSpinning = ref(false);

const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const triggerSpin = (e: MouseEvent) => {
  // Don't navigate if clicking specifically for the animation demo (optional, but good for UX in docs)
  // But here it's a router link, so navigation is expected. 
  // We just add the spin visual.
  isSpinning.value = true;
  setTimeout(() => {
    isSpinning.value = false;
  }, 700);
};
</script>

<template>
  <nav class="relative w-full border-b border-zinc-200 bg-white z-[50]">
    <div class="flex items-stretch h-16 md:h-20 bg-white relative z-50">
      
      <!-- Left Column (Logo) -->
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0 bg-white">
         <router-link to="/" class="group block p-4" @click.capture="triggerSpin">
            <!-- App Logo / Cursor SVG -->
            <!-- 
                 Base Rotation: -45deg to look like a standard cursor.
                 Hover: Scale up.
                 Click: Spin 360 + base.
            -->
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

      <!-- Middle Column (Brand Name) -->
      <div class="flex-1 flex items-center px-6 md:px-8 justify-between bg-white">
        <router-link to="/" class="flex items-center text-lg md:text-xl font-bold tracking-tighter text-zinc-900 group cursor-none">
          <div class="flex items-baseline">
            <span>superm</span>
            <div class="w-[0.6em] h-[0.6em] bg-current rounded-full mx-[0.05em] relative top-[1px]"></div>
            <span>use</span>
          </div>
          <span class="ml-3 text-[10px] font-bold text-zinc-400 tracking-widest uppercase relative top-[2px] opacity-60">{{ APP_VERSION }}</span>
        </router-link>

        <!-- Mobile Menu Trigger -->
        <div class="md:hidden">
           <button @click="toggleMenu" class="group relative flex items-center justify-center w-14 h-full outline-none">
              <!-- Text State -->
              <span 
                class="absolute font-bold text-[10px] uppercase tracking-widest transition-all duration-300 transform origin-center"
                :class="mobileMenuOpen ? 'opacity-0 scale-75 rotate-90' : 'opacity-100 scale-100 rotate-0'"
              >
                Menu
              </span>
              <!-- Line State -->
              <span 
                class="absolute h-[2px] bg-black transition-all duration-300 transform origin-center"
                :class="mobileMenuOpen ? 'w-6 opacity-100' : 'w-0 opacity-0'"
              ></span>
           </button>
        </div>
      </div>

      <!-- Right Column (Desktop Links) -->
      <div class="hidden md:flex border-l border-zinc-200 items-center px-8 gap-8 mono text-[11px] uppercase tracking-[0.1em] font-bold text-zinc-600 shrink-0 bg-white">
        <router-link to="/" class="hover:text-black transition-colors cursor-none" active-class="text-black underline decoration-2 underline-offset-4 decoration-black">Home</router-link>
        <router-link to="/docs" class="hover:text-black transition-colors cursor-none" active-class="text-black underline decoration-2 underline-offset-4 decoration-black">Docs</router-link>
        <router-link to="/playground" class="hover:text-black transition-colors cursor-none text-purple-600" active-class="font-extrabold">Playground</router-link>
        
        <!-- Divider -->
        <div class="h-6 w-px bg-zinc-200 mx-2"></div>

        <a href="https://github.com" target="_blank" rel="noopener noreferrer" class="hover:text-black transition-colors cursor-none flex items-center gap-2">
          Github
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
        </a>
      </div>
    </div>

    <!-- Mobile Menu Overlay -->
    <div class="md:hidden fixed inset-x-0 top-16 bottom-0 bg-white z-40 transition-all duration-300 ease-in-out origin-top flex flex-col"
         :class="mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'">
         
         <!-- Background Grid -->
         <div class="absolute inset-0 grid-bg opacity-100 pointer-events-none mix-blend-multiply"></div>
         
         <!-- Links -->
         <div class="relative z-10 flex flex-col gap-8 p-12 mt-4">
            <router-link to="/" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
              <div class="w-2 h-2 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              Home
            </router-link>
            <router-link to="/docs" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
               <div class="w-2 h-2 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              Docs
            </router-link>
            <router-link to="/playground" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-purple-600 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
               <div class="w-2 h-2 bg-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              Playground
            </router-link>
            <a href="https://github.com" target="_blank" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
               <div class="w-2 h-2 bg-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              Github
            </a>
         </div>
         
         <!-- Footer info in menu -->
         <div class="mt-auto relative z-10 p-12 border-t border-zinc-100 bg-white/50 backdrop-blur-sm">
            <div class="flex flex-col gap-2">
               <span class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold">Latest Release</span>
               <span class="text-sm font-bold text-zinc-900">{{ APP_VERSION }} Stable</span>
            </div>
         </div>
    </div>
  </nav>
</template>