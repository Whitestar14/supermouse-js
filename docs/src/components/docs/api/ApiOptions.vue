<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import { optionsData } from "@composables/useApiReference";
</script>

<template>
  <div id="options" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200"
    >
      SupermouseOptions
    </h3>
    <p class="text-sm text-zinc-500 mb-8">
      Passed to the constructor. Each option is documented below.
    </p>

    <ApiEntry
      v-for="item in optionsData"
      :key="item.id"
      :id="item.id"
      :name="item.name"
      :type="item.type"
      :default-value="item.defaultValue"
      :usage="item.usage"
      :usage-title="item.usageTitle"
      :usage-lang="item.usageLang"
    >
      <p>{{ item.desc }}</p>
    </ApiEntry>
  </div>
</template>
