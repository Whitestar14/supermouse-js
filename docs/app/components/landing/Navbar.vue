<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { GITHUB_URL, APP_VERSION } from "@config/constants";
import { useSupermouse } from "@supermousejs/vue";
import { useTheme } from "@composables/useTheme";
import { useScrollLock } from "@composables/useScrollLock";
import { useAutoHideHeader } from "@composables/useAutoHideHeader";
import ThemeToggle from "./ThemeToggle.vue";

const emit = defineEmits<{ openSearch: [] }>();

const route = useRoute();

const mobileMenuOpen = ref(false);
const isSpinning = ref(false);
const showVersionMenu = ref(false);

const { instance: mouse, isEnabled: cursorEnabled } = useSupermouse();

const { isDark, toggle: toggleTheme } = useTheme();

useScrollLock(mobileMenuOpen);

useAutoHideHeader(mobileMenuOpen);

const versionMenuRef = ref<HTMLElement | null>(null);
const onDocClick = (e: MouseEvent) => {
  if (!showVersionMenu.value) return;
  if (versionMenuRef.value && !versionMenuRef.value.contains(e.target as Node)) {
    showVersionMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", onDocClick);
});
onBeforeUnmount(() => document.removeEventListener("click", onDocClick));

/* ---------- nav helpers ---------- */
const isActiveLink = (path: string): boolean =>
  path === "/" ? route.path === "/" : route.path === path || route.path.startsWith(`${path}/`);

const navLinkClass = (path: string): string =>
  isActiveLink(path)
    ? "text-inverse underline decoration-2 underline-offset-4 decoration-inverse"
    : "text-subtle hover:text-inverse";

const logoCursorText = computed(() => {
  if (!mouse.value) return "Loading...";
  return cursorEnabled.value ? "Switch to Native" : "Switch to Supermouse";
});

const toggleMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const triggerSpin = () => {
  if (isSpinning.value) return;
  isSpinning.value = true;

  setTimeout(() => {
    isSpinning.value = false;
    if (!mouse.value) return;
    if (cursorEnabled.value) mouse.value.disable();
    else mouse.value.enable();
  }, 700);
};
</script>

<template>
  <nav class="header-shell sticky top-0 w-full border-b border-border bg-surface z-50">
    <div class="flex items-stretch h-16 md:h-20 bg-surface relative z-50">
      <!-- 1. Cursor toggle -->
      <button
        type="button"
        class="w-20 md:w-24 border-r border-border flex items-center justify-center shrink-0 bg-surface hover:bg-surface-muted transition-colors outline-none"
        aria-label="Toggle cursor mode"
        :data-supermouse-text="logoCursorText"
        @click="triggerSpin"
      >
        <div class="group block p-4 pointer-events-none">
          <div
            class="w-8 h-8 transition-all duration-500 ease-out"
            :class="isSpinning ? 'rotate-[315deg] scale-125' : '-rotate-45 group-hover:scale-110'"
          >
            <svg
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="w-full h-full"
            >
              <g transform="rotate(90 16 16)">
                <path
                  d="M25,30a5.82,5.82,0,0,1-1.09-.17l-.2-.07-7.36-3.48a.72.72,0,0,0-.35-.08.78.78,0,0,0-.33.07L8.24,29.54a.66.66,0,0,1-.2.06,5.17,5.17,0,0,1-1,.15,3.6,3.6,0,0,1-3.29-5L12.68,4.2a3.59,3.59,0,0,1,6.58,0l9,20.74A3.6,3.6,0,0,1,25,30Z"
                  fill="#F2F5F8"
                />
                <path
                  d="M16,3A2.59,2.59,0,0,1,18.34,4.6l9,20.74A2.59,2.59,0,0,1,25,29a5.42,5.42,0,0,1-.86-.15l-7.37-3.48a1.84,1.84,0,0,0-.77-.17,1.69,1.69,0,0,0-.73.16l-7.4,3.31a5.89,5.89,0,0,1-.79.12,2.59,2.59,0,0,1-2.37-3.62L13.6,4.6A2.58,2.58,0,0,1,16,3m0-2h0A4.58,4.58,0,0,0,11.76,3.8L2.84,24.33A4.58,4.58,0,0,0,7,30.75a6.08,6.08,0,0,0,1.21-.17,1.87,1.87,0,0,0,.4-.13L16,27.18l7.29,3.44a1.64,1.64,0,0,0,.39.14A6.37,6.37,0,0,0,25,31a4.59,4.59,0,0,0,4.21-6.41l-9-20.75A4.62,4.62,0,0,0,16,1Z"
                  fill="#111920"
                />
              </g>
            </svg>
          </div>
        </div>
      </button>

      <!-- 2. Brand + Search column (fluid) -->
      <div
        class="flex-1 flex items-center gap-4 px-6 md:px-8 border-r border-border bg-surface min-w-0"
      >
        <!-- Brand + version (shrink-0 so search can flex) -->
        <div class="flex items-center gap-4 shrink-0">
          <NuxtLink
            to="/"
            class="flex items-center text-lg md:text-xl font-bold tracking-tighter text-inverse group"
          >
            <div class="flex items-baseline">
              <span>supermouse</span>
              <div
                class="w-[0.2em] h-[0.2em] bg-current rounded-full mx-[0.05em] relative top-[1px]"
              />
              <span>js</span>
            </div>
          </NuxtLink>

          <!-- Version dropdown -->
          <div ref="versionMenuRef" class="relative hidden sm:block">
            <button
              type="button"
              class="flex items-center gap-1 text-[10px] font-bold text-subtle tracking-widest uppercase hover:text-inverse relative top-[1px]"
              @click="showVersionMenu = !showVersionMenu"
            >
              {{ APP_VERSION.slice(0, 4) }}
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                :class="showVersionMenu ? 'rotate-180' : ''"
                class="transition-transform"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <div
              v-if="showVersionMenu"
              class="absolute top-full left-0 mt-px w-48 bg-surface border border-border z-50 flex flex-col"
            >
              <a
                href="#"
                class="flex items-center justify-between px-4 py-3 text-xs font-bold text-inverse bg-surface hover:bg-inverse hover:text-surface uppercase tracking-widest border-b border-border"
              >
                <span>{{ APP_VERSION.slice(0, 4) }}</span>
                <div class="w-1.5 h-1.5 bg-accent rounded-none" />
              </a>
              <a
                :href="GITHUB_URL.concat('/tree/legacy')"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-between px-4 py-3 text-xs font-bold text-muted hover:bg-inverse hover:text-surface uppercase tracking-widest"
              >
                <span>v1.0 (Legacy)</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Search (fixed-width steps: icon at md, full bar from lg up) -->
        <button
          type="button"
          class="hidden md:flex ml-auto w-10 lg:w-72 xl:w-96 items-center justify-center lg:justify-between gap-3 h-10 shrink-0 px-2 lg:px-3 bg-surface-muted border border-border hover:border-subtle/60 transition-colors group outline-none focus-visible:border-subtle"
          aria-label="Search docs"
          @click="emit('openSearch')"
        >
          <svg
            class="w-3.5 h-3.5 shrink-0 text-subtle group-hover:text-inverse"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span
            class="hidden lg:inline truncate text-xs text-subtle group-hover:text-body font-medium"
          >
            Search Docs
          </span>
          <span
            class="hidden lg:inline shrink-0 mono text-[10px] text-faint group-hover:text-muted font-bold bg-surface px-1.5 border border-border"
          >
            ⌘K
          </span>
        </button>

        <!-- Theme toggle stays reachable on mobile (the nav column hides < md) -->
        <div class="md:hidden ml-auto flex items-center">
          <ThemeToggle :is-dark="isDark" @toggle="toggleTheme" />
        </div>

        <!-- Mobile trigger -->
        <button
          type="button"
          class="md:hidden flex items-center justify-center w-12 h-10 outline-none"
          aria-label="Toggle menu"
          @click="toggleMenu"
        >
          <span
            v-if="!mobileMenuOpen"
            class="mono text-[10px] font-bold uppercase tracking-widest text-inverse"
          >
            MENU
          </span>
          <div v-else class="w-8 h-px bg-inverse" />
        </button>
      </div>

      <!-- 3. Nav links -->
      <div class="hidden md:flex h-full items-center px-8 gap-8 bg-surface shrink-0">
        <NuxtLink
          to="/"
          class="mono text-[11px] uppercase tracking-[0.1em] font-bold transition-colors"
          :class="navLinkClass('/')"
        >
          Home
        </NuxtLink>
        <NuxtLink
          to="/docs"
          class="mono text-[11px] uppercase tracking-[0.1em] font-bold transition-colors"
          :class="navLinkClass('/docs')"
        >
          Docs
        </NuxtLink>
        <span
          class="relative mono text-[11px] uppercase tracking-[0.1em] font-bold text-faint inline-flex items-center cursor-not-allowed select-none"
          aria-disabled="true"
          title="The plugin gallery is coming soon"
        >
          Gallery
          <span
            class="absolute -top-2 -right-1 mono text-[7px] leading-none tracking-widest text-faint border border-border px-0.5 py-px"
          >
            Soon
          </span>
        </span>
      </div>

      <!--
        Width and padding intentionally mirror the docs layout's TOC rail
        (`w-64`, `border-l`, `px-6`) so the header's hairline and the rail's
        hairline are the same vertical line on desktop.
      -->
      <div
        class="hidden md:flex w-64 h-full items-center gap-6 px-6 bg-surface border-l border-border shrink-0"
      >
        <ThemeToggle :is-dark="isDark" @toggle="toggleTheme" />

        <a
          :href="GITHUB_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-2 mono text-[11px] uppercase tracking-[0.1em] font-bold text-subtle hover:text-inverse transition-colors"
        >
          Github
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          >
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </a>
      </div>
    </div>

    <Teleport to="body">
      <div
        class="md:hidden fixed inset-0 top-[var(--header-h)] bg-surface z-60 transition-all duration-300 ease-in-out flex flex-col"
        :class="mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'"
      >
        <div class="absolute inset-0 grid-bg opacity-50 pointer-events-none" />

        <div class="relative z-10 flex flex-col gap-8 p-12 mt-4">
          <button
            type="button"
            class="text-left text-4xl font-bold tracking-tighter text-subtle inline-flex items-center gap-4 group"
            @click="
              emit('openSearch');
              toggleMenu();
            "
          >
            Search...
          </button>

          <NuxtLink
            to="/"
            class="text-4xl font-bold tracking-tighter text-inverse inline-flex items-center gap-4 group"
            @click="toggleMenu"
          >
            Home
          </NuxtLink>
          <NuxtLink
            to="/docs"
            class="text-4xl font-bold tracking-tighter text-inverse inline-flex items-center gap-4 group"
            @click="toggleMenu"
          >
            Docs
          </NuxtLink>
          <span
            class="relative w-full text-4xl font-bold tracking-tighter text-faint cursor-not-allowed select-none"
            aria-disabled="true"
          >
            Gallery
            <span
              class="absolute right-0 top-1 mono text-[9px] leading-none font-bold uppercase tracking-widest text-faint border border-border px-1 py-0.5"
            >
              Soon
            </span>
          </span>
          <a
            :href="GITHUB_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="text-4xl font-bold tracking-tighter text-inverse inline-flex items-center gap-4 group"
          >
            Github
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              class="text-inverse transition-transform group-hover:-translate-y-1 group-hover:translate-x-1"
            >
              <path d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
          </a>
        </div>
      </div>
    </Teleport>
  </nav>
</template>
