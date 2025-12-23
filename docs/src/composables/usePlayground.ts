import { ref } from 'vue';

const isOpen = ref(false);
const activeRecipeId = ref<string | null>(null);

export function usePlayground() {
  const open = (recipeId: string) => {
    activeRecipeId.value = recipeId;
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
    // Delay clearing ID to prevent layout jumps during transition
    setTimeout(() => {
      if (!isOpen.value) activeRecipeId.value = null;
    }, 300);
  };

  return {
    isOpen,
    activeRecipeId,
    open,
    close
  };
}
