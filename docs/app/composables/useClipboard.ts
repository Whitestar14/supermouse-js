import { onUnmounted, ref } from "vue";

export function useClipboard(resetMs = 1600) {
  const copied = ref(false);
  let timer: ReturnType<typeof setTimeout> | null = null;

  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return false;
    }

    copied.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), resetMs);
    return true;
  };

  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return { copied, copy };
}
