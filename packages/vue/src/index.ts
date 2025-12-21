import { onMounted, onUnmounted, provide, inject, ref, type Ref } from 'vue';
import { Supermouse, type SupermouseOptions, type SupermousePlugin } from '@supermousejs/core';

const SupermouseSymbol = Symbol('Supermouse');

/**
 * Initializes Supermouse in a Vue component.
 * Automatically handles mounting and unmounting.
 * 
 * @param options Core configuration options
 * @param plugins Array of plugins to install immediately
 */
export function useSupermouse(
  options: SupermouseOptions = {}, 
  plugins: SupermousePlugin[] = []
) {
  const instance = ref<Supermouse | null>(null);

  onMounted(() => {
    // Prevent duplicate instances if called multiple times erroneously
    if (instance.value) return;

    const mouse = new Supermouse(options);
    
    plugins.forEach(p => mouse.use(p));
    
    instance.value = mouse;
  });

  onUnmounted(() => {
    if (instance.value) {
      instance.value.destroy();
      instance.value = null;
    }
  });

  return instance;
}

/**
 * Advanced: Provides a global Supermouse instance to all child components.
 * Ideal for App.vue.
 */
export function provideSupermouse(
  options: SupermouseOptions = {}, 
  plugins: SupermousePlugin[] = []
) {
  const instance = useSupermouse(options, plugins);
  provide(SupermouseSymbol, instance);
  return instance;
}

/**
 * Access the global Supermouse instance from any child component.
 * Useful for toggling cursor states or enabling specific plugins dynamically.
 */
export function injectSupermouse(): Ref<Supermouse | null> {
  const instance = inject<Ref<Supermouse | null>>(SupermouseSymbol);
  if (!instance) {
    console.warn('[Supermouse] No instance provided. Did you call provideSupermouse() in App.vue?');
    return ref(null);
  }
  return instance;
}