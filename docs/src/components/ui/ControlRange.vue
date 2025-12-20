
<script setup lang="ts">
defineProps<{
  modelValue: number;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  description?: string;
}>();

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="space-y-3 p-3 border border-transparent hover:border-zinc-100 hover:bg-zinc-50/50 transition-colors">
    <div class="flex justify-between items-baseline">
        <div>
            <label class="text-sm font-bold text-zinc-900 block">{{ label }}</label>
            <p v-if="description" class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ description }}</p>
        </div>
        <span class="mono text-xs text-zinc-600 font-bold bg-zinc-100 px-2 py-1 min-w-[3rem] text-center">
            {{ modelValue }}{{ unit || '' }}
        </span>
    </div>
    
    <input 
        type="range" 
        :value="modelValue"
        @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
        :min="min" :max="max" :step="step"
        class="w-full h-1.5 bg-zinc-200 appearance-none cursor-pointer accent-black hover:bg-zinc-300 transition-colors"
    >
  </div>
</template>
