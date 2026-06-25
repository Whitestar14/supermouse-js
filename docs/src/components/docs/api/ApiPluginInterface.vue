<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import { pluginHooks } from "@composables/useApiReference";
</script>

<template>
  <div id="plugin-interface" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200 flex items-center justify-between"
    >
      <span>SupermousePlugin</span>
      <span class="text-zinc-400 font-normal">Lifecycle Hooks</span>
    </h3>
    <p class="text-sm text-zinc-500 mb-8">
      Implement these hooks when authoring plugins. See
      <router-link to="/docs/advanced/authoring" class="font-bold hover:underline">
        Plugin Authoring
      </router-link>
      for a full walkthrough.
    </p>

    <ApiEntry
      v-for="item in pluginHooks"
      :key="item.id"
      :id="item.id"
      :name="item.name"
      :signature="item.signature"
      :usage="item.usage"
    >
      <p>{{ item.desc }}</p>
    </ApiEntry>
  </div>
</template>
