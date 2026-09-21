<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useSupermouse } from "@supermousejs/vue";
import type { CursorMode, ScopeHandle, SupermousePlugin } from "@supermousejs/core";

/**
 * Sandbox shared by the inline docs previews and the playground modal. It owns
 * no cursor: it registers a scope with the caller's plugins, so the core handles
 * the hand-off to and from the page cursor.
 */
const props = withDefaults(
  defineProps<{
    /** Fresh plugin list for the scope. Called on every mount. */
    plugins: () => SupermousePlugin[];
    /** Tailwind height classes for inline docs usage. */
    heightClass?: string;
    /** Hide the centre label (docs previews are label-free). */
    bare?: boolean;
    /** Native-pointer policy for this region. */
    cursor?: CursorMode;
    /** Reveal the sample-targets strip under the canvas. */
    targets?: boolean;
  }>(),
  {
    heightClass: "h-72 md:h-80",
    bare: false,
    cursor: "auto",
    targets: false
  }
);

const containerRef = ref<HTMLElement | null>(null);
const active = ref(false);
const { instance: pageCursor } = useSupermouse();

let scope: ScopeHandle | null = null;

const release = (): void => {
  scope?.remove();
  scope = null;
};

const mount = (): void => {
  const app = pageCursor.value;
  if (!app || !containerRef.value) return;

  release();
  scope = app.addScope({
    name: "preview",
    container: containerRef.value,
    cursor: props.cursor,
    plugins: props.plugins()
  });
};

onMounted(mount);
onBeforeUnmount(release);

watch(() => pageCursor.value, mount);
watch(() => props.cursor, (cursor) => scope?.setCursor(cursor));
watch(() => props.plugins, mount);
</script>

<template>
  <div
    ref="containerRef"
    class="w-full relative overflow-hidden bg-surface flex flex-col"
    :class="heightClass"
    @mouseenter="active = true"
    @mouseleave="active = false"
  >
    <div class="absolute inset-0 grid-bg-soft pointer-events-none" />

    <div
      v-if="!bare"
      class="flex-1 flex items-center justify-center relative z-10 pointer-events-none"
    >
      <h1
        class="text-4xl md:text-6xl font-bold text-faint tracking-tighter select-none pointer-events-none text-center"
        :class="active ? 'opacity-30' : 'opacity-100'"
      >
        {{ active ? "Move Around" : "Test Area" }}
      </h1>
    </div>
    <div v-else class="flex-1 relative z-10 pointer-events-none" />

    <slot />

    <!--
      Sample targets. The attributes are the demo's capability declarations:
      whichever plugins the current recipe installs decide what they mean.
    -->
    <div
      v-if="targets"
      class="h-12 border-t border-border bg-surface relative z-20 flex items-stretch justify-center overflow-x-auto code-scroll"
      data-lenis-prevent
    >
      <button
        class="px-6 md:px-8 bg-surface text-inverse text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-surface transition-colors duration-100 ease-out shrink-0"
        data-supermouse-text="Click me"
        data-supermouse-icon="pointer"
        data-supermouse-stick="true"
      >
        Button
      </button>

      <div class="flex items-center justify-center w-16 shrink-0">
        <button
          class="w-8 h-8 rounded-full border border-faint bg-surface-subtle hover:bg-inverse hover:border-inverse transition-colors"
          title="Circle Test"
          data-supermouse-magnetic="true"
        />
      </div>

      <div
        class="flex items-center px-6 md:px-8 text-sm font-bold text-inverse hover:bg-surface-muted transition-colors shrink-0"
        data-hover
        data-supermouse-text="Go to Link"
        data-supermouse-icon="pointer"
      >
        <span class="underline decoration-2 underline-offset-4">Hyperlink</span>
      </div>

      <input
        type="text"
        placeholder="Type here..."
        class="px-4 md:px-6 w-28 md:w-56 bg-surface text-sm font-mono focus:outline-none focus:bg-surface-muted transition-colors placeholder:text-subtle shrink-0"
        data-supermouse-icon="text"
      />

      <div
        class="w-12 flex items-center justify-center bg-surface hover:bg-surface-muted cursor-wait shrink-0"
        data-supermouse-icon="loading"
        title="Hover to test loading icon"
      >
        <div class="w-1.5 h-1.5 bg-faint rounded-full" />
      </div>
    </div>
  </div>
</template>
