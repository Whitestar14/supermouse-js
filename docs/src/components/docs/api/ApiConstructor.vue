<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import { constructorEntry } from "@composables/useApiReference";
</script>

<template>
  <div id="constructor" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200"
    >
      Constructor
    </h3>
    <ApiEntry
      :id="constructorEntry.id"
      :name="constructorEntry.name"
      :signature="constructorEntry.signature"
      :returns="constructorEntry.returns"
      :usage="constructorEntry.usage"
      :usage-title="constructorEntry.usageTitle"
    >
      <p>{{ constructorEntry.desc }}</p>
    </ApiEntry>
  </div>
</template>
