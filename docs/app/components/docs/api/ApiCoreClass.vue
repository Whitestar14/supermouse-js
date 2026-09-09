<script setup lang="ts">
import CodeBlock from "@components/shared/CodeBlock.vue";
import Text from "@components/shared/Text.vue";

const coreClassDef = `class Supermouse {
  static readonly version: string;

  readonly version: string;
  state: MouseState;
  options: SupermouseOptions;
  get container(): HTMLDivElement;
  get isEnabled(): boolean;

  constructor(options?: SupermouseOptions);

  use(plugin: SupermousePlugin): this;
  getPlugin(name: string): SupermousePlugin | undefined;
  enablePlugin(name: string): void;
  disablePlugin(name: string): void;
  togglePlugin(name: string): void;

  start(): void;
  enable(): void;
  disable(): void;
  destroy(): void;
  step(time: number): void;

  setNativeCursor(type: 'show' | 'hide' | 'auto'): void;
  registerHoverTarget(selector: string): void;
}`;
</script>

<template>
  <div id="core-class" class="mb-20 scroll-mt-32">
    <h3
      class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4 pb-2 border-b border-zinc-200"
    >
      Core Class
    </h3>
    <Text class="mb-6 max-w-3xl">
      The <code>Supermouse</code> class is the runtime entry point. It owns the animation loop,
      input layer, plugin pipeline, and shared <code>MouseState</code>.
    </Text>
    <CodeBlock :code="coreClassDef" lang="typescript" :clean="false" title="Signature" />
  </div>
</template>
