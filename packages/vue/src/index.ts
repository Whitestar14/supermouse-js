import {
  onMounted,
  onUnmounted,
  provide,
  inject,
  shallowRef,
  ref,
  type Ref,
  type InjectionKey
} from "vue";
import { Supermouse } from "@supermousejs/core";
import type { SupermouseOptions, SupermousePlugin, SupermouseInstance } from "@supermousejs/core";

export interface SupermouseContext {
  instance: Ref<SupermouseInstance | null>;
  isEnabled: Ref<boolean>;
}

export const SupermouseKey: InjectionKey<SupermouseContext> = Symbol("Supermouse");

/**
 * Initializes a Supermouse instance, handles its lifecycle, and provides it to the component tree.
 * Also exposes a reactive `isEnabled` ref that stays in sync with the instance's enable/disable state.
 *
 * @param options Core configuration options
 * @param plugins Array of plugins to install immediately
 */
export function provideSupermouse(
  options: SupermouseOptions = {},
  plugins: SupermousePlugin[] = []
): SupermouseContext {
  const instance = shallowRef<SupermouseInstance | null>(null);
  const isEnabled = ref(true);

  onMounted(() => {
    if (instance.value) return;

    const mouse = new Supermouse(options);
    plugins.forEach((p) => mouse.use(p));

    // Patch enable/disable to keep isEnabled reactive
    const origEnable = mouse.enable.bind(mouse);
    const origDisable = mouse.disable.bind(mouse);

    mouse.enable = () => {
      origEnable();
      isEnabled.value = true;
    };

    mouse.disable = () => {
      origDisable();
      isEnabled.value = false;
    };

    instance.value = mouse;
  });

  onUnmounted(() => {
    if (instance.value) {
      instance.value.destroy();
      instance.value = null;
      isEnabled.value = true;
    }
  });

  const ctx: SupermouseContext = { instance, isEnabled };
  provide(SupermouseKey, ctx);
  return ctx;
}

/**
 * Injects the global Supermouse context (instance + reactive isEnabled).
 * @returns The context, or a default empty context if not provided.
 */
export function useSupermouse(): SupermouseContext {
  const ctx = inject(SupermouseKey);
  if (!ctx) {
    console.warn(
      "[Supermouse] No instance provided. Ensure provideSupermouse() is called in a parent component."
    );
    return {
      instance: shallowRef(null),
      isEnabled: ref(true)
    };
  }
  return ctx;
}

export { Supermouse } from "@supermousejs/core";
export type { SupermouseInstance, SupermouseOptions, SupermousePlugin } from "@supermousejs/core";
