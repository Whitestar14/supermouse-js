<script setup lang="ts">
defineProps<{
  id?: string;
}>();
</script>

<template>
  <ProseHeading :level="1" :id="id">
    <slot />
  </ProseHeading>
</template>
