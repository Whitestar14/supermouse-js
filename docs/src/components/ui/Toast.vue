
<script setup lang="ts">
defineProps<{
  message: string | null;
}>();
</script>

<template>
  <Transition
    enter-active-class="transition ease-out duration-300"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition ease-in duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-if="message" class="fixed bottom-8 right-8 z-[9999]">
      <div class="bg-black text-white px-6 py-3 rounded shadow-xl flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-white">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="text-sm font-bold">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>
