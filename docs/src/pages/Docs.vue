<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
// Immediate redirect to new structure if somehow accessed directly
router.replace('/docs/guide/introduction');
</script>

<template>
  <div>Redirecting...</div>
</template>