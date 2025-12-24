import { onMounted, onUnmounted, provide, inject, shallowRef, type Ref, type InjectionKey } from 'vue';
import { Supermouse, type SupermouseOptions, type SupermousePlugin } from '@supermousejs/core';

export const SupermouseKey: InjectionKey<Ref<Supermouse | null>> = Symbol('Supermouse');

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
    // Prevent duplicate instances
    if (instance.value) return;

    // Initialize core
    const mouse = new Supermouse(options);
    
    // Install plugins
    plugins.forEach(p => mouse.use(p));
    
    instance.value = mouse;
  });

  onUnmounted(() => {
    if (instance.value) {
      instance.value.destroy();
      instance.value = null;
    }
  });

  // Provide the Ref so children can react to the instance becoming available
  provide(SupermouseKey, instance);
  
  return instance;
}

/**
 * Injects the global Supermouse instance from a parent component.
 * Returns a Ref that resolves to the instance once mounted.
 */
export function useSupermouse(): Ref<Supermouse | null> {
  const instance = inject(SupermouseKey);
  if (!instance) {
    console.warn('[Supermouse] No instance provided. Ensure provideSupermouse() is called in a parent component.');
    return shallowRef(null);
  }
  return instance;
}