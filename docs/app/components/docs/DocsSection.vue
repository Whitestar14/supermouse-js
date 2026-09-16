<template>
  <section class="mb-24">
    <PageHeader :label="label" :title="title" />

    <div
      class="docs-content prose prose-zinc max-w-none prose-headings:font-bold prose-headings:tracking-tighter prose-headings:text-inverse prose-headings:no-underline prose-headings:border-none prose-p:text-body prose-strong:text-inverse prose-strong:font-bold prose-li:my-1 prose-code:text-inverse prose-code:bg-surface-subtle prose-code:px-1 prose-code:before:content-[''] prose-code:after:content-['']"
    >
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  title: string;
}>();
</script>
