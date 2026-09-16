<script setup lang="ts">
import { ref } from "vue";
import { usePageHead } from "@/composables/usePageHead";
import { usePlayground } from "@composables/usePlayground";
import PlaygroundGallery from "@playground/PlaygroundGallery.vue";
import { RECIPES } from "@playground/recipes";

// Global state controller
const { open } = usePlayground();

const searchQuery = ref("");

usePageHead({
  title: "Labs",
  description:
    "A modular, high-performance cursor engine for building dynamic, beautiful cursors for the web."
});
</script>

<template>
  <div class="text-inverse relative min-h-screen bg-surface">
    <!-- Layout Logic -->
    <div class="flex flex-col min-h-[calc(100vh-80px)]">
      <!-- Header -->
      <div class="sticky top-0 z-30 flex bg-surface border-b border-border h-16 md:h-20">
        <div
          class="w-20 md:w-24 border-r border-border shrink-0 flex items-center justify-center bg-surface"
        />
        <div
          class="hidden lg:flex w-[400px] xl:w-[480px] items-center px-12 border-r border-border bg-surface"
        >
          <h1 class="font-bold tracking-tight text-inverse text-lg">Supermouse Labs</h1>
        </div>
        <div class="flex-1 flex items-center bg-surface-muted/50">
          <div class="w-16 h-full flex items-center justify-center text-subtle shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search experiments..."
            class="w-full h-full bg-transparent outline-none text-sm font-medium text-inverse placeholder:text-subtle font-mono tracking-tight"
          />
          <div v-if="searchQuery" class="pr-6">
            <span class="mono text-[10px] font-bold bg-border text-body px-2 py-1">
              {{ RECIPES.length }} recipes · filtering in gallery
            </span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="flex flex-col lg:flex-row flex-1 items-stretch">
        <div class="hidden lg:block w-24 border-r border-border shrink-0 bg-surface" />

        <div
          class="w-full lg:w-[400px] xl:w-[480px] border-b lg:border-b-0 lg:border-r border-border bg-surface p-8 md:p-12 flex flex-col relative z-10"
        >
          <div class="lg:hidden mb-8">
            <h1 class="font-bold tracking-tight text-inverse text-2xl">Supermouse Labs</h1>
          </div>
          <div class="lg:sticky lg:top-32">
            <h2
              class="text-5xl mt-8 md:text-6xl font-bold tracking-tighter text-inverse mb-8 leading-[0.95]"
            >
              Plugin<br />Gallery
            </h2>
            <p class="text-lg text-body font-medium leading-relaxed mb-8 text-pretty">
              Explore experimental plugins and standard tools in this interactive playground. Enter
              the Studio Editor to configure physics, tweak visuals, and export code.
            </p>
            <div
              class="hidden lg:block mono text-[10px] uppercase tracking-widest text-subtle font-bold mb-4"
            >
              Select a preset to edit
            </div>
          </div>
        </div>

        <div class="flex-1 bg-surface min-h-[50vh]">
          <PlaygroundGallery :query="searchQuery" @open="open" />
        </div>
      </div>
    </div>
  </div>
</template>
