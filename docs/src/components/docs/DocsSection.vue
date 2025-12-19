
<script setup lang="ts">
defineProps<{
  id: string;
  label: string;
  title: string;
}>();
</script>

<template>
  <section :id="id" class="scroll-mt-32">
    <!-- Standard Header -->
    <div class="border-t border-zinc-200 pt-6 mb-8 md:mb-12">
        <span class="mono text-xs font-bold uppercase tracking-widest text-zinc-400">
            {{ label }}
        </span>
    </div>

    <h2 class="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-900 mb-8 md:mb-12">
        {{ title }}
    </h2>
    
    <div class="docs-content">
        <slot />
    </div>
  </section>
</template>
