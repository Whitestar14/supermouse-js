<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useHead } from "@vueuse/head";
import { APP_NAME, DOMAIN } from "@config/constants";
import Footer from "@/components/landing/Footer.vue";
import { useDocsSidebar } from "@composables/useDocsSidebar";
import { DOCS_NAVIGATION } from "@config/navigation";

const route = useRoute();
const { clearRightSidebar, rightSidebarConfig } = useDocsSidebar();

const activeGroup = ref<string | null>(null);
const mobileMenuOpen = ref(false);

const isActive = (path: string) => route.path === path;

const toggleGroup = (title: string) => {
  if (activeGroup.value === title) {
    activeGroup.value = null;
  } else {
    activeGroup.value = title;
  }
};

const syncSidebar = () => {
  const currentPath = route.path;
  const found = DOCS_NAVIGATION.find((group) =>
    group.items.some((item) => item.path === currentPath)
  );
  if (found) {
    activeGroup.value = found.title;
  }
};

const breadcrumbs = computed(() => {
  const currentPath = route.path;
  for (const group of DOCS_NAVIGATION) {
    const item = group.items.find((i) => i.path === currentPath);
    if (item) {
      return { group: group.title, page: item.label };
    }
  }
  return { group: "Docs", page: "Guide" };
});

const breadcrumbSchema = computed(() => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Docs",
        item: `${DOMAIN}/docs/guide/introduction`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: breadcrumbs.value.group
      },
      {
        "@type": "ListItem",
        position: 3,
        name: breadcrumbs.value.page,
        item: `${DOMAIN}${route.path}`
      }
    ]
  };
});

useHead({
  title: computed(() => `${breadcrumbs.value.page} | ${APP_NAME}`),
  script: [
    {
      type: "application/ld+json",
      children: computed(() => JSON.stringify(breadcrumbSchema.value))
    }
  ],
  meta: [
    {
      name: "description",
      content: computed(() => `Documentation for ${breadcrumbs.value.page} in ${APP_NAME}.`)
    }
  ]
});

watch(
  () => route.path,
  () => {
    syncSidebar();
    clearRightSidebar();
    mobileMenuOpen.value = false;

    if ((window as any).lenis) {
      (window as any).lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  },
  { immediate: true }
);

const flatNav = computed(() => {
  return DOCS_NAVIGATION.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.title }))
  );
});

const currentIndex = computed(() => {
  return flatNav.value.findIndex((item) => item.path === route.path);
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
</script>

<template>
  <div class="flex flex-col h-full min-h-screen">
    <!-- Mobile Sub-header (Nav Trigger + Breadcrumbs) -->
    <div
      class="lg:hidden h-12 border-b border-zinc-200 bg-white flex items-center px-6 sticky top-0 z-30 select-none"
    >
      <button
        class="flex items-center justify-between w-full group outline-none"
        @click="mobileMenuOpen = true"
      >
        <!-- Breadcrumbs -->
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <span class="text-zinc-400">{{ breadcrumbs.group }}</span>
          <span class="text-zinc-200">/</span>
          <span class="text-zinc-900">{{ breadcrumbs.page }}</span>
        </div>

        <!-- Toggle Icon -->
        <div
          class="w-8 h-8 flex items-center justify-center text-zinc-400 group-hover:text-black transition-colors"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      <!-- Mobile Menu Drawer (Fixed Overlay) -->
      <Teleport to="body">
        <div
          v-if="mobileMenuOpen"
          class="fixed inset-0 bg-white z-[60] flex flex-col"
          data-lenis-prevent
        >
          <!-- Drawer Header (Internal) -->
          <div class="h-12 border-b border-zinc-200 bg-white flex items-center px-6 shrink-0">
            <button
              class="flex items-center justify-between w-full group outline-none"
              @click="mobileMenuOpen = false"
            >
              <!-- Breadcrumbs (Same as sticky header) -->
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span class="text-zinc-400">{{ breadcrumbs.group }}</span>
                <span class="text-zinc-200">/</span>
                <span class="text-zinc-900">{{ breadcrumbs.page }}</span>
              </div>

              <!-- Close Icon -->
              <div class="w-8 h-8 flex items-center justify-center text-black">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  class="rotate-180"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </button>
          </div>

          <!-- Nav Content -->
          <nav class="flex flex-col p-6 gap-6 flex-1 overflow-y-auto bg-white">
            <div v-for="group in DOCS_NAVIGATION" :key="group.title">
              <button
                class="w-full flex items-center justify-between mono text-xs font-bold uppercase tracking-widest mb-3 text-left transition-colors"
                :class="
                  activeGroup === group.title ? 'text-black' : 'text-zinc-400 hover:text-zinc-600'
                "
                @click.stop="toggleGroup(group.title)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-1.5 h-1.5 transition-colors"
                    :class="activeGroup === group.title ? 'bg-black' : 'bg-zinc-200'"
                  />
                  {{ group.title }}
                </div>
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  class="transition-transform duration-200"
                  :class="
                    activeGroup === group.title ? 'rotate-180 text-black' : 'rotate-0 text-zinc-300'
                  "
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <!-- Group Items -->
              <div
                v-show="activeGroup === group.title"
                class="flex flex-col pl-5 gap-3 pb-2 border-l border-zinc-100 ml-0.5"
              >
                <router-link
                  v-for="item in group.items"
                  :key="item.path"
                  :to="item.path"
                  class="block py-1 text-sm font-medium tracking-tight transition-colors"
                  :class="
                    isActive(item.path) ? 'text-black font-bold' : 'text-zinc-500 hover:text-black'
                  "
                >
                  {{ item.label }}
                </router-link>
              </div>
            </div>

            <!-- Spacer for scroll -->
            <div class="h-20" />
          </nav>
        </div>
      </Teleport>
    </div>

    <!-- Main Layout: Gutter + Sidebar + Content -->
    <div class="flex flex-col lg:flex-row flex-1 min-h-0 relative">
      <!-- 1. The Gutter -->
      <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-white" />

      <!-- 2. Sidebar Navigation (Desktop) -->
      <aside
        class="hidden lg:block w-[260px] border-r border-zinc-200 shrink-0 relative bg-zinc-50/30"
      >
        <!-- Sticky Sidebar with Lenis Prevent -->
        <div
          class="sticky top-0 h-screen overflow-y-auto py-12 px-8 scrollbar-thin"
          data-lenis-prevent
        >
          <nav class="flex flex-col gap-8 pb-32">
            <div v-for="group in DOCS_NAVIGATION" :key="group.title">
              <!-- Group Header -->
              <button
                class="w-full flex items-center justify-between mono text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 group hover:text-black transition-colors"
                :class="{ 'text-black': activeGroup === group.title }"
                @click="toggleGroup(group.title)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-1.5 h-1.5 transition-colors"
                    :class="
                      activeGroup === group.title
                        ? 'bg-black'
                        : 'bg-zinc-300 group-hover:bg-zinc-400'
                    "
                  />
                  {{ group.title }}
                </div>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                  class="transition-transform duration-200"
                  :class="
                    activeGroup === group.title
                      ? 'rotate-180 text-black'
                      : 'rotate-0 text-zinc-300 group-hover:text-black'
                  "
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <!-- Group Items -->
              <div v-show="activeGroup === group.title" class="flex flex-col pl-5 gap-1.5">
                <router-link
                  v-for="item in group.items"
                  :key="item.path"
                  :to="item.path"
                  class="block py-1 text-sm font-medium tracking-tight transition-colors duration-0"
                  :class="
                    isActive(item.path) ? 'text-black font-bold' : 'text-zinc-500 hover:text-black'
                  "
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
          <div
            class="border-t border-zinc-200 pt-8 flex flex-col sm:flex-row justify-between gap-8"
          >
            <!-- Previous -->
            <router-link
              v-if="prevPage"
              :to="prevPage.path"
              class="group flex flex-col items-start gap-2 sm:max-w-[45%]"
            >
              <span
                class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-black transition-colors"
              >
                {{ prevPage.group }}
              </span>
              <div
                class="flex items-center gap-2 text-lg font-bold text-zinc-900 group-hover:underline decoration-2 underline-offset-4 decoration-zinc-900"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span class="text-pretty leading-tight">{{ prevPage.label }}</span>
              </div>
            </router-link>
            <div v-else />

            <!-- Next -->
            <router-link
              v-if="nextPage"
              :to="nextPage.path"
              class="group flex flex-col items-end gap-2 sm:max-w-[45%] text-right"
            >
              <span
                class="mono text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover:text-black transition-colors"
              >
                {{ nextPage.group }}
              </span>
              <div
                class="flex items-center gap-2 text-lg font-bold text-zinc-900 group-hover:underline decoration-2 underline-offset-4 decoration-zinc-900"
              >
                <span class="text-pretty leading-tight">{{ nextPage.label }}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <!-- Right Sidebar (Slottable for TOC and other components) -->
      <aside
        v-if="rightSidebarConfig"
        class="hidden xl:block w-[240px] shrink-0 border-l border-zinc-100 bg-white"
      >
        <div
          class="sticky top-28 h-fit max-h-[calc(100vh-7rem)] overflow-y-auto px-6 py-12 scrollbar-thin"
        >
          <component
            :is="rightSidebarConfig.component"
            v-bind="rightSidebarConfig.props"
            v-on="rightSidebarConfig.on"
          />
        </div>
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
