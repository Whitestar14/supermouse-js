<script setup lang="ts">
import { RECIPES } from "@playground/recipes";

/**
 * Every recipe, auto-discovered from `playground/recipes/items/*.ts` — adding
 * one is enough to list it here.
 *
 * Each card links to the plugin page that owns the effect, where the live
 * `CursorDemo` preview runs the same idea in-scope instead of opening a modal.
 */
const RECIPE_PLUGIN: Record<string, string> = {
  "basic-dot": "dot",
  "context-icon": "smart-icon",
  "ghost-trail": "trail",
  "magnetic-button": "magnetic",
  sparkles: "sparkles",
  "sticky-element": "stick",
  "text-cursor": "text",
  "text-ring": "ring",
  "vehicle-pointer": "pointer"
};

const href = (id: string): string => {
  const plugin = RECIPE_PLUGIN[id];
  return plugin ? `/docs/plugins/${plugin}` : "/docs/plugins";
};
</script>

<template>
  <div class="my-10 grid grid-cols-1 border-t border-l border-border md:grid-cols-2">
    <NuxtLink
      v-for="recipe in RECIPES"
      :key="recipe.id"
      :to="href(recipe.id)"
      class="group relative flex min-h-[240px] flex-col border-r border-b border-border bg-surface p-8 transition-colors hover:bg-surface-muted"
    >
      <div
        class="mb-8 h-12 w-12 border border-border bg-surface p-3 text-inverse transition-colors group-hover:border-subtle"
      >
        <span class="block h-full w-full" v-html="recipe.icon" />
      </div>

      <div class="flex-1 pr-8">
        <h3 class="mb-2 text-lg font-bold tracking-tighter text-inverse">{{ recipe.name }}</h3>
        <p class="text-sm text-muted">{{ recipe.description }}</p>
      </div>

      <div
        class="mt-8 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-subtle"
      >
        Open plugin
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          class="transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </NuxtLink>
  </div>
</template>
