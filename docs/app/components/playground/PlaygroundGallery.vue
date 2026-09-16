<script setup lang="ts">
import { computed } from "vue";
import { RECIPES } from "@playground/recipes";
import type { PresetRecipe } from "@playground/recipes";

const props = withDefaults(
  defineProps<{
    /** Optional search filter applied to recipe names/descriptions. */
    query?: string;
  }>(),
  { query: "" }
);

const emit = defineEmits<{ open: [recipeId: string] }>();

const filteredRecipes = computed(() => {
  const q = props.query.toLowerCase().trim();
  if (!q) return RECIPES;
  return RECIPES.filter(
    (r: PresetRecipe) =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
  );
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-border border-b border-border">
    <!-- No-match note (search only) -->
    <div
      v-if="filteredRecipes.length === 0"
      class="md:col-span-2 bg-surface px-10 py-8 flex items-center gap-4"
    >
      <span class="mono text-2xl text-faint opacity-40">∅</span>
      <span class="mono text-xs uppercase tracking-widest font-bold text-subtle">
        No matching presets
      </span>
    </div>

    <!-- Playable recipes -->
    <button
      v-for="preset in filteredRecipes"
      :key="preset.id"
      class="group bg-surface p-10 text-left hover:bg-surface-muted transition-colors flex flex-col h-[280px] outline-none relative"
      data-supermouse-state="playground-card"
      @click="emit('open', preset.id)"
    >
      <div class="flex-1 mb-6 relative">
        <span
          class="w-10 h-10 text-inverse filter grayscale group-hover:grayscale-0 transition-all duration-500 block transform group-hover:scale-110 origin-top-left opacity-80 group-hover:opacity-100"
          v-html="preset.icon"
        />
      </div>
      <div class="mt-auto relative z-10">
        <div class="flex justify-between items-end mb-2">
          <h3
            class="text-lg font-bold text-inverse tracking-tight group-hover:translate-x-1 transition-transform"
          >
            {{ preset.name }}
          </h3>
        </div>
        <p class="text-xs text-muted font-mono leading-relaxed max-w-[90%] line-clamp-2">
          {{ preset.description }}
        </p>
      </div>
    </button>
  </div>
</template>
