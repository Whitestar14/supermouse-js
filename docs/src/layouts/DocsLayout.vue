
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Footer from '../components/Footer.vue';
import { PLUGINS } from '../plugin-data';

// Note: Cursor and Navbar are now handled by App.vue

// --- ROUTE & NAV ---
const route = useRoute();

// Split plugins into categories
const LABS_IDS = ['smart-icon', 'smart-ring', 'sparkles', 'text-ring'];

const standardPlugins = PLUGINS
  .filter(p => !LABS_IDS.includes(p.id))
  .map(p => ({ label: p.name, path: `/docs/plugins/${p.id}` }));

const labPlugins = PLUGINS
  .filter(p => LABS_IDS.includes(p.id))
  .map(p => ({ label: p.name, path: `/docs/plugins/${p.id}` }));

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
    title: 'Integrations',
    items: [
      { label: 'Vue.js', path: '/docs/integrations/vue' },
    ]
  },
  {
    title: 'Standard Plugins',
    items: standardPlugins
  },
  {
    title: 'Labs',
    items: labPlugins
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

// --- Collapsible Logic ---
const openGroups = ref<Set<string>>(new Set());

const toggleGroup = (title: string) => {
  if (openGroups.value.has(title)) {
    openGroups.value.delete(title);
  } else {
    openGroups.value.add(title);
  }
};

const syncSidebar = () => {
  const currentPath = route.path;
  navigation.forEach(group => {
    const hasActiveItem = group.items.some(item => item.path === currentPath);
    if (hasActiveItem) {
      openGroups.value.add(group.title);
    }
  });
};

watch(() => route.path, syncSidebar, { immediate: true });

// --- Pagination Logic ---
const flatNav = computed(() => {
  return navigation.flatMap(group => 
    group.items.map(item => ({ ...item, group: group.title }))
  );
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
  <div class="flex flex-col h-full min-h-screen">
    <!-- Main Layout: Sidebar + Content -->
    <div class="flex flex-col lg:flex-row flex-1 min-h-0 relative">
      
      <!-- Sidebar Navigation -->
      <aside class="hidden lg:block w-[260px] border-r border-zinc-200 shrink-0 relative bg-zinc-50/30">
        <div class="sticky top-0 h-[calc(100vh-80px)] overflow-y-auto py-12 px-8 scrollbar-thin">
          <nav class="flex flex-col gap-8">
            <div v-for="group in navigation" :key="group.title">
              
              <!-- Group Header -->
              <button 
                  @click="toggleGroup(group.title)"
                  class="w-full flex items-center justify-between mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4 group hover:text-amber-600 transition-colors"
              >
                  <div class="flex items-center gap-3">
                      <div class="w-1.5 h-1.5 bg-black group-hover:bg-amber-500 transition-colors"></div>
                      {{ group.title }}
                  </div>
                  <svg 
                      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                      class="transition-transform duration-200"
                      :class="openGroups.has(group.title) ? 'rotate-180' : 'rotate-0 text-zinc-400'"
                  >
                      <path d="M6 9l6 6 6-6"/>
                  </svg>
              </button>

              <!-- Group Items -->
              <div 
                  v-show="openGroups.has(group.title)"
                  class="flex flex-col border-l border-zinc-200 ml-[3px] pl-5 gap-1.5"
              >
                <router-link 
                  v-for="item in group.items" 
                  :key="item.path"
                  :to="item.path"
                  class="block py-1 text-sm font-medium tracking-tight transition-colors duration-0"
                  :class="isActive(item.path) ? 'text-black' : 'text-zinc-500 hover:text-black'"
                >
                  {{ item.label }}
                </router-link>
              </div>
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
                  <span class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-amber-600 transition-colors">
                    {{ prevPage.group }}
                  </span>
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
                  <span class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-amber-600 transition-colors">
                    {{ nextPage.group }}
                  </span>
                  <div class="flex items-center gap-2 text-lg font-bold text-zinc-900 group-hover:underline decoration-2 underline-offset-4 decoration-zinc-900">
                    <span class="text-pretty leading-tight">{{ nextPage.label }}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
              </router-link>
            </div>
        </div>
      </div>
      
      <!-- Right Sidebar (TOC Placeholder) -->
      <aside class="hidden xl:block w-[200px] shrink-0 border-l border-zinc-100 bg-white">
        <!-- Future: On-page TOC -->
      </aside>
    </div>

    <Footer />
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
