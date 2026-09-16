<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useSupermouse, Supermouse, type SupermouseInstance } from "@supermousejs/vue";

/**
 * DemoStage — a scoped sandbox where a Supermouse instance lives and dies with
 * the component. This is the interactive heart shared by:
 *
 *  - `CursorEditor.vue`  (the full playground modal)
 *  - `CursorDemo.vue`    (inline interactive previews inside docs content)
 *
 * The stage suspends the page-level cursor on hover, boots its own instance
 * with the caller's `setup` function, and tears it down on leave/unmount. Any
 * plugin can run here "as shipped" — the stage knows nothing about plugins.
 *
 * Visually it is a *canvas*: a quiet grid on the page surface, no chrome of its
 * own. The surrounding shell (border, header, optional target strip) belongs to
 * the caller, so a docs preview and the full editor use the exact same surface
 * while looking like whatever contains them.
 */
const props = withDefaults(
  defineProps<{
    /** Boot the demo's plugins onto the stage's own Supermouse instance. */
    setup: (app: SupermouseInstance) => void;
    /** Tailwind height classes for inline docs usage. */
    heightClass?: string;
    /** Hide the centre "Test Area" label (docs previews are label-free). */
    bare?: boolean;
    /** Physics smoothing for the stage's own instance. */
    smoothness?: number;
    /** Native-pointer policy passed to the stage's instance. */
    showNative?: boolean;
    /**
     * Reveal the sample-targets strip (button, circle, link, input, loading).
     * Off by default: the strip is useful when you want to test hover states,
     * otherwise it is noise under the cursor.
     */
    targets?: boolean;
  }>(),
  {
    heightClass: "h-72 md:h-80",
    bare: false,
    smoothness: 0.15,
    showNative: false,
    targets: false
  }
);

const containerRef = ref<HTMLElement | null>(null);
const active = ref(false);
const { instance: globalCursor, isEnabled: globalEnabled } = useSupermouse();

let mouse: SupermouseInstance | null = null;

const cleanupAttributes = (): void => {
  if (!containerRef.value) return;
  // Slots may (re)render magnetic/stick targets; strip stale attributes so a
  // destroyed instance can never keep dragging elements around.
  containerRef.value
    .querySelectorAll("[data-supermouse-magnetic], [data-supermouse-stick]")
    .forEach((el) => {
      el.removeAttribute("data-supermouse-magnetic");
      el.removeAttribute("data-supermouse-stick");
    });
};

const boot = (): void => {
  if (!containerRef.value) return;
  teardown();
  cleanupAttributes();

  mouse = new Supermouse({ container: containerRef.value, smoothness: props.smoothness });
  mouse.setCursor(props.showNative ? "both" : "auto");
  if (!globalEnabled.value) mouse.disable();
  props.setup(mouse);
};

const teardown = (): void => {
  mouse?.destroy();
  mouse = null;
};

const onEnter = (): void => {
  active.value = true;
  globalCursor.value?.suspend();
  mouse?.enable();
};

const onLeave = (): void => {
  active.value = false;
  mouse?.disable();
  globalCursor.value?.resume();
};

onMounted(boot);
onUnmounted(teardown);

// Live physics: the editor's Lag slider and demo drawers update this prop.
watch(
  () => props.smoothness,
  (smooth) => {
    if (mouse) mouse.options.smoothness = smooth;
  }
);

defineExpose({ boot, teardown });
</script>

<template>
  <div
    ref="containerRef"
    class="w-full relative overflow-hidden bg-surface flex flex-col"
    :class="heightClass"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <!-- Canvas grid — softer than the landing-page sections on purpose. -->
    <div class="absolute inset-0 grid-bg-soft pointer-events-none" />

    <!-- Centre hint (playground only; docs previews pass `bare`) -->
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

    <!-- Slot for demo-specific targets (buttons, links, cards…) -->
    <slot />

    <!--
      Sample targets: the same controls as before, but on demand. Kept flush
      with the shell so it reads as one strip rather than a toolbar bolted on.
    -->
    <div
      v-if="targets"
      class="h-12 border-t border-border bg-surface relative z-20 flex items-stretch justify-center overflow-x-auto code-scroll"
      data-lenis-prevent
    >
      <!-- Button -->
      <button
        class="px-6 md:px-8 bg-surface text-inverse text-xs font-bold uppercase tracking-widest hover:bg-inverse hover:text-surface transition-colors duration-100 ease-out shrink-0"
        data-supermouse-text="Click me"
      >
        Button
      </button>

      <!-- Circular Button -->
      <div class="flex items-center justify-center w-16 shrink-0">
        <button
          class="w-8 h-8 rounded-full border border-faint bg-surface-subtle hover:bg-inverse hover:border-inverse transition-colors"
          title="Circle Test"
        />
      </div>

      <!-- Link/Text -->
      <div
        class="flex items-center px-6 md:px-8 text-sm font-bold text-inverse hover:bg-surface-muted transition-colors shrink-0"
        data-hover
        data-supermouse-text="Go to Link"
      >
        <span class="underline decoration-2 underline-offset-4">Hyperlink</span>
      </div>

      <!-- Input -->
      <input
        type="text"
        placeholder="Type here..."
        class="px-4 md:px-6 w-28 md:w-56 bg-surface text-sm font-mono focus:outline-none focus:bg-surface-muted transition-colors placeholder:text-subtle shrink-0"
      />

      <!-- Loading Trigger -->
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
