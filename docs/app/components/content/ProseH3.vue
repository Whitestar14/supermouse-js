<script setup lang="ts">
defineProps<{
  id?: string;
}>();
</script>

<template>
  <ProseHeading :level="3" :id="id">
    <slot />
  </ProseHeading>
</template>
