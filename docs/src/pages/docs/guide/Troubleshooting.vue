
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';
import { GITHUB_URL } from '../../../constants';

const diagnostics = [
  {
    id: '00',
    type: 'TOOL',
    title: 'Unknown Conflict',
    signal: 'Elements behave inconsistently or multiple cursors appear.',
    fix: `The optional <code>@supermousejs/utils</code> package includes a <code>doctor()</code> utility. It scans your DOM for elements with inline <code>cursor: pointer</code> styles or other specificity conflicts that commonly break custom cursors.`,
    code: `import { doctor } from '@supermousejs/utils';\n\ndoctor(); // Check console for warnings`
  },
  {
    id: '01',
    type: 'VISUAL',
    title: 'Double Cursor',
    signal: 'The native cursor flickers on top of the custom cursor.',
    fix: `Usually caused by CSS specificity. Inline styles (<code>style="cursor: pointer"</code>) or user-agent stylesheets (especially on inputs/links) override the global rule injected by Supermouse.`,
    code: null
  },
  {
    id: '02',
    type: 'LAYER',
    title: 'Hidden Behind Modals',
    signal: 'Cursor vanishes when opening a dialog, navbar, or toast.',
    fix: `Your modal has a higher <code>z-index</code> than the cursor container. Supermouse defaults to typical overlay values (300-400), but some UI libraries use <code>9999</code> or higher.`,
    code: `:root { --cursor-z-index: 99999; }`
  },
  {
    id: '03',
    type: 'BROWSER',
    title: 'Stuck on iFrames',
    signal: 'Cursor freezes or disappears at the edge of a YouTube embed or map.',
    fix: `Browsers stop sending mouse events to the parent window once the pointer crosses into an iframe context. This is a security limitation. You must disable pointer events on the iframe to keep the custom cursor moving over it.`,
    code: `iframe { pointer-events: none; }`
  },
  {
    id: '04',
    type: 'ENV',
    title: 'Mobile Ghosts',
    signal: 'Tapping on mobile shows a frozen cursor at the tap location.',
    fix: `This is not intended behavior. Supermouse is designed to hibernate completely on touch devices (<code>autoDisableOnMobile: true</code>). If you see this, ensure you haven't manually set <code>enableTouch: true</code>. If persistent, <a href="${GITHUB_URL}/issues" class="underline decoration-zinc-300 hover:decoration-black">file an issue</a>.`,
    code: null
  },
  {
    id: '05',
    type: 'DEV',
    title: 'React Strict Mode',
    signal: 'Two cursors appear in development, or events fire twice.',
    fix: `React 18 Strict Mode mounts effects twice. If you are not using the provided <code>@supermousejs/react</code> provider, ensure you call <code>destroy()</code> in your cleanup function.`,
    code: `useEffect(() => {\n  const app = new Supermouse();\n  return () => app.destroy(); \n}, []);`
  },
  {
    id: '06',
    type: 'PERF',
    title: 'High Hz Jitter',
    signal: 'Cursor stutters on 120hz/144hz monitors.',
    fix: `Supermouse v2 uses frame-rate independent damping. If you are writing a custom plugin, do NOT use simple lerp. Use the <code>dt</code> (delta time) argument provided in the update loop.`,
    code: null
  }
];
</script>

<template>
  <DocsSection label="Guide" title="Troubleshooting">
    
    <p class="text-lg text-zinc-600 mb-12 leading-relaxed">
      Custom cursors inevitably fight against the browser's default behavior. 
      Use this diagnostic matrix to identify conflicts.
    </p>

    <!-- Diagnostic Grid (Border Collapsed) -->
    <div class="border-t border-l border-zinc-200 bg-zinc-200 gap-px grid">
        
        <div v-for="item in diagnostics" :key="item.id" class="grid grid-cols-1 lg:grid-cols-12 bg-white">
            
            <!-- Left: Signal (Span 4) -->
            <div class="lg:col-span-4 p-6 md:p-8 flex flex-col gap-4 border-b border-r border-zinc-200">
                <div class="flex items-center justify-between">
                    <span class="mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
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

            <!-- Right: Correction (Span 8) -->
            <div class="lg:col-span-8 p-6 md:p-8 flex flex-col justify-center border-b border-r border-zinc-200">
                <div class="text-sm text-zinc-800 leading-relaxed mb-4 max-w-2xl" v-html="item.fix"></div>
                
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
