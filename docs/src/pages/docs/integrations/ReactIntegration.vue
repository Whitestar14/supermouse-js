
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';
import Callout from '../../../components/ui/Callout.vue';

const installCode = `pnpm add @supermousejs/react @supermousejs/core @supermousejs/dot`;

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
</script>

<template>
  <DocsSection label="Integrations" title="React">
    
    <!-- Meta Data Strip -->
    <div class="flex items-center gap-6 mb-12 border-y border-zinc-200 py-4 font-mono text-xs">
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">PACKAGE</span>
            <span class="text-zinc-500">@supermousejs/react</span>
        </div>
        <div class="w-px h-4 bg-zinc-200"></div>
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">DEPENDENCY</span>
            <span class="text-zinc-500">react >= 16.8</span>
        </div>
        <div class="w-px h-4 bg-zinc-200"></div>
        <div class="flex items-center gap-2">
            <span class="font-bold text-zinc-900">LICENSE</span>
            <span class="text-zinc-500">MIT</span>
        </div>
    </div>

    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      The React adapter provides a <code>SupermouseProvider</code> context and hooks to easily integrate 
      the cursor engine into your React application lifecycle. It automatically handles 
      cleanup to prevent memory leaks in strict mode.
    </p>

    <!-- Installation -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">1. Installation</h3>
    <div class="mb-12">
        <CodeBlock :code="installCode" title="Terminal" lang="text" class="border border-zinc-200" />
    </div>

    <!-- Provider -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">2. Root Provider</h3>
    <p class="text-zinc-600 mb-6">
      Wrap your application in the <code>SupermouseProvider</code>. This creates the instance and makes it available throughout your component tree.
    </p>
    <div class="mb-12">
        <CodeBlock :code="providerCode" title="src/App.tsx" lang="tsx" class="border border-zinc-200" />
    </div>

    <!-- Hooks -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">3. Usage in Components</h3>
    <p class="text-zinc-600 mb-6">
      Use the <code>useSupermouse</code> hook to access the core instance from any child component.
    </p>
    <div class="mb-12">
        <CodeBlock :code="hookCode" title="src/components/CustomButton.tsx" lang="tsx" class="border border-zinc-200" />
    </div>

    <!-- Next.js -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">4. Next.js (App Router)</h3>
    <p class="text-zinc-600 mb-6">
      Because Supermouse relies on the `window` object, you must ensure the provider runs on the client. 
      However, the package is already marked with <code>"use client"</code> compatible exports, so you can often import it directly in layouts if using simple setups, or wrap it in a dedicated client component.
    </p>
    <div class="mb-12">
        <CodeBlock :code="nextCode" title="src/app/layout.tsx" lang="tsx" class="border border-zinc-200" />
    </div>

    <Callout title="Strict Mode">
        React 18 Strict Mode mounts components twice in development. <code>SupermouseProvider</code> handles this internally, ensuring only one cursor instance is active at a time.
    </Callout>

  </DocsSection>
</template>
