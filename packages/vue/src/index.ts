import {
  onMounted,
  onUnmounted,
  provide,
  inject,
  shallowRef,
  type Ref,
  type InjectionKey,
} from "vue";
import {
  Supermouse,
  type SupermouseOptions,
  type SupermousePlugin,
} from "@supermousejs/core";

export const SupermouseKey: InjectionKey<Ref<Supermouse | null>> =
  Symbol("Supermouse");

/**
 * Initializes a Supermouse instance, handles its lifecycle, and provides it to the component tree.
 * Use this in your root component (e.g., App.vue).
 *
 * @param options Core configuration options
 * @param plugins Array of plugins to install immediately
 */
export function provideSupermouse(
  options: SupermouseOptions = {},
  plugins: SupermousePlugin[] = []
): Ref<Supermouse | null> {
  const instance = shallowRef<Supermouse | null>(null);

  onMounted(() => {
    if (instance.value) return;

    const mouse = new Supermouse(options);
    plugins.forEach((p) => mouse.use(p));
    instance.value = mouse;
  });

  onUnmounted(() => {
    if (instance.value) {
      instance.value.destroy();
      instance.value = null;
    }
  });

  provide(SupermouseKey, instance);

  return instance;
}

/**
 * Injects the global Supermouse instance from a parent component.
 * @returns A Ref containing the Supermouse instance or null if not provided.
 * @warn Make sure to call provideSupermouse() in a parent component, otherwise this will return null.
 */
export function useSupermouse(): Ref<Supermouse | null> {
  const instance = inject(SupermouseKey);
  if (!instance) {
    console.warn(
      "[Supermouse] No instance provided. Ensure provideSupermouse() is called in a parent component."
    );
    return shallowRef(null);
  }
  return instance;
}
