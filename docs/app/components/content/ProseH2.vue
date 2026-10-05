<script setup lang="ts">
defineProps<{
  id?: string;
}>();
</script>

<template>
  <ProseHeading :level="2" :id="id">
    <slot />
  </ProseHeading>
</template>
