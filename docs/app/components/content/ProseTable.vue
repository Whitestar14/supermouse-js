<script setup lang="ts">
/**
 * Markdown tables.
 *
 * MDC renders a bare `<table>` with no wrapper, so the usual "make it a block
 * with `overflow-x: auto`" trick breaks the table layout algorithm: the inner
 * table box becomes shrink-to-fit and a narrow table hugs the left edge of the
 * column with dead space beside it (and columns never line up with the text).
 *
 * A frame around the table gives both behaviours without hacky CSS: the table
 * keeps real table layout at `width: 100%`, and the frame supplies the
 * horizontal scroll on narrow screens so the page never slides sideways.
 * Styling lives in `index.css` (`.docs-table`) beside the other prose rules.
 */
</script>

<template>
  <div class="docs-table">
    <table>
      <slot />
    </table>
  </div>
</template>
