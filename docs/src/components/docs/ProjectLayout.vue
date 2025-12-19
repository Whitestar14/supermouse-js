
<script setup lang="ts">
import CodeBlock from '../CodeBlock.vue';
import DocsSection from './DocsSection.vue';

const tree = `.
+-- packages/
|   +-- core/       # Runtime loop & Systems
|   +-- dot/        # @supermousejs/dot
|   +-- ring/       # @supermousejs/ring
|   +-- sparkles/   # @supermousejs/sparkles
|   +-- image/      # @supermousejs/image
|   +-- text/       # @supermousejs/text
|   ...
+-- playground/     # Vite + Vue dev app
+-- scripts/        # CLI helpers`;
</script>

<template>
  <DocsSection id="project-layout" label="02. Structure" title="Monorepo Layout">
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-12">
        <div>
            <CodeBlock :code="tree" title="Directory Tree" />
        </div>
        
        <div class="space-y-6">
            <div class="group">
                <h4 class="font-mono text-sm font-bold text-black mb-2 group-hover:text-purple-600 transition-colors">packages/core/</h4>
                <p class="text-sm text-zinc-600 leading-relaxed border-l border-zinc-200 pl-4">
                    The runtime: <code>Supermouse</code> class, <code>systems</code> (Input, Stage), and <code>utils</code>. This is the only package that implements the runtime loop and plugin lifecycle.
                </p>
            </div>
            <div class="group">
                <h4 class="font-mono text-sm font-bold text-black mb-2 group-hover:text-purple-600 transition-colors">packages/* (plugins)</h4>
                <p class="text-sm text-zinc-600 leading-relaxed border-l border-zinc-200 pl-4">
                    Independent packages like <code>dot</code>, <code>ring</code>, <code>sparkles</code>. Each follows the naming convention <code>@supermousejs/&lt;name&gt;</code>.
                </p>
            </div>
            <div class="group">
                <h4 class="font-mono text-sm font-bold text-black mb-2 group-hover:text-purple-600 transition-colors">playground/</h4>
                <p class="text-sm text-zinc-600 leading-relaxed border-l border-zinc-200 pl-4">
                    A Vite + Vue dev app used to demo and iterate on plugins. It pulls packages via <code>workspace:*</code> for hot-reloading.
                </p>
            </div>
        </div>
    </div>
  </DocsSection>
</template>
