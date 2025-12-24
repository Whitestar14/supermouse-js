
<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  label: string;
  description?: string;
}>();

const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <div class="flex items-center justify-between border border-zinc-200 p-3 bg-white hover:border-zinc-300 transition-colors">
    <div class="flex flex-col">
        <span class="text-sm font-bold text-zinc-900">{{ label }}</span>
        <span v-if="description" class="text-[10px] text-zinc-500 font-mono mt-0.5">{{ description }}</span>
    </div>
    <button 
        @click="emit('update:modelValue', !modelValue)"
        class="w-10 h-5 relative flex items-center p-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
        :class="modelValue ? 'bg-black' : 'bg-zinc-200'"
        aria-label="Toggle"
    >
        <div 
            class="w-4 h-4 bg-white transition-transform duration-200 ease-out"
            :class="modelValue ? 'translate-x-5' : 'translate-x-0'"
        ></div>
    </button>
  </div>
</template>
