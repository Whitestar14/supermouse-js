
<script setup lang="ts">
import { ref } from 'vue';

const mobileMenuOpen = ref(false);

const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};
</script>

<template>
  <nav class="relative w-full border-b border-zinc-200 bg-white z-[50]">
    <div class="flex items-stretch h-16 md:h-20 bg-white relative z-50">
      
      <!-- Left Column (Logo) -->
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0 bg-white">
         <router-link to="/" class="group block">
          <div class="w-5 h-5 md:w-6 md:h-6 bg-black rounded-full transform transition-transform group-hover:scale-110 duration-500"></div>
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
          <span class="ml-3 text-[10px] font-bold text-zinc-400 tracking-widest uppercase relative top-[2px] opacity-60">v2.0</span>
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
               <span class="text-sm font-bold text-zinc-900">v2.0.4 Stable</span>
            </div>
         </div>
    </div>
  </nav>
</template>
