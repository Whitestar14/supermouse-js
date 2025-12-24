
<script setup lang="ts">
defineProps<{
  modelValue: string;
  label: string;
}>();

const emit = defineEmits(['update:modelValue']);

const updateHex = (e: Event) => {
    const val = (e.target as HTMLInputElement).value;
    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
        emit('update:modelValue', '#' + val);
    }
};
</script>

<template>
  <div class="space-y-2 p-3">
    <label class="text-sm font-bold text-zinc-900">{{ label }}</label>
    <div class="relative flex h-10 border border-zinc-200 items-center pl-3 gap-2 group hover:border-zinc-400 transition-colors bg-white">
        <span class="mono text-zinc-400 text-xs select-none">#</span>
        <input 
            type="text" 
            :value="modelValue.replace('#','')" 
            @input="updateHex"
            class="w-full h-full border-none outline-none font-mono text-sm uppercase text-zinc-900 bg-transparent" 
            maxlength="6"
        >
        <input 
            type="color" 
            :value="modelValue"
            @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            class="absolute inset-y-0 right-0 w-12 h-full p-0 border-l border-zinc-200 opacity-0 cursor-pointer"
        >
        <div class="absolute inset-y-0 right-0 w-10 border-l border-zinc-200 pointer-events-none" :style="{ backgroundColor: modelValue }"></div>
    </div>
  </div>
</template>
