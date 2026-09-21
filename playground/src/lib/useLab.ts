import { onUnmounted, ref, shallowRef, type Ref } from "vue";
import type { SupermouseInstance } from "@supermousejs/core";
import { attach } from "./driver";

/**
 * A lab owns one instance for its lifetime and detaches the driver on unmount.
 * The same lifecycle the docs recommend, with the frame loop handed to the
 * driver so the engine's own cost can be measured.
 */
export function useLab(
  host: Ref<HTMLElement | null>,
  factory: (host: HTMLElement) => SupermouseInstance
): { app: Ref<SupermouseInstance | null>; remount: () => void } {
  const app = shallowRef<SupermouseInstance | null>(null);
  let detach: (() => void) | null = null;

  function teardown(): void {
    detach?.();
    detach = null;
    app.value?.destroy();
    app.value = null;
  }

  function boot(): void {
    if (!host.value || app.value) return;
    const instance = factory(host.value);
    detach = attach(instance);
    app.value = instance;
  }

  onUnmounted(teardown);

  // Runs after the template ref is bound, so `host` is populated.
  requestAnimationFrame(boot);

  return {
    app,
    remount: () => {
      teardown();
      requestAnimationFrame(boot);
    }
  };
}

/** Samples a getter on an interval, for panels that read engine internals. */
export function usePoll<T>(read: () => T, ms = 120): Ref<T> {
  const value = ref(read()) as Ref<T>;
  const id = window.setInterval(() => {
    value.value = read();
  }, ms);
  onUnmounted(() => window.clearInterval(id));
  return value;
}
