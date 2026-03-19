<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import MetadataStrip from "@/components/shared/MetadataStrip.vue";
import Text from "@/components/shared/Text.vue";
import StepCard from "@/components/shared/StepCard.vue";

const installCode = "pnpm add @supermousejs/react @supermousejs/core @supermousejs/dot";

const providerCode = `// src/App.tsx
import { SupermouseProvider } from '@supermousejs/react';
import { Dot } from '@supermousejs/dot';

export default function App() {
  return (
    <SupermouseProvider
      options={{
        smoothness: 0.15,
        hideCursor: true
      }}
      plugins={[
        Dot({ size: 8, color: 'black' })
      ]}
    >
      <YourAppContent />
    </SupermouseProvider>
  );
}`;

const hookCode = `// src/components/CustomButton.tsx
import { useSupermouse } from '@supermousejs/react';

export const CustomButton = () => {
  const mouse = useSupermouse();

  const handleClick = () => {
    // Direct access to the core instance
    if (mouse) {
      console.log('Cursor at:', mouse.state.pointer);
    }
  };

  return <button onClick={handleClick}>Log Position</button>;
};`;

const nextCode = `// src/app/layout.tsx
import { SupermouseProvider } from '@supermousejs/react';
// ... imports

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SupermouseProvider options={{...}}>
           {children}
        </SupermouseProvider>
      </body>
    </html>
  );
}`;

const metaItems = [
  { label: "PACKAGE", content: "@supermousejs/react" },
  { label: "DEPENDENCY", content: "react >= 16.8" },
  { label: "LICENSE", content: "MIT" }
];
</script>

<template>
  <DocsSection label="Integrations" title="React">
    <!-- Meta Data Strip -->
    <MetadataStrip :items="metaItems" />

    <Text size="lg" class="mb-12">
      The React adapter provides a <code>SupermouseProvider</code> context and hooks to easily
      integrate the cursor engine into your React application lifecycle. It automatically handles
      cleanup to prevent memory leaks in strict mode.
    </Text>

    <!-- Installation -->
    <StepCard number="1" title="Installation" divider>
      <CodeBlock :code="installCode" title="Terminal" lang="text" class="border border-zinc-200" />
    </StepCard>

    <!-- Provider -->
    <StepCard number="2" title="Root Provider" divider>
      <Text size="sm">
        Wrap your application in the <code>SupermouseProvider</code>. This creates the instance and
        makes it available throughout your component tree.
      </Text>
      <CodeBlock
        :code="providerCode"
        title="src/App.tsx"
        lang="tsx"
        class="border border-zinc-200 mt-4"
      />
    </StepCard>

    <!-- Hooks -->
    <StepCard number="3" title="Usage in Components" divider>
      <Text size="sm">
        Use the <code>useSupermouse</code> hook to access the core instance from any child
        component.
      </Text>
      <CodeBlock
        :code="hookCode"
        title="src/components/CustomButton.tsx"
        lang="tsx"
        class="border border-zinc-200 mt-4"
      />
    </StepCard>

    <!-- Next.js -->
    <StepCard number="4" title="Next.js (App Router)">
      <Text size="sm">
        Because Supermouse relies on the `window` object, you must ensure the provider runs on the
        client. However, the package is already marked with
        <code>"use client"</code> compatible exports, so you can often import it directly in layouts
        if using simple setups, or wrap it in a dedicated client component.
      </Text>
      <CodeBlock
        :code="nextCode"
        title="src/app/layout.tsx"
        lang="tsx"
        class="border border-zinc-200 mt-4"
      />
    </StepCard>

    <Callout title="Strict Mode" class="mt-16">
      React 18 Strict Mode mounts components twice in development.
      <code>SupermouseProvider</code> handles this internally, ensuring only one cursor instance is
      active at a time.
    </Callout>
  </DocsSection>
</template>
