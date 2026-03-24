<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import Callout from "@/components/shared/Callout.vue";
import { RECIPES } from "@/components/playground/recipes";
import { usePlayground } from "@composables/usePlayground";

const { open } = usePlayground();

const PLAY_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4"><path d="M8 5v14l11-7z"/></svg>`;
</script>

<template>
  <DocsSection label="Guide" title="Cookbook">
    <Callout title="Desktop Recommended" class="notice hidden mb-10">
      The Studio provides real-time physics editing which is best experienced with a precise
      pointer.
    </Callout>

    <p class="text-lg text-zinc-600 mb-12 leading-relaxed max-w-2xl">
      A collection of pre-configured cursor effects. Launch a recipe to tweak parameters and grab
      the implementation code.
    </p>

    <div class="grid grid-cols-1 md:grid-cols-2 border-t border-l border-zinc-200">
      <div
        v-for="recipe in RECIPES"
        :key="recipe.id"
        class="group relative bg-white p-8 hover:bg-zinc-50 transition-colors flex flex-col border-b border-r border-zinc-200 min-h-[240px]"
      >
        <button
          class="play-action absolute top-0 right-0 w-12 h-12 bg-white border-l border-b border-zinc-200 flex items-center justify-center text-zinc-400 hover:bg-black hover:text-white hover:border-black transition-all z-20"
          title="Run in Studio"
          @click="open(recipe.id)"
        >
          <span v-html="PLAY_ICON" />
        </button>

        <div class="mb-8">
          <div
            class="w-12 h-12 border border-zinc-200 bg-white flex items-center justify-center text-zinc-900 shadow-sm"
          >
            <span class="w-6 h-6" v-html="recipe.icon" />
          </div>
        </div>

        <div class="flex-1 pr-8">
          <h3 class="text-xl font-bold text-zinc-900 tracking-tighter mb-2">
            {{ recipe.name }}
          </h3>
          <p class="text-sm text-zinc-500 leading-relaxed">
            {{ recipe.description }}
          </p>
        </div>

        <div class="mt-8">
          <span class="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
            ID: {{ recipe.id }}
          </span>
        </div>
      </div>
    </div>
  </DocsSection>
</template>

<style scoped>
.play-action {
  display: none;
}

@media (pointer: coarse) {
  .notice {
    display: block;
  }
}

@media (pointer: fine) {
  .play-action {
    display: flex;
  }
}
</style>
