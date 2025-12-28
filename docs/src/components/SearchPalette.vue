
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { DOCS_NAVIGATION } from '../navigation';
import { PLUGINS } from '../plugin-data';

const emit = defineEmits(['close']);
const router = useRouter();
const query = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const selectedIndex = ref(0);

// --- Keyword Dictionary ---
// Maps URL paths to synonyms or related concepts users might type
const PAGE_KEYWORDS: Record<string, string[]> = {
  '/docs/advanced/authoring': ['plugin', 'extension', 'key', 'add', 'create', 'write', 'builder', 'api', 'custom'],
  '/docs/guide/installation': ['setup', 'add', 'pnpm', 'npm', 'yarn', 'start', 'import'],
  '/docs/guide/usage': ['config', 'options', 'init', 'setup', 'main', 'provider'],
  '/docs/guide/troubleshooting': ['fix', 'bug', 'error', 'issue', 'glitch', 'problem', 'debug', 'doctor'],
  '/docs/advanced/architecture': ['core', 'loop', 'physics', 'math', 'internal', 'lifecycle'],
  '/docs/advanced/contributing': ['pr', 'github', 'repo', 'develop', 'help', 'cli', 'scaffold', 'generate', 'script', 'command', 'terminal'],
  '/docs/integrations/vue': ['component', 'composable', 'hook', 'nuxt'],
  '/docs/integrations/react': ['component', 'hook', 'nextjs', 'useeffect'],
};

interface SearchItem {
  label: string;
  path: string;
  type: 'Guide' | 'Plugin' | 'API';
  keywords: string[];
}

// --- 1. Indexing Strategy ---
const index = computed(() => {
  const items: SearchItem[] = [];

  // Index Documentation Pages
  DOCS_NAVIGATION.forEach(group => {
    group.items.forEach(item => {
      items.push({
        label: item.label,
        path: item.path,
        type: 'Guide',
        keywords: PAGE_KEYWORDS[item.path] || []
      });
    });
  });

  // Index Plugins (Rich Metadata)
  PLUGINS.forEach(p => {
    // Generate keywords for plugins based on their description and functionality
    const keywords = [p.id, p.package, ...(p.description ? p.description.split(' ') : [])];
    
    items.push({
      label: p.name,
      path: `/docs/plugins/${p.id}`,
      type: 'Plugin',
      keywords: keywords
    });
  });

  return items;
});

// --- 2. Fuzzy Search Logic ---
const results = computed(() => {
  const q = query.value.toLowerCase().trim();
  if (!q) return [];

  return index.value.filter(item => {
    // Check Label
    if (item.label.toLowerCase().includes(q)) return true;
    
    // Check Path
    if (item.path.toLowerCase().includes(q)) return true;

    // Check Keywords (The "Smart" Part)
    if (item.keywords.some(k => k.toLowerCase().includes(q))) return true;

    return false;
  }).slice(0, 8); // Limit results
});

// --- 3. Navigation Logic ---
const navigate = (path: string) => {
  router.push(path);
  emit('close');
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % results.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + results.value.length) % results.value.length;
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (results.value[selectedIndex.value]) {
      navigate(results.value[selectedIndex.value].path);
    }
  } else if (e.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  searchInput.value?.focus();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

watch(query, () => { selectedIndex.value = 0; });
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-white/80 backdrop-blur-sm" @click="emit('close')"></div>

    <!-- Modal -->
    <div class="relative w-full max-w-xl bg-white border-2 border-black shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
      
      <!-- Input -->
      <div class="flex items-center px-4 h-16 border-b-2 border-zinc-100">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-zinc-400 mr-4">
          <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input 
          ref="searchInput"
          v-model="query"
          type="text" 
          placeholder="Search docs, plugins, and guides..." 
          class="flex-1 h-full outline-none text-lg font-medium placeholder:text-zinc-300 bg-transparent"
        >
        <div class="mono text-[10px] bg-zinc-100 px-2 py-1 rounded text-zinc-400 font-bold">ESC</div>
      </div>

      <!-- Results (Lenis Prevent applied here) -->
      <div 
        v-if="results.length > 0" 
        class="p-2 bg-zinc-50 max-h-[300px] overflow-y-auto"
        data-lenis-prevent
      >
        <div class="mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 py-2">
            Results
        </div>
        <button 
          v-for="(res, i) in results" 
          :key="res.path"
          @click="navigate(res.path)"
          class="w-full text-left px-4 py-3 flex items-center justify-between group transition-colors border border-transparent"
          :class="i === selectedIndex ? 'bg-white border-zinc-200 shadow-sm' : 'hover:bg-white hover:border-zinc-200'"
        >
          <div>
            <span class="text-sm font-bold text-zinc-900 block">{{ res.label }}</span>
            <span class="text-[10px] text-zinc-400 block truncate max-w-[300px]">{{ res.path }}</span>
          </div>
          <span class="mono text-[10px] uppercase tracking-widest font-bold" 
                :class="res.type === 'Plugin' ? 'text-amber-600' : 'text-zinc-400'">
            {{ res.type }}
          </span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="query" class="p-8 text-center">
        <p class="text-zinc-400 font-mono text-xs">No results found for "{{ query }}"</p>
      </div>

      <div v-else class="p-8 text-center">
        <p class="text-zinc-300 font-mono text-xs uppercase tracking-widest">Type to search...</p>
      </div>

    </div>
  </div>
</template>
