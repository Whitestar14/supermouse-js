<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import Callout from "@shared/Callout.vue";
import {
  mathUtilities,
  domUtilities,
  effectsUtilities,
  constantUtilities,
  otherUtilities
} from "@composables/useApiReference";
</script>

<template>
  <div id="utilities" class="mb-8 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-2 pb-2 border-b border-zinc-200 flex items-center justify-between"
    >
      <span>Utilities</span>
      <span class="text-zinc-400 font-normal">@supermousejs/utils</span>
    </h3>
    <p class="text-zinc-600 mb-10 leading-relaxed max-w-3xl">
      Performance-oriented helpers for plugin development. All functions minimize allocations and
      layout thrashing during the render loop.
    </p>

    <div class="mb-14">
      <h4
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-6 pb-2 border-b border-zinc-100"
      >
        Math
      </h4>
      <ApiEntry
        v-for="item in mathUtilities"
        :key="item.id"
        :id="item.id"
        :name="item.name"
        :signature="item.signature"
        :type="item.type"
        :usage="item.usage"
      >
        <p>{{ item.desc }}</p>
      </ApiEntry>
    </div>

    <div class="mb-14">
      <h4
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-6 pb-2 border-b border-zinc-100"
      >
        DOM
      </h4>
      <ApiEntry
        v-for="item in domUtilities"
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

    <div class="mb-14">
      <h4
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-6 pb-2 border-b border-zinc-100"
      >
        Effects
      </h4>
      <ApiEntry
        v-for="item in effectsUtilities"
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

    <div class="mb-14">
      <h4
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-6 pb-2 border-b border-zinc-100"
      >
        Constants
      </h4>
      <ApiEntry
        v-for="item in constantUtilities"
        :key="item.id"
        :id="item.id"
        :name="item.name"
        :type="item.type"
        :usage="item.usage"
      >
        <p>{{ item.desc }}</p>
      </ApiEntry>
    </div>

    <div class="mb-12">
      <h4
        class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-700 mb-6 pb-2 border-b border-zinc-100"
      >
        Plugin Helpers
      </h4>
      <ApiEntry
        v-for="item in otherUtilities"
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

    <Callout>
      For advanced patterns using these utilities, see
      <router-link to="/docs/advanced/tips-and-tricks" class="font-bold hover:underline">
        Tips &amp; Tricks </router-link
      >.
    </Callout>
  </div>
</template>
