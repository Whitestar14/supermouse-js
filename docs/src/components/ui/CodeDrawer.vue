
<script setup lang="ts">
import CodeBlock from '../CodeBlock.vue';

defineProps<{
  isOpen: boolean;
  code: string;
}>();

const emit = defineEmits(['close', 'copy']);
</script>

<template>
  <div class="absolute inset-0 z-50 pointer-events-none overflow-hidden">
    <!-- Backdrop -->
    <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
    >
        <div v-if="isOpen" class="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto" @click="emit('close')"></div>
    </Transition>

    <!-- Drawer -->
    <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-y-full"
        enter-to-class="translate-y-0"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-from-class="translate-y-0"
        leave-to-class="translate-y-full"
    >
        <div v-if="isOpen" class="absolute bottom-0 left-0 right-0 bg-white border-t border-zinc-200 pointer-events-auto shadow-2xl flex flex-col h-[60%] lg:h-[50%]">
            
            <div class="flex items-center justify-between p-4 border-b border-zinc-100">
                <h3 class="text-sm font-bold text-zinc-900 uppercase tracking-widest pl-2">Export Configuration</h3>
                <div class="flex gap-2">
                    <button @click="emit('copy')" class="h-8 px-4 bg-zinc-100 hover:bg-zinc-200 text-xs font-bold transition-colors text-zinc-900">
                        Copy to Clipboard
                    </button>
                    <button @click="emit('close')" class="h-8 w-8 flex items-center justify-center hover:bg-zinc-100 transition-colors">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto bg-[#282c34]">
                <CodeBlock :code="code" :clean="true" />
            </div>
        </div>
    </Transition>
  </div>
</template>
