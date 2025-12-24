
<script setup lang="ts">
import { ref, computed } from 'vue';
import { GITHUB_URL } from '../constants';
import { useSupermouse } from '@supermousejs/vue';

const emit = defineEmits(['openSearch']);

const mobileMenuOpen = ref(false);
const isSpinning = ref(false);
const showVersionMenu = ref(false);
const isDev = import.meta.env.DEV;

// Get Docs Supermouse Instance
const mouse = useSupermouse();

// Dynamic text for the cursor based on enabled state
const logoCursorText = computed(() => {
    if (!mouse.value) return 'Loading...';
    return mouse.value.isEnabled ? 'Switch to Native' : 'Switch to Supermouse';
});

const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  document.body.style.overflow = mobileMenuOpen.value ? 'hidden' : '';
};

const triggerSpin = () => {
  if (isSpinning.value) return;
  isSpinning.value = true;
  
  setTimeout(() => {
    isSpinning.value = false;
    // Toggle Cursor Mode (Native vs Custom)
    if (mouse.value) {
        if (mouse.value.isEnabled) {
            mouse.value.disable();
        } else {
            mouse.value.enable();
        }
    }
  }, 700);
};
</script>

<template>
  <nav class="relative w-full border-b border-zinc-200 bg-white z-[50]">
    <div class="flex items-stretch h-16 md:h-20 bg-white relative z-50">
      
      <!-- 1. Logo Column (Fixed Width, Border Right) -->
      <button 
        @click="triggerSpin"
        class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0 bg-white hover:bg-zinc-50 transition-colors outline-none relative"
        aria-label="Toggle Cursor Mode"
        :data-supermouse-text="logoCursorText"
      >
         <div class="group block p-4 pointer-events-none">
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
         </div>
      </button>

      <!-- 2. Brand Column (Fluid Flex-1, Border Right) -->
      <div class="flex-1 flex items-center px-6 md:px-8 border-r border-zinc-200 bg-white min-w-0 justify-between">
        <div class="flex items-center gap-4">
            <router-link to="/" class="flex items-center text-lg md:text-xl font-bold tracking-tighter text-zinc-900 group">
              <div class="flex items-baseline">
                <span>supermouse</span><div class="w-[0.2em] h-[0.2em] bg-current rounded-full mx-[0.05em] relative top-[1px]"></div><span>js</span>
              </div>
            </router-link>

            <!-- Brutalist Version Dropdown -->
            <div class="relative group hidden sm:block">
                <button 
                    @click="showVersionMenu = !showVersionMenu" 
                    class="flex items-center gap-1 text-[10px] font-bold text-zinc-400 tracking-widest uppercase hover:text-black transition-colors relative top-[1px]"
                >
                    v2.0
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" :class="showVersionMenu ? 'rotate-180' : ''" class="transition-transform"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                
                <div v-if="showVersionMenu" 
                     @mouseleave="showVersionMenu = false"
                     class="absolute top-full left-0 mt-px w-48 bg-white border border-zinc-200 z-50 flex flex-col"
                >
                    <a href="#" class="flex items-center justify-between px-4 py-3 text-xs font-bold text-black bg-white uppercase tracking-widest border-b border-zinc-200">
                        <span>v2.0 (Stable)</span>
                        <div class="w-1.5 h-1.5 bg-emerald-500 rounded-none"></div>
                    </a>
                    <a :href="GITHUB_URL" target="_blank" class="flex items-center justify-between px-4 py-3 text-xs font-bold text-zinc-500 hover:bg-black hover:text-white transition-colors uppercase tracking-widest">
                        <span>v1.0 (Legacy)</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
                    </a>
                </div>
            </div>
        </div>

        <!-- SEARCH BUTTON (Desktop) -->
        <button 
            @click="$emit('openSearch')"
            class="hidden lg:flex w-1/4 justify-between items-center gap-3 px-1.5 py-1 bg-zinc-50 border border-zinc-200 hover:border-zinc-400 transition-colors group outline-none"
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-zinc-400 group-hover:text-black">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span class="text-xs text-zinc-400 group-hover:text-zinc-600 font-medium">Search...</span>
            <span class="mono text-[10px] text-zinc-300 group-hover:text-zinc-500 font-bold bg-white px-1.5 border border-zinc-200 rounded-sm">⌘K</span>
        </button>
        
        <!-- Mobile Trigger -->
        <div class="md:hidden ml-auto">
           <button @click="toggleMenu" class="group relative flex items-center justify-center w-12 h-10 outline-none">
              <span v-if="!mobileMenuOpen" class="mono text-[10px] font-bold uppercase tracking-widest text-black">
                MENU
              </span>
              <div v-else class="w-8 h-px bg-black"></div>
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
            <router-link v-if="isDev" to="/labs" 
              class="mono text-[11px] uppercase tracking-[0.1em] font-bold text-zinc-400 hover:text-black transition-colors" 
              active-class="!text-black underline decoration-2 underline-offset-4 decoration-black">
              Labs
            </router-link>
      </div>

      <!-- 4. Github Column (Shrink-0) -->
      <div class="hidden md:flex h-full items-center px-8 bg-white shrink-0">
            <a :href="GITHUB_URL" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 mono text-[11px] uppercase tracking-[0.1em] font-bold text-zinc-400 hover:text-black transition-colors">
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
            <!-- Mobile Search Trigger -->
            <button @click="$emit('openSearch'); toggleMenu()" 
               class="text-left text-4xl font-bold tracking-tighter text-zinc-400 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
               Search...
            </button>

            <router-link to="/" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
              Home
            </router-link>
            <router-link to="/docs" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
              Docs
            </router-link>
            <router-link v-if="isDev" to="/labs" @click="toggleMenu" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
              Labs
            </router-link>
            <a :href="GITHUB_URL" target="_blank" 
               class="text-4xl font-bold tracking-tighter text-zinc-900 transition-transform hover:translate-x-2 inline-flex items-center gap-4 group">
               Github
               <!-- Added Top-Right Arrow -->
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-zinc-300 group-hover:text-black"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
            </a>
         </div>
    </div>
  </nav>
</template>
