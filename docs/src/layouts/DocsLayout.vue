
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Footer from '../components/Footer.vue';
import { DOCS_NAVIGATION } from '../navigation';

// Note: Cursor and Navbar are now handled by App.vue

// --- ROUTE & NAV ---
const route = useRoute();

// --- Collapsible Logic (Accordion) ---
const activeGroup = ref<string | null>(null);
const mobileMenuOpen = ref(false);

const toggleGroup = (title: string) => {
  if (activeGroup.value === title) {
    activeGroup.value = null;
  } else {
    activeGroup.value = title;
  }
};

const syncSidebar = () => {
  const currentPath = route.path;
  const found = DOCS_NAVIGATION.find(group => 
    group.items.some(item => item.path === currentPath)
  );
  if (found) {
    activeGroup.value = found.title;
  }
};

// Breadcrumbs for Mobile Header
const breadcrumbs = computed(() => {
  const currentPath = route.path;
  for (const group of DOCS_NAVIGATION) {
    const item = group.items.find(i => i.path === currentPath);
    if (item) {
      return { group: group.title, page: item.label };
    }
  }
  return { group: 'Docs', page: 'Guide' };
});

watch(() => route.path, () => {
  syncSidebar();
  mobileMenuOpen.value = false; // Auto-close mobile menu on navigation
}, { immediate: true });

// --- Pagination Logic ---
const flatNav = computed(() => {
  return DOCS_NAVIGATION.flatMap(group => 
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
    
    <!-- Mobile Sub-header (Nav Trigger + Breadcrumbs) -->
    <div class="lg:hidden h-12 border-b border-zinc-200 bg-white flex items-center px-6 sticky top-0 z-30 select-none">
        <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="flex items-center justify-between w-full group outline-none"
        >
            <!-- Breadcrumbs -->
            <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span class="text-zinc-400">{{ breadcrumbs.group }}</span>
                <span class="text-zinc-200">/</span>
                <span class="text-zinc-900">{{ breadcrumbs.page }}</span>
            </div>

            <!-- Toggle Icon -->
            <div class="w-8 h-8 flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors">
                <svg 
                    width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                    class="transition-transform duration-300"
                    :class="mobileMenuOpen ? 'rotate-180' : 'rotate-0'"
                >
                    <path d="M6 9l6 6 6-6"/>
                </svg>
            </div>
        </button>

        <!-- Mobile Menu Dropdown (Absolute to sticky header) -->
        <div v-if="mobileMenuOpen" class="absolute top-full left-0 w-full bg-white border-b border-zinc-200 shadow-2xl flex flex-col max-h-[70vh] overflow-y-auto">
             <nav class="flex flex-col p-6 gap-6">
                <div v-for="group in DOCS_NAVIGATION" :key="group.title">
                    <button 
                        @click.stop="toggleGroup(group.title)"
                        class="w-full flex items-center justify-between mono text-xs font-bold uppercase tracking-widest mb-3 text-left transition-colors"
                        :class="activeGroup === group.title ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'"
                    >
                        <div class="flex items-center gap-3">
                            <div class="w-1.5 h-1.5 transition-colors" :class="activeGroup === group.title ? 'bg-black' : 'bg-zinc-200'"></div>
                            {{ group.title }}
                        </div>
                        <svg 
                            width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                            class="transition-transform duration-200"
                            :class="activeGroup === group.title ? 'rotate-180 text-black' : 'rotate-0 text-zinc-300'"
                        >
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>
                    <!-- Removed border-l here as well -->
                    <div 
                        v-show="activeGroup === group.title"
                        class="flex flex-col pl-5 gap-2 pb-2"
                    >
                        <router-link 
                        v-for="item in group.items" 
                        :key="item.path"
                        :to="item.path"
                        class="block py-1 text-sm font-medium tracking-tight transition-colors"
                        :class="isActive(item.path) ? 'text-black font-bold' : 'text-zinc-500 hover:text-black'"
                        >
                        {{ item.label }}
                        </router-link>
                    </div>
                </div>
             </nav>
             <!-- Backdrop to close -->
             <div class="h-screen bg-black/5 backdrop-blur-sm lg:hidden" @click="mobileMenuOpen = false"></div>
        </div>
    </div>

    <!-- Main Layout: Gutter + Sidebar + Content -->
    <div class="flex flex-col lg:flex-row flex-1 min-h-0 relative">
      
      <!-- 1. The Gutter -->
      <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-white"></div>

      <!-- 2. Sidebar Navigation (Desktop) -->
      <aside class="hidden lg:block w-[260px] border-r border-zinc-200 shrink-0 relative bg-zinc-50/30">
        <!-- Changed height to h-screen so it fills the viewport when sticky -->
        <div class="sticky top-0 h-screen overflow-y-auto py-12 px-8 scrollbar-thin">
          <nav class="flex flex-col gap-8 pb-32">
            <div v-for="group in DOCS_NAVIGATION" :key="group.title">
              
              <!-- Group Header -->
              <button 
                  @click="toggleGroup(group.title)"
                  class="w-full flex items-center justify-between mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 group hover:text-black transition-colors"
                  :class="{ 'text-black': activeGroup === group.title }"
              >
                  <div class="flex items-center gap-3">
                      <div 
                        class="w-1.5 h-1.5 transition-colors"
                        :class="activeGroup === group.title ? 'bg-black' : 'bg-zinc-300 group-hover:bg-zinc-400'"
                      ></div>
                      {{ group.title }}
                  </div>
                  <svg 
                      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                      class="transition-transform duration-200"
                      :class="activeGroup === group.title ? 'rotate-180 text-black' : 'rotate-0 text-zinc-300 group-hover:text-black'"
                  >
                      <path d="M6 9l6 6 6-6"/>
                  </svg>
              </button>

              <!-- Group Items (Removed border-l) -->
              <div 
                  v-show="activeGroup === group.title"
                  class="flex flex-col pl-5 gap-1.5"
              >
                <router-link 
                  v-for="item in group.items" 
                  :key="item.path"
                  :to="item.path"
                  class="block py-1 text-sm font-medium tracking-tight transition-colors duration-0"
                  :class="isActive(item.path) ? 'text-black font-bold' : 'text-zinc-500 hover:text-black'"
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
            <div class="border-t border-zinc-200 pt-8 flex flex-col sm:flex-row justify-between gap-8">
              <!-- Previous -->
              <router-link 
                v-if="prevPage" 
                :to="prevPage.path"
                class="group flex flex-col items-start gap-2 sm:max-w-[45%]"
              >
                  <span class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-black transition-colors">
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
                class="group flex flex-col items-end gap-2 sm:max-w-[45%] text-right"
              >
                  <span class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-black transition-colors">
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
