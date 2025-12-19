
<script setup lang="ts">
import { computed } from 'vue';
import type { ControlSchema } from './recipes';

const props = defineProps<{
  schema: ControlSchema[];
  config: Record<string, any>;
  globalConfig: {
    smoothness: number;
    showNative: boolean;
  }
}>();

const emit = defineEmits(['update:config', 'update:globalConfig']);

// Proxy wrappers to make v-model clean
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
    <div class="p-8 border-b border-zinc-200">
        <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Configuration</h3>
        <p class="text-sm text-zinc-900 font-bold">Tune parameters in real-time.</p>
    </div>

    <!-- Controls Scroll Area -->
    <div class="flex-1 overflow-y-auto p-8 space-y-10">
        
        <!-- Dynamic Schema Controls -->
        <div v-for="control in schema" :key="control.key" class="space-y-3">
            <div class="flex justify-between items-baseline">
                <label class="text-sm font-bold text-zinc-900">{{ control.label }}</label>
                <!-- Value Display -->
                <span v-if="control.type === 'range'" class="mono text-xs text-zinc-500 bg-zinc-100 px-2 py-1">
                    {{ localConfig[control.key] }}px
                </span>
            </div>
            
            <p v-if="control.description" class="text-xs text-zinc-500 leading-tight mb-3 font-mono">
                {{ control.description }}
            </p>

            <!-- Range Input -->
            <input 
                v-if="control.type === 'range'"
                type="range" 
                v-model.number="localConfig[control.key]" 
                :min="control.min" :max="control.max" :step="control.step || 1"
                class="w-full h-1 bg-zinc-200 appearance-none cursor-pointer accent-black rounded-none"
            >

            <!-- Color Input -->
            <div v-else-if="control.type === 'color'" class="flex gap-2">
                <div class="relative flex-1 h-10 border border-zinc-200 flex items-center pl-3 gap-2 group hover:border-zinc-400 transition-colors">
                    <span class="mono text-zinc-400 text-xs select-none">#</span>
                    <input 
                        type="text" 
                        :value="localConfig[control.key].replace('#','')" 
                        @input="(e: any) => localConfig[control.key] = '#' + e.target.value"
                        class="w-full h-full border-none outline-none font-mono text-sm uppercase text-zinc-900" 
                        maxlength="6"
                    >
                    <input 
                        type="color" 
                        v-model="localConfig[control.key]"
                        class="absolute inset-y-0 right-0 w-12 h-full p-0 border-l border-zinc-200 opacity-0 cursor-pointer"
                    >
                    <div class="absolute inset-y-0 right-0 w-10 border-l border-zinc-200 pointer-events-none" :style="{ backgroundColor: localConfig[control.key] }"></div>
                </div>
            </div>

            <!-- Toggle Input (Rectangular) -->
            <div v-else-if="control.type === 'toggle'" class="flex items-center justify-between border border-zinc-200 p-3">
                 <span class="text-xs text-zinc-500 font-mono font-bold">{{ localConfig[control.key] ? 'ENABLED' : 'DISABLED' }}</span>
                 <button 
                    @click="localConfig[control.key] = !localConfig[control.key]"
                    class="w-10 h-5 relative flex items-center p-0.5 transition-colors"
                    :class="localConfig[control.key] ? 'bg-black' : 'bg-zinc-200'"
                >
                    <div 
                        class="w-4 h-4 bg-white transition-transform"
                        :class="localConfig[control.key] ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                </button>
            </div>

            <!-- Select Input -->
            <div v-else-if="control.type === 'select'" class="grid grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
                <button 
                    v-for="opt in control.options" :key="opt"
                    @click="localConfig[control.key] = opt"
                    class="px-3 py-2 text-xs font-bold transition-all capitalize text-center"
                    :class="localConfig[control.key] === opt ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:text-black'"
                >
                    {{ opt }}
                </button>
            </div>
        </div>

        <div class="border-t border-zinc-200 my-8 pt-8">
            <h4 class="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Global Physics</h4>
            
            <!-- Global: Smoothness -->
            <div class="space-y-4 mb-6">
                <div class="flex justify-between items-center">
                    <label class="text-sm font-bold text-zinc-900">Lag / Smoothness</label>
                    <span class="mono text-xs text-zinc-500 bg-zinc-100 px-2 py-1">{{ localGlobal.smoothness.toFixed(2) }}</span>
                </div>
                <input 
                    type="range" 
                    v-model.number="localGlobal.smoothness" 
                    min="0.01" max="0.5" step="0.01"
                    class="w-full h-1 bg-zinc-200 appearance-none cursor-pointer accent-black rounded-none"
                >
            </div>

            <!-- Global: Native Cursor -->
            <div class="flex items-center justify-between border border-zinc-200 p-3">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-zinc-900">Show Native Cursor</span>
                </div>
                <button 
                    @click="localGlobal.showNative = !localGlobal.showNative"
                    class="w-10 h-5 relative flex items-center p-0.5 transition-colors"
                    :class="localGlobal.showNative ? 'bg-black' : 'bg-zinc-200'"
                >
                    <div 
                        class="w-4 h-4 bg-white transition-transform"
                        :class="localGlobal.showNative ? 'translate-x-5' : 'translate-x-0'"
                    ></div>
                </button>
            </div>
        </div>

    </div>
  </div>
</template>
