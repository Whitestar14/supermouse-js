<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import MetadataStrip from "@/components/shared/MetadataStrip.vue";
import Text from "@/components/shared/Text.vue";
import StepCard from "@/components/shared/StepCard.vue";
import ApiLink from "@/components/shared/ApiLink.vue";

const installCode = "pnpm add @supermousejs/vue @supermousejs/core @supermousejs/dot";

const appCode = `// src/App.vue
<script setup>
import { provideSupermouse } from '@supermousejs/vue';
import { Dot } from '@supermousejs/dot';

// Call once at the root component. Mirrors the Supermouse constructor options.
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

// Returns Ref<Supermouse | null> — null until the engine is mounted.
const mouse = useSupermouse();

const snap = () => {
  if (mouse.value) {
    // Direct write to state.target — picked up next frame
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
      The Vue adapter wraps <code>@supermousejs/core</code> in Vue's <code>provide</code>/<code
        >inject</code
      >
      system. It handles engine lifecycle (mount/unmount) automatically so you don't manage
      <ApiLink name="destroy" to="destroy" /> calls manually.
    </Text>

    <!-- Installation -->
    <StepCard number="1" title="Installation" divider>
      <CodeBlock :code="installCode" title="Terminal" lang="text" class="border border-zinc-200" />
    </StepCard>

    <!-- Provider -->
    <StepCard number="2" title="Root Provider" divider>
      <Text size="sm">
        Call <code>provideSupermouse</code> once in your root component (<code>App.vue</code> or a
        layout). It accepts the same options as the
        <ApiLink to="constructor">Supermouse constructor</ApiLink>
        plus a plugins array.
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
        Use <code>useSupermouse()</code> in any child component to access the running instance. The
        return value is a reactive <code>Ref&lt;Supermouse | null&gt;</code> — always guard with
        <code>mouse.value</code> before accessing <ApiLink name="state" to="state" /> or calling
        methods.
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
      Wrap <code>provideSupermouse</code> in a <code>&lt;ClientOnly&gt;</code> component or guard it
      with <code>process.client</code>. The engine accesses <code>window</code> on initialization
      and will throw during SSR.
    </Callout>
  </DocsSection>
</template>
