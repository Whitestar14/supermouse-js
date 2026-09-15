<script setup lang="ts">
import { RECIPES } from "@playground/recipes";
import { usePlayground } from "@composables/usePlayground";

/**
 * Renders every playground recipe. The list comes from
 * `playground/recipes/items/*.ts` via `import.meta.glob`, so adding a recipe
 * makes it appear here and in the Cookbook page with no extra wiring.
 */
const { open } = usePlayground();
</script>

<template>
  <div class="my-10 grid grid-cols-1 border-t border-l border-zinc-200 md:grid-cols-2">
    <div
      v-for="recipe in RECIPES"
      :key="recipe.id"
      class="group relative flex min-h-[240px] flex-col border-r border-b border-zinc-200 bg-white p-8 transition-colors hover:bg-zinc-50"
    >
      <button
        class="absolute top-0 right-0 hidden h-12 w-12 items-center justify-center border-b border-l border-zinc-200 bg-white text-zinc-400 transition-all hover:border-black hover:bg-black hover:text-white md:flex"
        :title="`Run ${recipe.name} in the Studio`"
        @click="open(recipe.id)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <div class="mb-8 h-12 w-12 border border-zinc-200 bg-white p-3 text-zinc-900 shadow-sm">
        <span class="block h-full w-full" v-html="recipe.icon" />
      </div>

      <div class="flex-1 pr-8">
        <h3 class="mb-2 text-lg font-bold tracking-tighter text-zinc-900">{{ recipe.name }}</h3>
        <p class="text-sm text-zinc-500">{{ recipe.description }}</p>
      </div>

      <div class="mt-8 font-mono text-[9px] tracking-widest text-zinc-400 uppercase">
        ID: {{ recipe.id }}
      </div>
    </div>
  </div>
</template>
