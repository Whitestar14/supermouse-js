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
  // Register plugins declaratively
  plugins: [
    Dot({ size: 8 }),
    Ring({ size: 24 })
  ],

  // Physics (0.01 - 1.0)
  smoothness: 0.15,

  // Native Cursor Hiding
  hideCursor: true,

  // Native Fallback Strategy ('auto' | 'tag' | 'css')
  // 'tag' checks HTML tags (fastest). 'auto' checks CSS too (safer).
  ignoreOnNative: 'tag'
});`;

const globalUsageCode = `// When using a CDN, all standard exports are on the global Supermouse object
const app = new Supermouse({ smoothness: 0.1 });
app.use(Supermouse.Dot());
app.use(Supermouse.Ring());`;

const chainingCode = `// You can also add plugins imperatively at runtime
// This is useful for conditional loading or lazy-loaded effects.

if (prefersComplexEffects) {
  app.use(Sparkles({ color: 'gold' }));
}`;

const interactionCode = `// 1. Configure Rules
const app = new Supermouse({
  rules: {
    // Selector : State Object
    'button': { magnetic: true },
    'a': { color: '#00ff00' }
  }
});

// 2. Plugins consume the State
// The "Magnetic" plugin looks for app.state.interaction.magnetic
app.use(Magnetic());

// The "Dot" plugin looks for app.state.interaction.color
app.use(Dot());`;

const htmlCode = `<!-- You can also define state directly in HTML -->
<button data-supermouse-magnetic="true" data-supermouse-color="red">
  Complex Interaction
</button>`;

const containerCode = `// 1. Target a specific element
const modal = document.getElementById('my-modal');

const app = new Supermouse({
  container: modal,
  hideCursor: true
});

// The custom cursor will now exist INSIDE #my-modal
// Coordinates are automatically relative to the container.
// CSS injection is scoped to this container.`;

const visibilityCode = `// Force SHOW native cursor (e.g. dragging, specialized UI)
app.setCursor('auto');

// Force HIDE native cursor (override auto-detection)
app.setCursor('none');

// Reset to automatic behavior (based on ignoreOnNative / isHover)
app.setCursor(null);`;

const cleanupCode = `// React / Vue / Svelte
// You MUST destroy the instance to stop the RequestAnimationFrame loop
// and remove event listeners.

onUnmounted(() => {
  app.destroy();
});`;
</script>

<template>
  <DocsSection label="Guide" title="Usage">
    <Text weight="medium" size="lg" class="mb-12">
      Supermouse is a <b>singleton runtime</b>. It manages the animation loop, input listeners, and
      the plugin pipeline. You initialize it once when your application mounts. See the
      <ApiLink to="constructor">constructor options</ApiLink> for all available settings.
    </Text>

    <!-- Configuration -->
    <SectionHeader :level="2" class="mb-6"> 1. Configuration </SectionHeader>
    <Text class="mb-6">
      The constructor accepts a <code>SupermouseOptions</code> object. You can pass
      <ApiLink to="plugins">plugins</ApiLink> directly in the configuration array or use
      <ApiLink to="use">use()</ApiLink> at runtime.
    </Text>
    <div class="mb-8">
      <CodeBlock
        :code="initCode"
        title="main.ts (ES Modules)"
        lang="typescript"
        class="border border-zinc-200"
      />
    </div>

    <Callout title="Global Usage">
      If you are using the <strong>CDN bundle</strong>, the core and standard plugins are available
      on the global <code>window.Supermouse</code> object.
      <div class="mt-4">
        <CodeBlock :code="globalUsageCode" lang="javascript" :clean="true" />
      </div>
    </Callout>

    <!-- Plugins -->
    <SectionHeader :level="2" class="mb-6 mt-16"> 2. Runtime Registration </SectionHeader>
    <Text class="mb-6">
      If you need to add plugins later (e.g. lazy loading), you can use the chainable
      <ApiLink to="use">use()</ApiLink> method for runtime registration.
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
      Interaction in Supermouse is completely data-driven. The Core does not know what "magnetic"
      means. It simply parses metadata (State) from the DOM and exposes it to plugins via
      <ApiLink to="state.interaction">state.interaction</ApiLink>.
    </Text>

    <Callout title="The Concept">
      The Input system scrapes <ApiLink to="rules">rules</ApiLink> or
      <code>data-supermouse-*</code> attributes to populate
      <ApiLink to="state.interaction">state.interaction</ApiLink>. Plugins like
      <strong>Magnetic</strong> or <strong>Dot</strong> read this state to decide what to do.
    </Callout>

    <div class="grid grid-cols-1 gap-8 mb-12">
      <div>
        <SectionHeader :level="4"> Global Rules (Recommended) </SectionHeader>
        <Text size="sm" class="mb-4">
          Map CSS selectors to state objects via the <ApiLink to="rules">rules option</ApiLink>.
          This keeps your HTML clean.
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
          Use <code>data-supermouse-*</code> attributes (see
          <ApiLink to="data-attributes">data attribute docs</ApiLink>) for one-off overrides. These
          take precedence over rules.
        </Text>
        <CodeBlock :code="htmlCode" title="index.html" lang="html" class="border border-zinc-200" />
      </div>
    </div>

    <!-- Scoped Containers -->
    <SectionHeader :level="2" class="mb-6"> 4. Scoped Containers </SectionHeader>
    <Text class="mb-6 max-w-2xl">
      By default, Supermouse appends to <code>document.body</code> and tracks the window. You can
      restrict the cursor to a specific div (e.g., a modal, a canvas wrapper) using the
      <ApiLink to="container">container</ApiLink> option.
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
      Sometimes you need strict control over the cursor visibility (e.g., drag and drop operations,
      custom modals, or games). Use
      <ApiLink to="setcursor">setCursor</ApiLink> to override the internal auto-detection.
    </Text>
    <div class="mb-12">
      <CodeBlock :code="visibilityCode" lang="typescript" class="border border-zinc-200" />
    </div>

    <!-- Cleanup -->
    <SectionHeader :level="2" class="mb-6"> 6. Cleanup </SectionHeader>
    <Callout title="Important for SPA Navigation">
      If your app navigates between pages that mount/unmount the cursor (or if you use Hot Module
      Replacement), you must call <ApiLink to="destroy">destroy</ApiLink> to prevent memory leaks
      and duplicate cursors.
    </Callout>
    <div class="mb-12">
      <CodeBlock :code="cleanupCode" lang="typescript" class="border border-zinc-200" />
    </div>
  </DocsSection>
</template>
