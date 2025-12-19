
<script setup lang="ts">
import Layout from './components/Layout.vue';
</script>

<template>
  <Layout>
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </Layout>
</template>
