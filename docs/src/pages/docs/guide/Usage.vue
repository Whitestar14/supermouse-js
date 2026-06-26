<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import SectionHeader from "@/components/shared/SectionHeader.vue";
import Text from "@/components/shared/Text.vue";
import ApiLink from "@/components/shared/ApiLink.vue";

const initCode = `import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse({
  plugins: [
    Dot({ size: 8 }),
    Ring({ size: 24 })
  ],
  smoothness: 0.15,
  ignoreOnNative: 'tag'
});

// Also valid:
// app.use(Dot({ ... })).use(Ring({ ... }))
`;

const globalUsageCode = `const app = new Supermouse({ smoothness: 0.1 });
app.use(Supermouse.Dot());
app.use(Supermouse.Ring());`;

const chainingCode = `const app = new Supermouse({ /* options */ });

if (prefersComplexEffects) {
  app.use(Sparkles({ color: 'gold' }));
}`;

const interactionCode = `// 1. Configure Rules during initialization
const app = new Supermouse({
  rules: {
    // Selector : State Configuration
    'button': { magnetic: true },
    'a': { color: '#00ff00' }
  }
});

// 2. Decoupled plugins read from state.interaction
// The Magnetic plugin queries app.state.interaction.magnetic
app.use(Magnetic());

// The Dot plugin queries app.state.interaction.color
app.use(Dot());`;

const htmlCode = `<!-- Define overrides directly in document markup -->
<button data-supermouse-magnetic="true" data-supermouse-color="red">
  Complex Interaction
</button>`;

const containerCode = `// Restrict runtime calculations to a specific element
const modal = document.getElementById('my-modal');

const app = new Supermouse({
  container: modal,
  hideCursor: true
});

// The custom cursor is bounded inside #my-modal.
// Coordinates and stylesheet rules are scoped automatically.`;

const visibilityCode = `// Force show the OS native pointer
app.setNativeCursor('show');

// Force hide the OS native pointer
app.setNativeCursor('hide');

// Restore automatic visibility management
app.setNativeCursor('auto');`;

const cleanupCode = `// React / Vue / Svelte lifecycle hooks
// Invoke destroy to clear listeners and frame loops on unmount

onUnmounted(() => {
  app.destroy();
});`;
</script>

<template>
  <DocsSection label="Guide" title="Usage">
    <Text weight="medium" size="lg" class="mb-12">
      Supermouse operates as a singleton engine, managing input events, physics interpolation, and the plugin queue. Instantiate it once when your application mounts. Refer to the <ApiLink to="constructor">constructor options</ApiLink> for a complete parameter reference.
    </Text>

    <!-- Configuration -->
    <SectionHeader :level="2" class="mb-6"> 1. Configuration </SectionHeader>
    <Text class="mb-6">
      The core runtime requires configuration via a <code>SupermouseOptions</code> argument. You can load plugins declaratively inside the <ApiLink to="plugins-option"><code>plugins</code></ApiLink> constructor parameter, or register them dynamically using the chainable <ApiLink to="use"><code>use()</code></ApiLink> api.
    </Text>
    <div class="mb-8">
      <CodeBlock
        :code="initCode"
        title="main.ts (ES Modules)"
        lang="typescript"
        class="border border-zinc-200"
      />
    </div>

    <Callout title="Global CDN Usage">
      When loading Supermouse via the direct script CDN bundle, classes and default plugins are exported on the global <code>window.Supermouse</code> namespace.
      <div class="mt-4">
        <CodeBlock :code="globalUsageCode" lang="javascript" :clean="true" />
      </div>
    </Callout>

    <!-- Plugins -->
    <SectionHeader :level="2" class="mb-6 mt-16"> 2. Runtime Registration </SectionHeader>
    <Text class="mb-6">
      Register plugins dynamically at runtime to support conditional scripts, route-based triggers, or lazy-loading configurations.
    </Text>
    <div class="mb-12">
      <CodeBlock
        :code="chainingCode"
        title="main.ts"
        lang="typescript"
        class="border border-zinc-200"
      />
    </div>

    <!-- Interaction -->
    <SectionHeader :level="2" class="mb-6"> 3. Defining Interactions </SectionHeader>

    <Text class="mb-6">
      Interactive triggers in Supermouse are declarative. The core engine remains agnostic to specific visual responses; it parses hovered element layouts and exposes them to visual and logic layers via the O(1) <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink> cache.
    </Text>

    <Callout title="Scraper Flow">
      The core input processor reads global selectors mapped in <ApiLink to="rules"><code>rules</code></ApiLink> or watches for raw inline markup to populate the <ApiLink to="state.interaction"><code>state.interaction</code></ApiLink> store, preventing layout thrashing.
    </Callout>

    <div class="grid grid-cols-1 gap-8 mb-12">
      <div>
        <SectionHeader :level="4"> Global Rules (Recommended) </SectionHeader>
        <Text size="sm" class="mb-4">
          Bind selectors to interaction configurations inside your initialization parameters to keep DOM markup clean.
        </Text>
        <CodeBlock
          :code="interactionCode"
          title="main.ts"
          lang="typescript"
          class="border border-zinc-200"
        />
      </div>

      <div>
        <SectionHeader :level="4"> HTML Overrides </SectionHeader>
        <Text size="sm" class="mb-4">
          For ad-hoc configurations, write <ApiLink to="data-attributes"><code>data-supermouse-*</code></ApiLink> attributes directly on HTML targets. Inline overrides take precedence over global rules.
        </Text>
        <CodeBlock :code="htmlCode" title="index.html" lang="html" class="border border-zinc-200" />
      </div>
    </div>

    <!-- Scoped Containers -->
    <SectionHeader :level="2" class="mb-6"> 4. Scoped Containers </SectionHeader>
    <Text class="mb-6 max-w-2xl">
      By default, Supermouse appends its rendering stage to <code>document.body</code> and captures window viewport boundaries. Pass a custom <ApiLink to="container"><code>container</code></ApiLink> reference to restrict rendering, styles, and hover bounds to a specific element.
    </Text>
    <div class="mb-12">
      <CodeBlock
        :code="containerCode"
        title="Scoped Usage"
        lang="typescript"
        class="border border-zinc-200"
      />
    </div>

    <!-- Manual Visibility -->
    <SectionHeader :level="2" class="mb-6"> 5. Manual Visibility </SectionHeader>
    <Text class="mb-6">
      For custom interfaces like canvas games, custom drag-and-drop handles, or text input fields, invoke <ApiLink to="setnativecursor"><code>setNativeCursor()</code></ApiLink> to force cursor overrides.
    </Text>
    <div class="mb-12">
      <CodeBlock :code="visibilityCode" lang="typescript" class="border border-zinc-200" />
    </div>

    <!-- Cleanup -->
    <SectionHeader :level="2" class="mb-6"> 6. Cleanup </SectionHeader>
    <Callout title="Important for SPA routing">
      In Single Page Applications (SPAs) or under Hot Module Replacement (HMR) reload cycles, you must call <ApiLink to="destroy"><code>destroy()</code></ApiLink> to clear window event listeners, remove injected stylesheets, and cancel the animation frame loop.
    </Callout>
    <div class="mb-12">
      <CodeBlock :code="cleanupCode" lang="typescript" class="border border-zinc-200" />
    </div>
  </DocsSection>
</template>
