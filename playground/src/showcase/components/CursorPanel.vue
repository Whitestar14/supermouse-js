<script setup lang="ts">
import { computed } from "vue";
import { chapterMeta } from "../chapters";
import type { CursorEntry } from "../types";

/**
 * One slide of the tour. Everything here is passive — the cursor is the
 * interactive part — so the panel is allowed to slide out from under the
 * pointer without stealing a single event.
 */
const props = defineProps<{
  entry: CursorEntry;
  current: string;
  total: string;
  /** Only the topmost panel accepts pointer events (for its props). */
  live: boolean;
}>();

const chapter = computed(() => chapterMeta(props.entry.chapter));
</script>

<template>
  <section class="panel" :class="{ 'panel--live': live }">
    <span class="panel__ghost" data-stagger aria-hidden="true">{{ current }}</span>

    <div v-if="entry.props?.length" class="panel__props">
      <div
        v-for="(prop, i) in entry.props"
        :key="i"
        class="prop"
        :class="`prop--${prop.shape ?? 'plate'}`"
        aria-hidden="true"
        v-bind="prop.attrs"
      >
        <span v-if="prop.label" class="prop__label">{{ prop.label }}</span>
      </div>
    </div>

    <footer class="panel__caption">
      <div class="panel__title" data-stagger>
        <p class="panel__chapter">
          {{ chapter.label }}
          <i>{{ chapter.blurb }}</i>
        </p>
        <h2 class="panel__name">{{ entry.name }}</h2>
        <p class="panel__tagline">{{ entry.tagline }}</p>
      </div>

      <div class="panel__meta" data-stagger>
        <span class="panel__count">
          <b>{{ current }}</b>
          <i>/</i>
          {{ total }}
        </span>
        <span class="panel__chips">
          <em v-for="name in entry.plugins" :key="name">{{ name }}</em>
        </span>
      </div>
    </footer>
  </section>
</template>
