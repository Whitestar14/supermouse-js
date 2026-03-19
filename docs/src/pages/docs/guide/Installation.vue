<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/CodeBlock.vue";
import Callout from "@/components/ui/Callout.vue";
import StepCard from "@/components/ui/StepCard.vue";
import Text from "@/components/ui/Text.vue";
import CodeCard from "@/components/ui/CodeCard.vue";

const shellCode = `pnpm add @supermousejs/core @supermousejs/dot @supermousejs/ring`;

const unscopedCode = `pnpm install supermousejs`;

const cdnCode = `<!-- All-in-one bundle (Core + Dot + Ring) -->
<script src="https://unpkg.com/supermousejs"><\/script>

<script>
  // Standard plugins are available on the global Supermouse object
  const { Dot, Ring } = Supermouse;

  const app = new Supermouse();
  app.use(Dot()).use(Ring());
<\/script>`;

const mainCode = `import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse({
  smoothness: 0.12,
  hideCursor: true
});

app.use(Dot({ size: 8, color: '#f0f' }));
app.use(Ring({ size: 20 }));`;

const htmlCode = `<div data-supermouse-color="#00ff00">Color override</div>
<a data-supermouse-img="/path/to/img.jpg">Show image on hover</a>`;
</script>

<template>
  <DocsSection label="Guide" title="Installation">
    <div class="flex flex-col gap-12">
      <!-- Step 1: Package Manager -->
      <StepCard number="1" title="Via Package Manager">
        <Text>
          For modular setups, use the scoped packages. This allows for better
          tree-shaking.
        </Text>
        <CodeBlock :code="shellCode" title="Terminal" lang="text" />

        <Text>
          Alternatively, use the unscoped convenience bundle if you prefer clean
          import paths and standard defaults:
        </Text>
        <CodeBlock :code="unscopedCode" title="Terminal" lang="text" />
      </StepCard>

      <!-- Step 2: CDN -->
      <StepCard number="2" title="CDN / Direct Script" divider>
        <Text>
          If you aren't using a build tool, you can load the all-in-one bundle
          directly via a CDN like Unpkg or JSDelivr.
        </Text>
        <CodeBlock :code="cdnCode" title="index.html" lang="html" />
      </StepCard>

      <!-- Step 3: Initialization -->
      <StepCard number="3" title="Initialize (Modules)" divider>
        <Text>
          Create the instance in your app's entry point (e.g.,
          <code>main.ts</code> or a top-level `useEffect`).
        </Text>
        <CodeBlock :code="mainCode" title="src/main.ts" lang="typescript" />
      </StepCard>

      <!-- Step 4: Markup Control -->
      <StepCard number="4" title="Markup Control" divider>
        <Text>
          Plugins automatically listen for data attributes on your HTML
          elements.
        </Text>
        <CodeBlock :code="htmlCode" title="index.html" lang="html" />

        <Callout title="Warning: CSS Conflicts" variant="warning">
          <p class="mb-2">
            <strong
              >Do not use <code>cursor: pointer</code> or
              <code>cursor: none</code> in your own CSS.</strong
            >
          </p>
          <p>
            Supermouse manages cursor visibility dynamically. Manually setting
            cursor styles often results in the "double cursor" glitch where the
            OS cursor reappears on top of the custom one. If you need a pointer
            state, use the <code>rules</code> config in Supermouse to handle it
            programmatically.
          </p>
        </Callout>

        <Text size="sm">
          To read more on resolving conflicts and edge cases, visit the
          <router-link
            to="/docs/guide/troubleshooting"
            class="text-black font-bold underline decoration-zinc-300 underline-offset-4 hover:decoration-black transition-all"
          >
            troubleshooting page </router-link
          >.
        </Text>
      </StepCard>
    </div>
  </DocsSection>
</template>
