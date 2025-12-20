
<script setup lang="ts">
import { computed } from 'vue';
import type { ControlSchema } from './recipes';
import ControlRange from '../ui/ControlRange.vue';
import ControlColor from '../ui/ControlColor.vue';
import ControlToggle from '../ui/ControlToggle.vue';
import ControlSelect from '../ui/ControlSelect.vue';

const props = defineProps<{
  schema: ControlSchema[];
  config: Record<string, any>;
  globalConfig: {
    smoothness: number;
    showNative: boolean;
  }
}>();

const emit = defineEmits(['update:config', 'update:globalConfig']);

// Proxy wrappers
const localConfig = computed({
  get: () => props.config,
  set: (val) => emit('update:config', val)
});

const localGlobal = computed({
  get: () => props.globalConfig,
  set: (val) => emit('update:globalConfig', val)
});
</script>

<template>
  <div class="h-full flex flex-col bg-white">
    <!-- Header -->
    <div class="p-8 border-b border-zinc-200 shrink-0">
        <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Configuration</h3>
        <p class="text-sm text-zinc-900 font-bold">Tune parameters in real-time.</p>
    </div>

    <!-- Controls Scroll Area -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
        
        <!-- Dynamic Schema Controls -->
        <div class="space-y-4">
            <template v-for="control in schema" :key="control.key">
                
                <ControlRange 
                    v-if="control.type === 'range'"
                    v-model="localConfig[control.key]"
                    :label="control.label"
                    :min="control.min!" 
                    :max="control.max!" 
                    :step="control.step || 1"
                    :unit="control.unit"
                    :description="control.description"
                />

                <ControlColor 
                    v-else-if="control.type === 'color'"
                    v-model="localConfig[control.key]"
                    :label="control.label"
                />

                <ControlToggle 
                    v-else-if="control.type === 'toggle'"
                    v-model="localConfig[control.key]"
                    :label="control.label"
                    :description="control.description"
                />

                <ControlSelect
                    v-else-if="control.type === 'select'"
                    v-model="localConfig[control.key]"
                    :label="control.label"
                    :options="control.options!"
                    :description="control.description"
                />

                <!-- Text Fallback -->
                <div v-else-if="control.type === 'text'" class="p-3">
                    <label class="text-sm font-bold text-zinc-900 block mb-2">{{ control.label }}</label>
                    <input 
                        type="text" 
                        v-model="localConfig[control.key]" 
                        class="w-full h-10 border border-zinc-200 px-3 font-mono text-sm outline-none focus:border-black transition-colors bg-zinc-50 focus:bg-white"
                    >
                </div>

            </template>
        </div>

        <div class="border-t border-zinc-100 my-4 pt-6">
            <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 px-2">Global Physics</h4>
            
            <div class="space-y-4">
                <ControlRange 
                    v-model="localGlobal.smoothness"
                    label="Smoothing (Lag)"
                    :min="0.01" :max="0.5" :step="0.01"
                    unit=""
                />
                <ControlToggle 
                    v-model="localGlobal.showNative"
                    label="Show Native Cursor"
                />
            </div>
        </div>

    </div>
  </div>
</template>
