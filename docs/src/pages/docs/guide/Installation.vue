<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import StepCard from "@/components/shared/StepCard.vue";
import Text from "@/components/shared/Text.vue";
import ApiLink from "@/components/shared/ApiLink.vue";

const shellCode = "pnpm add @supermousejs/core @supermousejs/dot @supermousejs/ring";

const unscopedCode = "pnpm install supermousejs";

const cdnCode = `<script src="https://unpkg.com/supermousejs"><\/script>

<script>
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

app.use(Dot({ size: 8, color: '#f0f' })).use(Ring({ size: 20 }));`;

const htmlCode = `<div data-supermouse-color="#00ff00">Color override</div>
<a data-supermouse-img="/path/to/img.jpg">Show image on hover</a>`;
</script>

<template>
  <DocsSection label="Guide" title="Installation">
    <div class="flex flex-col gap-12">
      <!-- Step 1: Package Manager -->
      <StepCard number="1" title="Via Package Manager">
        <Text> Install scoped packages to optimize tree-shaking and bundle footprint. </Text>
        <CodeBlock :code="shellCode" title="Terminal" lang="text" />

        <Text>
          Alternatively, you can install the unscoped bundle which contains standard defaults:
        </Text>
        <CodeBlock :code="unscopedCode" title="Terminal" lang="text" />
      </StepCard>

      <!-- Step 2: CDN -->
      <StepCard number="2" title="CDN / Direct Script" divider>
        <Text>
          For projects without a bundler, load the compiled package via unpkg or jsDelivr. This
          exposes the core constructor alongside standard Dot and Ring visual hooks on the global
          namespace.
        </Text>
        <CodeBlock :code="cdnCode" title="index.html" lang="html" />
      </StepCard>

      <!-- Step 3: Initialization -->
      <StepCard number="3" title="Initialize (Modules)" divider>
        <Text>
          Instantiate the runtime within your application entry point (e.g. <code>main.ts</code> or
          a root lifecycle wrapper).
        </Text>
        <CodeBlock :code="mainCode" title="src/main.ts" lang="typescript" />
      </StepCard>

      <!-- Step 4: Markup Control -->
      <StepCard number="4" title="Markup Control" divider>
        <Text>
          Visual plugins watch for configured data attributes in the document markup automatically.
        </Text>
        <CodeBlock :code="htmlCode" title="index.html" lang="html" />

        <Callout title="Warning: CSS Conflicts" variant="warning">
          <p class="mb-2">
            <strong
              >Do not define <code>cursor: pointer</code> or <code>cursor: none</code> rules in your
              application stylesheets.</strong
            >
          </p>
          <p>
            Supermouse handles native pointer visibility dynamically. Ad-hoc CSS cursor overrides
            bypass target detection and cause double-cursor rendering or cursor flickering. Define
            hover affordances programmatically using
            <ApiLink to="rules"><code>rules</code></ApiLink> configurations.
          </p>
        </Callout>

        <Text size="sm">
          To manage edge-cases or resolve browser conflicts, see the
          <router-link
            to="/docs/guide/troubleshooting"
            class="text-black font-bold underline decoration-zinc-300 underline-offset-4 hover:decoration-black transition-all"
          >
            troubleshooting guide
          </router-link>
          . Configure the <ApiLink to="hidecursor"><code>hideCursor</code></ApiLink> and
          <ApiLink to="ignoreonnative"><code>ignoreOnNative</code></ApiLink> parameters for detailed
          granularity.
        </Text>
      </StepCard>
    </div>
  </DocsSection>
</template>
