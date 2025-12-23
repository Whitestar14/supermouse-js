
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';

const coreClassDef = `class Supermouse {
  state: MouseState;
  options: SupermouseOptions;
  container: HTMLElement;

  constructor(options?: SupermouseOptions);
  
  // Property
  get isEnabled(): boolean;

  // Methods
  use(plugin: SupermousePlugin): this;
  enable(): void;
  disable(): void;
  destroy(): void;
  
  setCursor(type: 'auto' | 'none' | null): void;
  enablePlugin(name: string): void;
  disablePlugin(name: string): void;
  registerHoverTarget(selector: string): void;
}`;

const optionsData = [
  { name: 'smoothness', type: 'number', default: '0.15', desc: 'Physics damping factor (0-1). Lower is floatier, higher is snappier.' },
  { name: 'hideCursor', type: 'boolean', default: 'true', desc: 'Injects CSS to hide the native cursor on the body and interactive elements.' },
  { name: 'enableTouch', type: 'boolean', default: 'false', desc: 'If true, the cursor system runs on touch devices (not recommended).' },
  { name: 'ignoreOnNative', type: 'boolean', default: 'true', desc: 'Automatically unhides native cursor over inputs, textareas, and text selection.' },
  { name: 'autoDisableOnMobile', type: 'boolean', default: 'true', desc: 'Disables the system entirely if (pointer: coarse) is detected.' },
  { name: 'rules', type: 'Record<string, object>', default: '{}', desc: 'Map of CSS selectors to interaction state objects.' },
  { name: 'container', type: 'HTMLElement', default: 'document.body', desc: 'The root element to append cursor elements to.' },
];

const stateData = [
  { name: 'pointer', type: '{ x: number, y: number }', desc: 'Raw input coordinates from the event listener.' },
  { name: 'smooth', type: '{ x: number, y: number }', desc: 'Interpolated coordinates used for rendering.' },
  { name: 'target', type: '{ x: number, y: number }', desc: 'The goal position. Mutable by logic plugins (e.g. Magnetic).' },
  { name: 'velocity', type: '{ x: number, y: number }', desc: 'Current speed vector calculated from smooth movement.' },
  { name: 'interaction', type: 'Record<string, any>', desc: 'Metadata scraped from the currently hovered element.' },
  { name: 'hoverTarget', type: 'HTMLElement | null', desc: 'The specific DOM element triggering the hover state.' },
  { name: 'isDown', type: 'boolean', desc: 'True if mouse button is pressed.' },
  { name: 'isHover', type: 'boolean', desc: 'True if hovering a registered selector.' },
  { name: 'forcedCursor', type: "'auto' | 'none' | null", desc: 'Override for native cursor visibility. Managed via setCursor().' },
];

const pluginHooks = [
  { name: 'install(app)', desc: 'Called once when registered. Create DOM elements here.' },
  { name: 'update(app, dt)', desc: 'Called every frame. Update transforms here.' },
  { name: 'destroy(app)', desc: 'Called when the app is destroyed. Remove DOM elements here.' },
  { name: 'onEnable(app)', desc: 'Called when plugin is re-enabled. Restore visibility.' },
  { name: 'onDisable(app)', desc: 'Called when plugin is disabled. Hide visibility (opacity: 0).' },
];
</script>

<template>
  <DocsSection label="Reference" title="API">
    
    <!-- Class Definition -->
    <div class="mb-16">
        <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-4 pb-2 border-b border-zinc-200">
            Core Class
        </h3>
        <CodeBlock :code="coreClassDef" lang="typescript" :clean="false" title="Signature" />
    </div>

    <!-- Options -->
    <div class="mb-16">
        <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200 flex items-center justify-between">
            <span>SupermouseOptions</span>
            <span class="text-zinc-400 font-normal">Passed to constructor</span>
        </h3>
        
        <div class="border border-zinc-200 bg-white overflow-hidden">
            <table class="w-full text-left text-sm">
                <thead class="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                        <th class="px-4 py-3 font-mono text-xs font-bold text-zinc-500 uppercase w-1/4">Option</th>
                        <th class="px-4 py-3 font-mono text-xs font-bold text-zinc-500 uppercase w-1/6">Type</th>
                        <th class="px-4 py-3 font-mono text-xs font-bold text-zinc-500 uppercase w-1/6">Default</th>
                        <th class="px-4 py-3 font-mono text-xs font-bold text-zinc-500 uppercase">Description</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-200">
                    <tr v-for="opt in optionsData" :key="opt.name" class="group hover:bg-zinc-50 transition-colors">
                        <td class="px-4 py-3 font-mono text-zinc-900 font-bold">{{ opt.name }}</td>
                        <td class="px-4 py-3 font-mono text-zinc-500 text-xs">{{ opt.type }}</td>
                        <td class="px-4 py-3 font-mono text-zinc-400 text-xs">{{ opt.default }}</td>
                        <td class="px-4 py-3 text-zinc-600 leading-snug">{{ opt.desc }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- State -->
    <div class="mb-16">
        <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200 flex items-center justify-between">
            <span>MouseState</span>
            <span class="text-zinc-400 font-normal">Read/Write via app.state</span>
        </h3>
        
        <div class="border border-zinc-200 bg-white overflow-hidden">
            <table class="w-full text-left text-sm">
                <thead class="bg-zinc-50 border-b border-zinc-200">
                    <tr>
                        <th class="px-4 py-3 font-mono text-xs font-bold text-zinc-500 uppercase w-1/4">Property</th>
                        <th class="px-4 py-3 font-mono text-xs font-bold text-zinc-500 uppercase w-1/4">Type</th>
                        <th class="px-4 py-3 font-mono text-xs font-bold text-zinc-500 uppercase">Description</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-200">
                    <tr v-for="p in stateData" :key="p.name" class="group hover:bg-zinc-50 transition-colors">
                        <td class="px-4 py-3 font-mono text-zinc-900 font-bold">{{ p.name }}</td>
                        <td class="px-4 py-3 font-mono text-zinc-500 text-xs">{{ p.type }}</td>
                        <td class="px-4 py-3 text-zinc-600 leading-snug">{{ p.desc }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Plugin Interface -->
    <div class="mb-16">
        <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-6 pb-2 border-b border-zinc-200 flex items-center justify-between">
            <span>SupermousePlugin</span>
            <span class="text-zinc-400 font-normal">Lifecycle Hooks</span>
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
            <div v-for="hook in pluginHooks" :key="hook.name" class="bg-white p-6">
                <code class="text-sm font-bold text-black block mb-2">{{ hook.name }}</code>
                <p class="text-sm text-zinc-600 leading-relaxed">{{ hook.desc }}</p>
            </div>
        </div>
    </div>

  </DocsSection>
</template>
