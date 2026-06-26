<script setup lang="ts">
import DocsSection from "@/components/docs/DocsSection.vue";
import CodeBlock from "@/components/shared/CodeBlock.vue";
import { GITHUB_URL } from "@config/constants";

const diagnostics = [
  {
    id: "00",
    type: "TOOL",
    title: "Unknown Conflict",
    signal: "Elements behave inconsistently or multiple cursors appear.",
    fix: 'The optional <code>@supermousejs/utils</code> package includes a diagnostic <a href="/docs/reference/api#doctor" class="text-black font-bold underline decoration-zinc-300 hover:decoration-black transition-all"><code>doctor()</code></a> utility. It audits the active document layers for inline <code>cursor</code> styles or specificity conflicts that override Supermouse styles.',
    code: "import { doctor } from '@supermousejs/utils';\n\ndoctor(); // Run in browser console"
  },
  {
    id: "01",
    type: "VISUAL",
    title: "Double Cursor",
    signal: "The native OS cursor flickers or renders on top of the custom cursor.",
    fix: 'Usually caused by inline styles (<code>style="cursor: pointer"</code>) or high-specificity selector declarations overriding the dynamically injected stage rules. Migrate CSS pointer definitions to programmatic <a href="/docs/reference/api#rules" class="text-black font-bold underline decoration-zinc-300 hover:decoration-black transition-all"><code>rules</code></a>.',
    code: null
  },
  {
    id: "02",
    type: "LAYER",
    title: "Hidden Behind Modals",
    signal: "Cursor vanishes when opening a dialog, overlay container, or side drawer.",
    fix: "The overlay container has a higher layout priority than the cursor stage. Supermouse mounts overlays between <code>300-400</code>, but third-party components often use extreme limits like <code>9999</code>. Configure your CSS theme parameters accordingly.",
    code: ":root {\n  --cursor-z-index: 99999; /* Set higher than modal layer */\n}"
  },
  {
    id: "03",
    type: "BROWSER",
    title: "Stuck on iFrames",
    signal: "Cursor freezes or disappears at the boundary of a video player or map element.",
    fix: "Browsers suspend mouse event dispatching to the host window when hovering iframe embeds. Disable pointer interaction on frame blocks if cursor continuity is required.",
    code: "iframe {\n  pointer-events: none; /* Passes mouse coordinates to parent */\n}"
  },
  {
    id: "04",
    type: "ENV",
    title: "Mobile Ghosts",
    signal: "Interacting on touch screens renders a static cursor node at tap points.",
    fix: 'Supermouse is designed to hibernate on coarse pointer contexts via <a href="/docs/reference/api#autodisableonmobile" class="text-black font-bold underline decoration-zinc-300 hover:decoration-black transition-all"><code>autoDisableOnMobile</code></a>. Ensure <a href="/docs/reference/api#enabletouch" class="text-black font-bold underline decoration-zinc-300 hover:decoration-black transition-all"><code>enableTouch</code></a> is not set to true.',
    code: null
  },
  {
    id: "05",
    type: "DEV",
    title: "React Strict Mode",
    signal: "Duplicate cursors mount in development, or frame listeners run twice.",
    fix: 'React 18 mounts effects twice during development. Ensure you call <a href="/docs/reference/api#destroy" class="text-black font-bold underline decoration-zinc-300 hover:decoration-black transition-all"><code>destroy()</code></a> on cleanup if not using our official wrapper.',
    code: "useEffect(() => {\n  const app = new Supermouse();\n  return () => app.destroy(); \n}, []);"
  },
  {
    id: "06",
    type: "PERF",
    title: "High Hz Jitter",
    signal: "Damping dynamics stutter or speed up on high-frequency monitors.",
    fix: 'Avoid basic frame-count linear interpolations. Visual updates must account for variable hardware refresh rates by using the frame delta parameter (<code>dt</code>) and the <a href="/docs/reference/api#damp" class="text-black font-bold underline decoration-zinc-300 hover:decoration-black transition-all"><code>math.damp()</code></a> helper.',
    code: null
  }
];
</script>

<template>
  <DocsSection label="Guide" title="Troubleshooting">
    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      Custom cursor implementations must coordinate with native browser pointer behaviors. Use this
      diagnostic matrix to isolate and resolve runtime conflicts.
    </p>

    <!-- Diagnostic Grid (Border Collapsed) -->
    <div class="border-t border-l border-zinc-200 bg-zinc-200 gap-px grid">
      <div
        v-for="item in diagnostics"
        :key="item.id"
        class="grid grid-cols-1 lg:grid-cols-12 bg-white"
      >
        <!-- Left: Signal -->
        <div class="lg:col-span-4 p-6 md:p-8 flex flex-col gap-4 border-b border-r border-zinc-200">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {{ item.id }} / {{ item.type }}
            </span>
          </div>

          <h3 class="text-xl font-bold text-zinc-900 tracking-tight">
            {{ item.title }}
          </h3>

          <div class="mt-auto pl-3 border-l-2 border-zinc-100">
            <p class="text-xs italic text-zinc-500 font-medium leading-relaxed">
              "{{ item.signal }}"
            </p>
          </div>
        </div>

        <!-- Right: Correction -->
        <div
          class="lg:col-span-8 p-6 md:p-8 flex flex-col justify-center border-b border-r border-zinc-200"
        >
          <div class="text-sm text-zinc-800 leading-relaxed mb-4 max-w-2xl" v-html="item.fix" />

          <div v-if="item.code" class="mt-2">
            <CodeBlock
              :code="item.code"
              lang="typescript"
              :clean="true"
              class="text-xs border border-zinc-200 bg-zinc-50"
            />
          </div>
        </div>
      </div>
    </div>
  </DocsSection>
</template>
