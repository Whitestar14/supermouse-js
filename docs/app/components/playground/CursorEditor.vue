<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import EditorControls from "./EditorControls.vue";
import DemoStage from "./DemoStage.vue";
import CodeBlock from "@components/content/CodeBlock.vue";
import { RECIPES } from "@playground/recipes";
import { generateCode } from "@utils/code-generator";

const props = defineProps<{
  activeRecipeId: string | null;
}>();

const emit = defineEmits(["close", "navigate"]);

type SidebarMode = "config" | "code";

const config = ref<Record<string, any>>({});
const globalConfig = ref({
  smoothness: 0.15,
  showNative: false
});
const mode = ref<SidebarMode>("config");
const { copied: isCopied, copy: writeToClipboard } = useClipboard(2000);

const currentRecipe = computed(() => {
  return (RECIPES.find((r) => r.id === props.activeRecipeId) || RECIPES[0])!;
});

const currentIndex = computed(() => {
  if (!props.activeRecipeId) return -1;
  return RECIPES.findIndex((r) => r.id === props.activeRecipeId);
});

const formattedIndex = computed(() => {
  const current = String(currentIndex.value + 1).padStart(2, "0");
  const total = String(RECIPES.length).padStart(2, "0");
  return { current, total };
});

const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(
  () => currentIndex.value !== -1 && currentIndex.value < RECIPES.length - 1
);

const goPrev = () => {
  if (!hasPrev.value) return;
  const prev = RECIPES[currentIndex.value - 1];
  if (prev) emit("navigate", prev.id);
};

const goNext = () => {
  if (!hasNext.value) return;
  const next = RECIPES[currentIndex.value + 1];
  if (next) emit("navigate", next.id);
};

const generatedCode = computed(() => {
  return generateCode(currentRecipe.value.id, config.value, globalConfig.value);
});

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    goPrev();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    goNext();
  }
};

onMounted(() => window.addEventListener("keydown", handleKeydown));
onUnmounted(() => window.removeEventListener("keydown", handleKeydown));

const liveConfig = reactive<Record<string, any>>({});

watch(
  config,
  (val) => {
    for (const key of Object.keys(liveConfig)) {
      if (!(key in val)) delete liveConfig[key];
    }
    Object.assign(liveConfig, val);
  },
  { immediate: true }
);

const stageSetup = computed(() => {
  const recipe = currentRecipe.value;
  return (app: Parameters<NonNullable<typeof recipe.setup>>[0]) => recipe.setup(app, liveConfig);
});

watch(
  () => props.activeRecipeId,
  (newId) => {
    if (newId) {
      const recipe = RECIPES.find((r) => r.id === newId);
      if (recipe) {
        const defaults: Record<string, any> = {};
        recipe.schema.forEach((field) => {
          defaults[field.key] = field.defaultValue;
        });
        config.value = defaults;
        globalConfig.value = { smoothness: 0.15, showNative: false };
        isCopied.value = false;
      }
    }
  },
  { immediate: true }
);

const copyCode = async (): Promise<void> => {
  await writeToClipboard(generatedCode.value);
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="activeRecipeId"
      class="fixed inset-0 z-[100] bg-surface/95 flex items-center justify-center p-0 md:p-6 lg:p-8"
    >
      <div
        class="bg-surface w-full h-full max-w-[1600px] border border-strong flex flex-col overflow-hidden relative shadow-2xl"
      >
        <!-- Mobile Close -->
        <button
          class="absolute top-0 right-0 z-50 w-12 h-12 flex items-center justify-center bg-inverse text-surface hover:bg-elevated transition-colors lg:hidden cursor-pointer"
          aria-label="Close Editor"
          @click="emit('close')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <!-- Desktop Close -->
        <button
          class="absolute top-0 right-0 z-50 h-12 px-8 bg-inverse text-surface text-xs font-bold uppercase tracking-widest hover:bg-elevated transition-colors hidden lg:flex items-center justify-center border-l border-b border-strong cursor-pointer"
          @click="emit('close')"
        >
          Close Editor
        </button>

        <div class="flex flex-1 overflow-hidden flex-col lg:flex-row">
          <!-- Sidebar -->
          <div
            class="w-full lg:w-[400px] border-b lg:border-b-0 lg:border-r border-border shrink-0 h-2/5 lg:h-full flex flex-col bg-surface z-10"
          >
            <!-- Tabs -->
            <div class="h-12 flex border-b border-border shrink-0 bg-surface-muted">
              <button
                class="flex-1 text-xs font-bold uppercase tracking-widest transition-colors duration-150 border-r border-border cursor-pointer"
                :class="
                  mode === 'config'
                    ? 'bg-inverse text-surface'
                    : 'text-subtle bg-surface hover:text-inverse hover:bg-surface-muted'
                "
                @click="mode = 'config'"
              >
                Configuration
              </button>
              <button
                class="flex-1 text-xs font-bold uppercase tracking-widest transition-colors duration-150 cursor-pointer"
                :class="
                  mode === 'code'
                    ? 'bg-inverse text-surface'
                    : 'text-subtle bg-surface hover:text-inverse hover:bg-surface-muted'
                "
                @click="mode = 'code'"
              >
                Export Code
              </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-hidden relative">
              <div
                v-if="mode === 'config'"
                class="absolute inset-0 overflow-y-auto"
                data-lenis-prevent
              >
                <EditorControls
                  v-model:config="config"
                  v-model:global-config="globalConfig"
                  :schema="currentRecipe.schema"
                />
              </div>

              <div
                v-else
                class="absolute inset-0 overflow-y-auto bg-code-surface flex flex-col"
                data-lenis-prevent
              >
                <div class="flex-1 min-h-0 flex flex-col">
                  <CodeBlock :code="generatedCode" :clean="true" class="h-full" />
                </div>

                <button
                  class="h-12 border-t border-elevated text-xs font-mono font-bold uppercase tracking-wider shrink-0 sticky bottom-0 transition-all duration-200 flex items-center justify-center cursor-pointer"
                  :class="
                    isCopied
                      ? 'bg-surface text-inverse border-surface'
                      : 'bg-code-surface text-code-muted hover:bg-inverse hover:text-surface'
                  "
                  @click="copyCode"
                >
                  <span v-if="isCopied">Copied to Clipboard</span>
                  <span v-else>Copy Code</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div class="flex-1 bg-surface-muted h-3/5 lg:h-full overflow-hidden flex flex-col">
            <!-- Preview Nav Bar -->
            <div
              class="h-12 border-b border-border bg-surface flex items-center justify-between pl-4 pr-16 lg:pr-48 shrink-0"
            >
              <!-- Left: Icon & Recipe Title -->
              <div class="flex items-center gap-3 min-w-0">
                <span
                  class="w-5 h-5 flex items-center justify-center filter grayscale opacity-80 shrink-0"
                  v-html="currentRecipe.icon"
                />
                <span class="text-sm font-bold text-inverse tracking-tight truncate">{{
                  currentRecipe.name
                }}</span>
              </div>

              <div class="flex items-center gap-2 shrink-0">
                <!-- Pagination Control Pill -->
                <div class="flex items-center bg-surface-muted border border-border p-0.5">
                  <button
                    :disabled="!hasPrev"
                    class="w-7 h-7 flex items-center justify-center bg-surface text-inverse border border-border hover:bg-inverse hover:text-surface hover:border-inverse disabled:opacity-25 disabled:hover:bg-surface disabled:hover:text-inverse disabled:hover:border-border transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Previous Preset (Left Arrow)"
                    @click="goPrev"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <div
                    class="px-2.5 font-mono text-xs font-bold text-muted select-none flex items-center gap-1"
                  >
                    <span class="text-inverse">{{ formattedIndex.current }}</span>
                    <span class="text-faint">/</span>
                    <span>{{ formattedIndex.total }}</span>
                  </div>

                  <button
                    :disabled="!hasNext"
                    class="w-7 h-7 flex items-center justify-center bg-surface text-inverse border border-border hover:bg-inverse hover:text-surface hover:border-inverse disabled:opacity-25 disabled:hover:bg-surface disabled:hover:text-inverse disabled:hover:border-border transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Next Preset (Right Arrow)"
                    @click="goNext"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Preview Canvas -->
            <div class="flex-1 relative overflow-hidden">
              <DemoStage
                :key="currentRecipe.id"
                :setup="stageSetup"
                :smoothness="globalConfig.smoothness"
                :show-native="globalConfig.showNative"
                :targets="true"
                height-class="h-full"
                class="absolute inset-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
