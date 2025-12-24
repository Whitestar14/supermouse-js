
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { DOCS_NAVIGATION } from '../navigation';

const route = useRoute();

const allRoutes = computed(() => {
  return DOCS_NAVIGATION.flatMap(group => group.items);
});

// Calculate Levenshtein distance
const getDistance = (a: string, b: string) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= b.length; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const indicator = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + indicator // substitution
      );
    }
  }

  return matrix[b.length][a.length];
};

const suggestion = computed(() => {
  const currentPath = route.path;
  if (currentPath.length < 2) return null;

  let closestMatch = null;
  let minDistance = Infinity;

  for (const item of allRoutes.value) {
    const dist = getDistance(currentPath, item.path);
    // Strict threshold: Match must be within ~40% of the string length to be relevant
    const threshold = Math.max(item.path.length * 0.4, 3);
    
    if (dist < minDistance && dist < threshold) {
      minDistance = dist;
      closestMatch = item;
    }
  }

  return closestMatch;
});
</script>

<template>
  <div class="h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center p-8 bg-white">
    <!-- Minimal 404 -->
    <div class="mb-4 text-[120px] leading-none font-bold text-zinc-100 select-none tracking-tighter">
      404
    </div>
    
    <h1 class="text-xl font-bold text-zinc-900 mb-2">Page Not Found</h1>
    
    <p class="text-zinc-500 mb-8 text-sm max-w-sm">
        The requested path <span class="text-zinc-900 font-medium">{{ route.path }}</span> could not be found.
    </p>

    <div v-if="suggestion" class="mb-10">
        <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Did you mean?</span>
        <router-link :to="suggestion.path" class="text-lg font-bold text-black border-b-2 border-black/10 hover:border-black transition-colors">
            {{ suggestion.label }}
        </router-link>
    </div>

    <router-link to="/" class="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors rounded-sm">
        Return Home
    </router-link>
  </div>
</template>
