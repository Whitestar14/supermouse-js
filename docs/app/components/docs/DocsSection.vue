<template>
  <section class="mb-24">
    <PageHeader :label="label" :title="title" />

    <!--
      Prose theming lives in `index.css` (`.docs-content`), not in a stack of
      `prose-*` utilities: the typography plugin emits unlayered rules, so it
      is the only place the overrides can actually win the cascade.
    -->
    <div class="docs-content prose max-w-none">
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
