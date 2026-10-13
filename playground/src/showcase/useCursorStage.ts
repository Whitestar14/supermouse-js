import { computed, onMounted, onUnmounted, reactive, ref, watch, type Ref } from "vue";
import { Supermouse, type SupermouseInstance } from "@supermousejs/core";
import { CHAPTERS, CURSORS, chapterOf, tally } from "./registry";
import type { CursorConfig, CursorEntry } from "./types";

/** The handle `addScope()` hands back; the core does not export the class. */
type ScopeHandle = ReturnType<SupermouseInstance["addScope"]>;

/**
 * Owns the one scope the whole page lives in.
 *
 * A cursor is a *plugin set*, not a component: switching cursors removes the
 * outgoing plugins and installs the incoming ones on the same scope, so the
 * pointer never crosses a scope boundary and the native cursor never flickers
 * back.
 *
 * The instance is built straight from the core rather than through the Vue
 * adapter: the showcase owns the entire document, so there is nothing to
 * `provide`, and driving the core keeps the demo free of a second Vue runtime
 * (pnpm hands `packages/vue` its own copy, and two copies means two
 * `provide`/`inject` symbol tables).
 */
export function useCursorStage(host: Ref<HTMLElement | null>) {
  const index = ref(0);
  const entry = computed<CursorEntry>(() => CURSORS[index.value]);
  const chapter = computed(() => chapterOf(index.value));
  const config = reactive<CursorConfig>({ ...CURSORS[0].defaults });

  /** Instance-wide physics, the two knobs every cursor shares. */
  const lag = ref(0.12);
  const native = ref(false);

  let app: SupermouseInstance | null = null;
  let scope: ScopeHandle | null = null;
  const installed = new Set<string>();

  const uninstall = (): void => {
    for (const name of installed) scope?.removePlugin(name);
    installed.clear();
  };

  const install = (): void => {
    if (!scope) return;
    uninstall();
    for (const plugin of entry.value.create(config)) {
      scope.use(plugin);
      if (plugin.name) installed.add(plugin.name);
    }
  };

  // Coalesce rebuilds: a structural edit and an entry change in the same tick
  // should only construct the plugin set once. A microtask is deliberate —
  // `requestAnimationFrame` is paused in background and occluded tabs, and a
  // cursor swap must not wait on a frame the browser has no reason to draw.
  let queued = false;
  const rebuild = (): void => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      install();
    });
  };

  const boot = (): void => {
    if (app || !host.value) return;

    app = new Supermouse({
      cursor: "custom",
      smoothness: lag.value,
      enableTouch: false
    });
    scope = app.addScope({
      name: "showcase",
      container: host.value,
      cursor: native.value ? "both" : "custom"
    });
    install();

    // Handy while iterating on a cursor: `__supermouse.state`, `.getScope()`.
    if (import.meta.env.DEV) {
      (window as unknown as { __supermouse?: SupermouseInstance }).__supermouse = app;
    }
  };

  // `onMounted` is enough: this component's own template ref is bound by then.
  onMounted(boot);

  /** Structural options are read at construction, so an edit rebuilds the set. */
  const structure = computed(() =>
    entry.value.controls
      .filter((control) => control.structural)
      .map((control) => `${control.key}=${String(config[control.key])}`)
      .join("|")
  );

  watch(index, () => {
    Object.assign(config, entry.value.defaults);
    rebuild();
  });
  watch(structure, rebuild);

  watch(lag, (value) => {
    if (app) app.options.smoothness = value;
  });
  watch(native, (value) => scope?.setCursor(value ? "both" : "custom"));

  onUnmounted(() => {
    app?.destroy();
    app = null;
    scope = null;
    installed.clear();
  });

  const go = (next: number): void => {
    const count = CURSORS.length;
    index.value = ((next % count) + count) % count;
  };

  /**
   * Digits address the *chapter*, not the tour: past forty cursors a global
   * digit map would be meaningless, while "the fourth optics cursor" is a
   * thing a person can actually aim at. Returns an absolute index; the caller
   * animates to it, so these stay free of state.
   */
  const inChapterTarget = (slot: number): number => {
    const indices = chapterOf(index.value).indices;
    if (slot < 1 || slot > indices.length) return index.value;
    return indices[slot - 1];
  };

  /** The first cursor of the neighbouring chapter, never its middle. */
  const chapterTarget = (delta: number): number => {
    const at = CHAPTERS.findIndex((chapter) => chapter.id === chapterOf(index.value).id);
    const next = (((at + delta) % CHAPTERS.length) + CHAPTERS.length) % CHAPTERS.length;
    return CHAPTERS[next].start;
  };

  const reset = (): void => {
    Object.assign(config, entry.value.defaults);
    lag.value = 0.12;
    native.value = false;
  };

  return {
    index,
    entry,
    chapter,
    chapters: CHAPTERS,
    config,
    lag,
    native,
    total: CURSORS.length,
    tally: computed(() => tally(index.value)),
    step: (delta: number) => go(index.value + delta),
    go,
    chapterTarget,
    inChapterTarget,
    reset
  };
}
