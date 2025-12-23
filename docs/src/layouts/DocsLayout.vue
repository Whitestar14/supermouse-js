
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { PLUGINS } from '../plugin-data';

const route = useRoute();

const pluginLinks = PLUGINS.map(p => ({
  label: p.name,
  path: `/docs/plugins/${p.id}`
}));

const navigation = [
  {
    title: 'Guide',
    items: [
      { label: 'Introduction', path: '/docs/guide/introduction' },
      { label: 'Installation', path: '/docs/guide/installation' },
      { label: 'Basic Usage', path: '/docs/guide/usage' },
      { label: 'Toolchain', path: '/docs/guide/toolchain' },
    ]
  },
  {
    title: 'Ecosystem',
    items: pluginLinks
  },
  {
    title: 'Advanced',
    items: [
      { label: 'Core Concepts', path: '/docs/advanced/architecture' },
      { label: 'Plugin Authoring', path: '/docs/advanced/authoring' },
      { label: 'Contributing', path: '/docs/advanced/contributing' },
      { label: 'API Reference', path: '/docs/reference/api' },
    ]
  }
];

// Flatten navigation for next/prev logic
const flatNav = computed(() => {
  return navigation.flatMap(group => group.items);
});

const currentIndex = computed(() => {
  return flatNav.value.findIndex(item => item.path === route.path);
});

const prevPage = computed(() => {
  if (currentIndex.value > 0) return flatNav.value[currentIndex.value - 1];
  return null;
});

const nextPage = computed(() => {
  if (currentIndex.value !== -1 && currentIndex.value < flatNav.value.length - 1) {
    return flatNav.value[currentIndex.value + 1];
  }
  return null;
});

const isActive = (path: string) => route.path === path;
</script>

<template>
  <div class="flex flex-col lg:flex-row min-h-screen bg-white">
    <!-- Sidebar Navigation -->
    <aside class="hidden lg:block w-[240px] border-r border-zinc-200 shrink-0 relative bg-zinc-50/30">
      <div class="sticky top-0 h-[calc(100vh-80px)] overflow-y-auto py-12 px-6 scrollbar-thin">
        <nav class="flex flex-col gap-10">
          <div v-for="group in navigation" :key="group.title">
            <h3 class="mono text-[10px] font-bold uppercase tracking-widest text-zinc-900 mb-4 flex items-center gap-2">
              <div class="w-1 h-1 bg-black"></div>
              {{ group.title }}
            </h3>
            <ul class="flex flex-col border-l border-zinc-200 ml-0.5 pl-4 gap-0.5">
              <li v-for="item in group.items" :key="item.path">
                <router-link 
                  :to="item.path"
                  class="block py-1.5 text-xs font-bold tracking-tight transition-colors duration-0"
                  :class="isActive(item.path) ? 'text-black translate-x-1' : 'text-zinc-500 hover:text-black hover:translate-x-1'"
                >
                  {{ item.label }}
                </router-link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 min-w-0 bg-white flex flex-col">
      <div class="flex-1 max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-20 w-full">
        <router-view />
      </div>

      <!-- Docs Footer Navigation -->
      <div class="max-w-4xl mx-auto w-full px-6 md:px-12 pb-20 mt-auto">
         <div class="border-t border-zinc-200 pt-8 flex justify-between gap-8">
            <!-- Previous -->
            <router-link 
              v-if="prevPage" 
              :to="prevPage.path"
              class="group flex flex-col items-start gap-2 max-w-[45%]"
            >
               <span class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-amber-600 transition-colors">Previous</span>
               <div class="flex items-center gap-2 text-lg font-bold text-zinc-900 group-hover:underline decoration-2 underline-offset-4 decoration-zinc-900">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  <span class="text-pretty leading-tight">{{ prevPage.label }}</span>
               </div>
            </router-link>
            <div v-else></div>

            <!-- Next -->
            <router-link 
              v-if="nextPage" 
              :to="nextPage.path"
              class="group flex flex-col items-end gap-2 max-w-[45%] text-right"
            >
               <span class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-amber-600 transition-colors">Next</span>
               <div class="flex items-center gap-2 text-lg font-bold text-zinc-900 group-hover:underline decoration-2 underline-offset-4 decoration-zinc-900">
                  <span class="text-pretty leading-tight">{{ nextPage.label }}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
               </div>
            </router-link>
         </div>
      </div>
    </div>
    
    <!-- Right Sidebar (TOC Placeholder) -->
    <aside class="hidden xl:block w-[200px] shrink-0 border-l border-zinc-100">
      <!-- Future: On-page TOC -->
    </aside>
  </div>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #e4e4e7;
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: #d4d4d8;
}
</style>
