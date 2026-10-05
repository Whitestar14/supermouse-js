<script setup lang="ts">
import { computed } from "vue";
import { useDocsNavigation, type NavItem } from "@config/navigation";

defineProps<{
  error: { statusCode: number; message?: string };
}>();

const route = useRoute();

const allRoutes = useDocsNavigation().flatMap((group) => group.items);

// Calculate Levenshtein distance
const getDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = Array.from({ length: b.length + 1 }, () =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) {
    matrix[i]![0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const indicator = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + indicator
      );
    }
  }

  return matrix[b.length]![a.length]!;
};

const suggestion = computed(() => {
  const currentPath = route.path;
  if (currentPath.length < 2) return null;

  let closestMatch: NavItem | null = null;
  let minDistance = Infinity;

  for (const item of allRoutes) {
    const dist = getDistance(currentPath, item.path);
    const threshold = Math.max(item.path.length * 0.4, 3);

    if (dist < minDistance && dist < threshold) {
      minDistance = dist;
      closestMatch = item;
    }
  }

  return closestMatch;
});

const handleError = () => clearError({ redirect: "/" });
</script>

<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-surface"
  >
    <img src="/not-found.svg" alt="Not found" class="size-32 max-w-full mb-3" />

    <div class="mb-4 text-9xl leading-none font-bold text-elevated select-none tracking-tighter">
      404
    </div>

    <h1 class="text-xl font-bold text-inverse mb-2">Page Not Found</h1>

    <p class="text-muted mb-8 text-sm max-w-sm">
      The requested path
      <span class="text-inverse font-medium">{{ route.path }}</span> could not be found.
    </p>

    <div v-if="suggestion" class="mb-10">
      <span class="text-[10px] font-bold text-subtle uppercase tracking-widest block mb-2">
        Did you mean?
      </span>
      <NuxtLink
        :to="suggestion.path"
        class="text-lg font-bold text-inverse border-b-2 border-inverse/10 hover:border-inverse transition-colors"
      >
        {{ suggestion.label }}
      </NuxtLink>
    </div>

    <button
      type="button"
      class="px-6 py-3 bg-inverse text-surface text-xs font-bold uppercase tracking-widest hover:bg-elevated transition-colors cursor-pointer"
      @click="handleError"
    >
      Return Home
    </button>
  </div>
</template>
