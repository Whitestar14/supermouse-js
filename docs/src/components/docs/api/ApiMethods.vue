<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import { methodsData } from "@composables/useApiReference";
</script>

<template>
  <div id="methods" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200 flex items-center justify-between"
    >
      <span>Instance Methods</span>
      <span class="text-zinc-400 font-normal">Public API</span>
    </h3>
    <p class="text-sm text-zinc-500 mb-8">Lifecycle, plugin management, and runtime controls.</p>

    <ApiEntry
      v-for="item in methodsData"
      :key="item.id"
      :id="item.id"
      :name="item.name"
      :signature="item.signature"
      :returns="item.returns"
      :usage="item.usage"
    >
      <p>{{ item.desc }}</p>
    </ApiEntry>
  </div>
</template>
