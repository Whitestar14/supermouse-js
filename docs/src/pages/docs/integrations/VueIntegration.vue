<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/CodeBlock.vue";
import Callout from "@/components/ui/Callout.vue";
import MetadataStrip from "@/components/MetadataStrip.vue";

const installCode = `pnpm add @supermousejs/vue @supermousejs/core @supermousejs/dot`;

const appCode = `// src/App.vue
<script setup>
import { provideSupermouse } from '@supermousejs/vue';
import { Dot } from '@supermousejs/dot';

// Initialize core once at the root
provideSupermouse({
  smoothness: 0.15,
  hideCursor: true,
}, [
  Dot({ size: 8, color: 'black' })
]);
<\/script>

<template>
  <router-view />
</template>`;

const componentCode = `// src/components/MyButton.vue
<script setup>
import { useSupermouse } from '@supermousejs/vue';

// Access the instance (Ref<Supermouse | null>)
const mouse = useSupermouse();

const snap = () => {
  // Direct API access
  if (mouse.value) {
    mouse.value.state.target.y += 100;
  }
};
<\/script>`;

const metadataItems = [
  { label: "PACKAGE", content: "@supermousejs/vue" },
  { label: "DEPENDENCY", content: "vue >= 3.2.0" },
  { label: "LICENSE", content: "MIT" },
];
</script>

<template>
  <DocsSection label="Adapters" title="Vue.js">
    <MetadataStrip :items="metadataItems" />

    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      While Supermouse is framework-agnostic, the Vue adapter provides a
      seamless Injection/Composition API experience. It handles the lifecycle
      (mount/unmount) automatically so you don't have to manually destroy
      instances.
    </p>

    <!-- Installation -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">
      1. Installation
    </h3>
    <div class="mb-12">
      <CodeBlock
        :code="installCode"
        title="Terminal"
        lang="text"
        class="border border-zinc-200"
      />
    </div>

    <!-- Provider -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">
      2. Root Provider
    </h3>
    <p class="text-zinc-600 mb-6">
      Use <code>provideSupermouse</code> in your root component (`App.vue` or a
      layout). This initializes the engine and makes it available to all child
      components via `provide/inject`.
    </p>
    <div class="mb-12">
      <CodeBlock
        :code="appCode"
        title="src/App.vue"
        lang="vue"
        class="border border-zinc-200"
      />
    </div>

    <!-- Composable -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">
      3. Usage in Components
    </h3>
    <p class="text-zinc-600 mb-6">
      Any child component can grab the running instance using
      <code>useSupermouse()</code>. It returns a reactive `Ref` that resolves to
      the instance once mounted.
    </p>
    <div class="mb-12">
      <CodeBlock
        :code="componentCode"
        title="src/components/MyButton.vue"
        lang="vue"
        class="border border-zinc-200"
      />
    </div>

    <!-- Nuxt Warning -->
    <Callout title="Using with Nuxt?">
      Ensure you wrap the provider in <code>&lt;ClientOnly&gt;</code> or
      checking for <code>process.client</code>. Supermouse accesses the
      <code>window</code> object immediately upon initialization.
    </Callout>
  </DocsSection>
</template>
