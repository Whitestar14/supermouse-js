<script setup lang="ts">
import type { ChapterSlice } from "../registry";

/**
 * A filmstrip of the whole tour, one row per chapter. The ticks give the tour
 * a sense of scale — forty cursors is a lot to hold in your head, and a rail
 * that fills up as you pass through says how far along you are without a
 * single number.
 */
defineProps<{
  chapters: ChapterSlice[];
  index: number;
}>();

const emit = defineEmits<{ (event: "jump", start: number): void }>();
</script>

<template>
  <nav class="rail" data-ui aria-label="Chapters">
    <button
      v-for="chapter in chapters"
      :key="chapter.id"
      type="button"
      class="rail__row"
      :class="{ 'is-current': chapter.indices.includes(index) }"
      :aria-current="chapter.indices.includes(index) ? 'true' : undefined"
      :title="chapter.blurb"
      @click="emit('jump', chapter.start)"
    >
      <span class="rail__name">{{ chapter.label }}</span>
      <span class="rail__ticks" aria-hidden="true">
        <i
          v-for="at in chapter.indices"
          :key="at"
          class="rail__tick"
          :class="{
            'is-done': at < index,
            'is-current': at === index
          }"
        />
      </span>
    </button>
  </nav>
</template>
