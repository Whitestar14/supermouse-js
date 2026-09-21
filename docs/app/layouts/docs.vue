<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { APP_NAME, GITHUB_URL, SITE_URL } from "@config/constants";
import Footer from "@components/landing/Footer.vue";
import { usePageHead } from "@composables/usePageHead";
import { useDocsNavigation } from "@config/navigation";
import { formatDate } from "@utils/date";
import { useTocSections, useTocActiveSection } from "@composables/useToc";
import { useScrollLock } from "@composables/useScrollLock";
import { useAutoHideHeader } from "@composables/useAutoHideHeader";

const route = useRoute();
const tocSections = useTocSections();
const activeSection = useTocActiveSection();
const DOCS_NAVIGATION = useDocsNavigation();

const activeGroup = ref<string | null>(null);
const mobileMenuOpen = ref(false);

useScrollLock(mobileMenuOpen);
// The drawer owns the header while it's open, so it can never open under a
// slid-away bar.
useAutoHideHeader(mobileMenuOpen);

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
        item: `${SITE_URL}/docs/guide/introduction`
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
        item: `${SITE_URL}${route.path}`
      }
    ]
  };
});

usePageHead({
  title: computed(() => breadcrumbs.value.page),
  description: computed(() => `Documentation for ${breadcrumbs.value.page} in ${APP_NAME}.`)
});

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: computed(() => JSON.stringify(breadcrumbSchema.value))
    }
  ]
});

watch(
  () => route.path,
  () => {
    syncSidebar();
    mobileMenuOpen.value = false;
  },
  { immediate: true }
);

const flatNav = computed(() => {
  return DOCS_NAVIGATION.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.title }))
  );
});

/**
 * Provenance footer for hand-written pages. Plugin pages are generated from
 * package metadata, so they get no edit link or date.
 */
const currentDoc = computed(() => flatNav.value.find((item) => item.path === route.path));
const lastUpdated = computed(() => formatDate(currentDoc.value?.updated));
const editUrl = computed(() =>
  currentDoc.value?.updated ? `${GITHUB_URL}/edit/main/docs/content${route.path}.md` : null
);

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
    <!-- Mobile Sub-header -->
    <div
      class="header-shell lg:hidden h-12 border-b border-border bg-surface flex items-center px-6 sticky top-[var(--header-h)] z-30 select-none"
    >
      <button
        class="flex items-center justify-between w-full group outline-none"
        @click="mobileMenuOpen = true"
      >
        <!-- Breadcrumbs -->
        <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
          <span class="text-subtle">{{ breadcrumbs.group }}</span>
          <span class="text-border">/</span>
          <span class="text-inverse">{{ breadcrumbs.page }}</span>
        </div>

        <!-- Toggle Icon -->
        <div
          class="w-8 h-8 flex items-center justify-center text-subtle group-hover:text-inverse transition-colors"
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
          class="fixed inset-x-0 bottom-0 top-[var(--header-h)] bg-surface z-60 flex flex-col"
          data-lenis-prevent
        >
          <!-- Drawer Header (Internal) -->
          <div class="h-12 border-b border-border bg-surface flex items-center px-6 shrink-0">
            <button
              class="flex items-center justify-between w-full group outline-none"
              @click="mobileMenuOpen = false"
            >
              <!-- Breadcrumbs (Same as sticky header) -->
              <div class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span class="text-subtle">{{ breadcrumbs.group }}</span>
                <span class="text-border">/</span>
                <span class="text-inverse">{{ breadcrumbs.page }}</span>
              </div>

              <!-- Close Icon -->
              <div class="w-8 h-8 flex items-center justify-center text-inverse">
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
          <nav class="flex flex-col p-6 gap-6 flex-1 overflow-y-auto bg-surface">
            <div v-for="group in DOCS_NAVIGATION" :key="group.title">
              <button
                class="w-full flex items-center justify-between mono text-xs font-bold uppercase tracking-widest mb-3 text-left transition-colors"
                :class="
                  activeGroup === group.title ? 'text-inverse' : 'text-subtle hover:text-body'
                "
                @click.stop="toggleGroup(group.title)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-1.5 h-1.5 transition-colors"
                    :class="activeGroup === group.title ? 'bg-inverse' : 'bg-border'"
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
                    activeGroup === group.title ? 'rotate-180 text-inverse' : 'rotate-0 text-faint'
                  "
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <!-- Group Items -->
              <div
                v-show="activeGroup === group.title"
                class="flex flex-col pl-5 gap-3 pb-2 border-l border-border-subtle ml-0.5"
              >
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.path"
                  :to="item.path"
                  class="block py-1 text-sm font-medium tracking-tight transition-colors"
                  :class="
                    isActive(item.path) ? 'text-inverse font-bold' : 'text-muted hover:text-inverse'
                  "
                >
                  {{ item.label }}
                </NuxtLink>
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
      <div class="hidden lg:block w-24 border-r border-border shrink-0 bg-surface" />

      <!-- 2. Sidebar Navigation (Desktop) -->
      <aside
        class="hidden lg:block w-65 border-r border-border shrink-0 relative bg-surface-muted/30"
      >
        <!-- Sticky Sidebar with Lenis Prevent -->
        <div
          class="header-shell sticky top-[var(--header-h)] h-[calc(100vh-var(--header-h))] overflow-y-auto py-12 px-8 scrollbar-thin"
          data-lenis-prevent
        >
          <nav class="flex flex-col gap-8 pb-32">
            <div v-for="group in DOCS_NAVIGATION" :key="group.title">
              <!-- Group Header -->
              <button
                class="w-full flex items-center justify-between mono text-xs font-bold uppercase tracking-widest text-muted mb-4 group hover:text-inverse transition-colors"
                :class="{ 'text-inverse': activeGroup === group.title }"
                @click="toggleGroup(group.title)"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-1.5 h-1.5 transition-colors"
                    :class="
                      activeGroup === group.title ? 'bg-inverse' : 'bg-faint group-hover:bg-subtle'
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
                      ? 'rotate-180 text-inverse'
                      : 'rotate-0 text-faint group-hover:text-inverse'
                  "
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <!-- Group Items -->
              <div v-show="activeGroup === group.title" class="flex flex-col pl-5 gap-1.5">
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.path"
                  :to="item.path"
                  class="block py-1 text-sm font-medium tracking-tight transition-colors duration-0"
                  :class="
                    isActive(item.path) ? 'text-inverse font-bold' : 'text-muted hover:text-inverse'
                  "
                >
                  {{ item.label }}
                </NuxtLink>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="flex-1 min-w-0 bg-surface flex flex-col">
        <div class="flex-1 max-w-4xl mx-auto px-6 md:px-12 py-12 md:pb-8 md:py-20 w-full">
          <slot />
        </div>

        <!-- Page provenance -->
        <div
          v-if="lastUpdated || editUrl"
          class="px-12 p-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
        >
          <span class="mono text-[10px] uppercase tracking-widest text-subtle font-bold">
            {{ lastUpdated ? `Updated ${lastUpdated}` : "Generated page" }}
          </span>
          <a
            v-if="editUrl"
            :href="editUrl"
            target="_blank"
            rel="noopener noreferrer"
            data-supermouse-text="Edit this page on github"
            class="group inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-inverse transition-colors"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </a>
        </div>

        <!-- Docs Footer Navigation -->
        <div class="max-w-4xl mx-auto w-full px-6 md:px-12 pb-20 mt-auto">
          <div class="border-t border-border pt-8 flex flex-col sm:flex-row justify-between gap-8">
            <!-- Previous -->
            <NuxtLink
              v-if="prevPage"
              :to="prevPage.path"
              class="group flex flex-col items-start gap-2 sm:max-w-[45%]"
            >
              <span
                class="mono text-[10px] uppercase tracking-widest text-subtle font-bold group-hover:text-inverse transition-colors"
              >
                {{ prevPage.group }}
              </span>
              <div
                class="flex items-center gap-2 text-lg font-bold text-inverse group-hover:underline decoration-2 underline-offset-4 decoration-inverse"
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
            </NuxtLink>
            <div v-else />

            <!-- Next -->
            <NuxtLink
              v-if="nextPage"
              :to="nextPage.path"
              class="group flex flex-col items-end gap-2 sm:max-w-[45%] text-right"
            >
              <span
                class="mono text-[10px] uppercase tracking-widest text-subtle font-bold group-hover:text-inverse transition-colors"
              >
                {{ nextPage.group }}
              </span>
              <div
                class="flex items-center gap-2 text-lg font-bold text-inverse group-hover:underline decoration-2 underline-offset-4 decoration-inverse"
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
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Right Sidebar: TOC -->
      <aside
        v-if="tocSections.length"
        class="hidden xl:block w-64 shrink-0 border-l border-border"
      >
        <div
          class="header-shell sticky top-[calc(var(--header-h)+2rem)] h-fit max-h-[calc(100vh-var(--header-h)-3rem)] overflow-y-auto px-6 py-12 scrollbar-thin"
        >
          <TableOfContents :sections="tocSections" :active-section="activeSection" />
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
  background: var(--color-border);
  border-radius: 2px;
}
.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: var(--color-subtle);
}
</style>
