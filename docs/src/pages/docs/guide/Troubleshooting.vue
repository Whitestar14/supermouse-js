
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';

const debugCode = `import { doctor } from '@supermousejs/utils';

// Run in console or call in your app
doctor();`;

const iframeCode = `/* CSS in the parent page */
iframe {
  pointer-events: none; /* If you don't need interaction */
  /* OR */
  cursor: none; /* If you can control iframe CSS */
}`;
</script>

<template>
  <DocsSection label="Guide" title="Troubleshooting">
    
    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      Common issues when integrating custom cursors and how to fix them.
    </p>

    <!-- The Doctor -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-6">The Doctor Utility</h3>
    <p class="text-zinc-600 mb-6">
      Supermouse ships with a diagnostic tool that scans your DOM for conflicting CSS (like inline `cursor: pointer` styles) that might cause flickering.
    </p>
    <div class="mb-16">
        <CodeBlock :code="debugCode" title="Diagnostics" lang="typescript" />
    </div>

    <!-- Common Issues Grid -->
    <div class="space-y-12">
        
        <!-- Double Cursor -->
        <div class="border border-zinc-200">
            <div class="bg-zinc-50 p-6 border-b border-zinc-200">
                <h4 class="font-bold text-zinc-900 uppercase tracking-widest text-sm">Issue: The "Double Cursor" Glitch</h4>
            </div>
            <div class="p-8 bg-white">
                <p class="text-zinc-600 mb-4 font-medium">Symptom: The native cursor flickers or appears on top of the custom cursor when hovering buttons or links.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                        <strong class="block text-zinc-900 mb-2 font-bold">Cause</strong>
                        <p class="text-zinc-500">
                            Another CSS rule is overriding <code>cursor: none</code>. This usually happens with UI libraries (Tailwind UI, Chakra) that set <code>cursor: pointer</code> on buttons.
                        </p>
                    </div>
                    <div>
                        <strong class="block text-zinc-900 mb-2 font-bold">Solution</strong>
                        <p class="text-zinc-500">
                            Use the <code>doctor()</code> utility to find the element. Then, ensure Supermouse is initialized with <code>hideCursor: true</code> (default). Supermouse injects <code>!important</code> styles to override this, but inline styles might persist.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- iFrames -->
        <div class="border border-zinc-200">
            <div class="bg-zinc-50 p-6 border-b border-zinc-200">
                <h4 class="font-bold text-zinc-900 uppercase tracking-widest text-sm">Issue: Cursor Disappears over iFrames</h4>
            </div>
            <div class="p-8 bg-white">
                <p class="text-zinc-600 mb-4 font-medium">Symptom: The custom cursor stops moving when hovering a YouTube embed or map.</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                        <strong class="block text-zinc-900 mb-2 font-bold">Cause</strong>
                        <p class="text-zinc-500">
                            The browser passes mouse events <em>into</em> the iframe. The parent window stops receiving <code>mousemove</code> events.
                        </p>
                    </div>
                    <div>
                        <strong class="block text-zinc-900 mb-2 font-bold">Solution</strong>
                        <p class="text-zinc-500 mb-4">
                            If the iframe doesn't need interaction, set <code>pointer-events: none</code> on it. If it does, you must implement a "bridge" (postMessage) or accept the native cursor appearing.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stutter -->
        <div class="border border-zinc-200">
            <div class="bg-zinc-50 p-6 border-b border-zinc-200">
                <h4 class="font-bold text-zinc-900 uppercase tracking-widest text-sm">Issue: Jitter / Stuttering</h4>
            </div>
            <div class="p-8 bg-white">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                    <div>
                        <strong class="block text-zinc-900 mb-2 font-bold">Check 1: Layout Thrashing</strong>
                        <p class="text-zinc-500">
                            Are you reading <code>getBoundingClientRect</code> or <code>computedStyle</code> inside a plugin's <code>update</code> loop? Remove it. Use <code>state.interaction</code> instead.
                        </p>
                    </div>
                    <div>
                        <strong class="block text-zinc-900 mb-2 font-bold">Check 2: Heavy Filters</strong>
                        <p class="text-zinc-500">
                            <code>backdrop-filter</code> or large box-shadows on the cursor element can cause GPU bottlenecks on 4K screens. Try disabling effects to isolate.
                        </p>
                    </div>
                </div>
            </div>
        </div>

    </div>

  </DocsSection>
</template>
