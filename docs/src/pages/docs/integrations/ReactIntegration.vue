<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import Callout from "@/components/shared/Callout.vue";
import MetadataStrip from "@/components/shared/MetadataStrip.vue";
import Text from "@/components/shared/Text.vue";
import StepCard from "@/components/shared/StepCard.vue";
import ApiLink from "@/components/shared/ApiLink.vue";

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
  // Returns the Supermouse instance or null before mount
  const mouse = useSupermouse();

  const handleClick = () => {
    if (mouse) {
      console.log('Cursor at:', mouse.state.pointer);
    }
  };

  return <button onClick={handleClick}>Log Position</button>;
};`;

const nextCode = `// src/app/layout.tsx
import { SupermouseProvider } from '@supermousejs/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* SupermouseProvider is already marked 'use client' internally */}
        <SupermouseProvider options={{ smoothness: 0.15, hideCursor: true }}>
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
      The React adapter provides a <code>SupermouseProvider</code> context and a
      <code>useSupermouse</code> hook. It wraps <code>@supermousejs/core</code> in React's context
      API and handles cleanup on unmount — including React 18 Strict Mode's double-mount behavior.
    </Text>

    <!-- Installation -->
    <StepCard number="1" title="Installation" divider>
      <CodeBlock :code="installCode" title="Terminal" lang="text" class="border border-zinc-200" />
    </StepCard>

    <!-- Provider -->
    <StepCard number="2" title="Root Provider" divider>
      <Text size="sm">
        Wrap your application in <code>SupermouseProvider</code>. This creates the engine instance
        and makes it available via context. <code>options</code> accepts the same fields as the
        <ApiLink to="constructor">Supermouse constructor</ApiLink>.
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
        Call <code>useSupermouse()</code> in any descendant component to get the live instance. It
        returns <code>Supermouse | null</code> — guard before accessing
        <ApiLink name="state" to="state" /> or calling methods like
        <ApiLink name="destroy" to="destroy" />.
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
        Because Supermouse accesses <code>window</code> on initialization, it must run on the
        client. <code>SupermouseProvider</code> is already compiled with <code>"use client"</code>
        directives, so you can import it directly in a server-rendered layout. For more complex
        setups, extract it into a dedicated client component.
      </Text>
      <CodeBlock
        :code="nextCode"
        title="src/app/layout.tsx"
        lang="tsx"
        class="border border-zinc-200 mt-4"
      />
    </StepCard>

    <Callout title="Strict Mode" class="mt-16">
      React 18 Strict Mode mounts components twice in development. <code>SupermouseProvider</code>
      tracks mount count internally, ensuring only one engine instance is active at a time.
    </Callout>
  </DocsSection>
</template>
