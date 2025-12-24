
<script setup lang="ts">
defineProps<{
  modelValue: string;
  label: string;
  options: string[];
  description?: string;
}>();

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="space-y-3 p-3">
    <div>
        <label class="text-sm font-bold text-zinc-900 block">{{ label }}</label>
        <p v-if="description" class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ description }}</p>
    </div>
    
    <div class="grid grid-cols-2 gap-px bg-zinc-200 border border-zinc-200 overflow-hidden">
        <button 
            v-for="opt in options" :key="opt"
            @click="emit('update:modelValue', opt)"
            class="px-3 py-2 text-xs font-bold transition-all capitalize text-center"
            :class="modelValue === opt ? 'bg-black text-white' : 'bg-white text-zinc-500 hover:text-black hover:bg-zinc-50'"
        >
            {{ opt }}
        </button>
    </div>
  </div>
</template>
