<script setup lang="ts">
defineProps<{
  modelValue: string;
  label: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const updateHex = (e: Event) => {
  const val = (e.target as HTMLInputElement).value;
  if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
    emit("update:modelValue", `#${val}`);
  }
};
</script>

<template>
  <div class="space-y-2 p-3">
    <label class="text-sm font-bold text-inverse">{{ label }}</label>
    <div
      class="relative flex h-10 border border-border items-center pl-3 gap-2 group hover:border-subtle transition-colors bg-surface"
    >
      <span class="font-mono text-subtle text-xs select-none">#</span>
      <input
        type="text"
        :value="modelValue.replace('#', '')"
        class="w-full h-full border-none outline-none font-mono text-sm uppercase text-inverse bg-transparent"
        maxlength="6"
        @input="updateHex"
      />
      <input
        type="color"
        :value="modelValue"
        class="absolute inset-y-0 right-0 w-12 h-full p-0 border-l border-border opacity-0 cursor-pointer"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <div
        class="absolute inset-y-0 right-0 w-10 border-l border-border pointer-events-none"
        :style="{ backgroundColor: modelValue }"
      />
    </div>
  </div>
</template>
