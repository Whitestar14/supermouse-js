
<script setup lang="ts">
defineProps<{
  label: string;
  title: string;
}>();
</script>

<template>
  <section class="mb-24">
    <!-- Standard Header -->
    <div class="border-b border-zinc-200 pb-8 mb-12">
        <div class="flex items-center gap-3 mb-4">
            <div class="w-2 h-2 bg-black"></div>
            <span class="mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                {{ label }}
            </span>
        </div>
        <h1 class="text-5xl md:text-6xl font-bold tracking-tighter text-zinc-900 leading-[0.9]">
            {{ title }}
        </h1>
    </div>
    
    <div class="docs-content prose prose-zinc max-w-none prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-zinc-900 prose-p:text-zinc-600 prose-code:text-zinc-900 prose-code:bg-zinc-100 prose-code:px-1 prose-code:rounded-sm prose-code:before:content-[''] prose-code:after:content-['']">
        <slot />
    </div>
  </section>
</template>
