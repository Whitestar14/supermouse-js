<script setup lang="ts">
import ApiEntry from "@components/docs/ApiEntry.vue";
import CodeBlock from "@components/shared/CodeBlock.vue";
</script>

<template>
  <div id="constructor" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200"
    >
      Constructor
    </h3>
    <ApiEntry
      id="constructor"
      name="constructor(options?)"
      signature="new Supermouse(options?: SupermouseOptions)"
      returns="Supermouse"
    >
      <p>
        Creates the runtime, applies options, and prepares the plugin pipeline. If
        <code>autoStart</code> is left enabled, the animation loop begins immediately during
        construction. If you set <code>autoStart: false</code>, call <code>start()</code> later to
        begin the frame loop explicitly.
      </p>
      <CodeBlock
        code="import { Supermouse } from '@supermousejs/core';&#10;import { Dot } from '@supermousejs/dot';&#10;import { Ring } from '@supermousejs/ring';&#10;&#10;const app = new Supermouse({&#10;  smoothness: 0.15,&#10;  hideCursor: true,&#10;  rules: {&#10;    'a, button': { pointer: true },&#10;    '[data-supermouse-magnetic]': { magnetic: true }&#10;  },&#10;  plugins: [Dot({ size: 8 }), Ring({ size: 32 })]&#10;});&#10;&#10;// Equivalent imperative registration&#10;// const app = new Supermouse({ smoothness: 0.15 });&#10;// app.use(Dot({ size: 8 })).use(Ring({ size: 32 }));"
        lang="typescript"
        :clean="true"
        title="Initialization"
        class="border border-zinc-200 mt-5"
      />
    </ApiEntry>
  </div>
</template>
