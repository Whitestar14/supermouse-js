<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import { stateData } from "@composables/useApiReference";
</script>

<template>
  <div id="state" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200 flex items-center justify-between"
    >
      <span>MouseState</span>
      <span class="text-zinc-400 font-normal">app.state</span>
    </h3>
    <p class="text-sm text-zinc-500 mb-8">
      Mutable state object updated every frame. Logic plugins write to
      <code>target</code>; visual plugins read <code>smooth</code> for rendering.
    </p>

    <ApiEntry
      v-for="item in stateData"
      :key="item.id"
      :id="item.id"
      :name="item.name"
      :type="item.type"
      :usage="item.usage"
    >
      <p>{{ item.desc }}</p>
    </ApiEntry>
  </div>
</template>
