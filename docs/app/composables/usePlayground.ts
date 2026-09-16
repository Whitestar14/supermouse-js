import { ref, computed } from "vue";

/**
 * Global playground state.
 */
const isOpen = ref(false);
const activeRecipeId = ref<string | null>(null);
const lastRecipeId = ref<string | null>(null);

export function usePlayground() {
  const open = (recipeId: string): void => {
    lastRecipeId.value = activeRecipeId.value ?? recipeId;
    activeRecipeId.value = recipeId;
    isOpen.value = true;
  };

  const close = (): void => {
    isOpen.value = false;
  };

  const displayedRecipeId = computed(() => activeRecipeId.value ?? lastRecipeId.value);

  return {
    isOpen,
    activeRecipeId,
    displayedRecipeId,
    open,
    close
  };
}
