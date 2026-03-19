<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import MetadataStrip from "@/components/shared/MetadataStrip.vue";
import Text from "@/components/shared/Text.vue";
import StepCard from "@/components/shared/StepCard.vue";

const installCode = "pnpm add @supermousejs/vue @supermousejs/core @supermousejs/dot";

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
  { label: "LICENSE", content: "MIT" }
];
</script>

<template>
  <DocsSection label="Integrations" title="Vue.js">
    <MetadataStrip :items="metadataItems" />

    <Text size="lg" class="mb-12">
      While Supermouse is framework-agnostic, the Vue adapter provides a seamless
      Injection/Composition API experience. It handles the lifecycle (mount/unmount) automatically
      so you don't have to manually destroy instances.
    </Text>

    <!-- Installation -->
    <StepCard number="1" title="Installation" divider>
      <CodeBlock :code="installCode" title="Terminal" lang="text" class="border border-zinc-200" />
    </StepCard>

    <!-- Provider -->
    <StepCard number="2" title="Root Provider" divider>
      <Text size="sm">
        Use <code>provideSupermouse</code> in your root component (`App.vue` or a layout). This
        initializes the engine and makes it available to all child components via `provide/inject`.
      </Text>
      <CodeBlock
        :code="appCode"
        title="src/App.vue"
        lang="vue"
        class="border border-zinc-200 mt-4"
      />
    </StepCard>

    <!-- Composable -->
    <StepCard number="3" title="Usage in Components" divider>
      <Text size="sm">
        Any child component can grab the running instance using
        <code>useSupermouse()</code>. It returns a reactive `Ref` that resolves to the instance once
        mounted.
      </Text>
      <CodeBlock
        :code="componentCode"
        title="src/components/MyButton.vue"
        lang="vue"
        class="border border-zinc-200 mt-4"
      />
    </StepCard>

    <!-- Nuxt Warning -->
    <Callout title="Using with Nuxt?" class="mt-16">
      Ensure you wrap the provider in <code>&lt;ClientOnly&gt;</code> or checking for
      <code>process.client</code>. Supermouse accesses the <code>window</code> object immediately
      upon initialization.
    </Callout>
  </DocsSection>
</template>
