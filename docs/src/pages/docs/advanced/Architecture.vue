
<script setup lang="ts">
import DocsSection from '../../../components/docs/DocsSection.vue';
import CodeBlock from '../../../components/CodeBlock.vue';

const dampCode = `const damp = (current, target, lambda, dt) => {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
};`;

const loopCode = `// Pseudocode of the actual tick function
function tick(time) {
  const dt = time - lastTime;
  
  // 1. Logic (Priority < 0)
  // Plugins modify where we WANT to go
  state.target = { ...state.pointer };
  runLogicPlugins(state); 

  // 2. Physics
  // Core smooths the movement
  state.smooth.x = damp(state.smooth.x, state.target.x, lambda, dt);
  
  // 3. Visuals (Priority >= 0)
  // Plugins render the result
  runVisualPlugins(state);
}`;
</script>

<template>
  <DocsSection label="Advanced" title="Core Architecture">
    
    <div class="mb-16">
      <p class="text-lg text-zinc-600 leading-relaxed mb-6">
        Supermouse treats the cursor as a game character. It runs a continuous loop that separates <span class="text-black font-bold border-b-2 border-black/10">User Input</span> from <span class="text-black font-bold border-b-2 border-black/10">Cursor Intent</span> and <span class="text-black font-bold border-b-2 border-black/10">Visual Rendering</span>.
      </p>
      <p class="text-lg text-zinc-600 leading-relaxed">
        This separation is what allows a magnetic button to "pull" the cursor (modifying Intent) without the input system needing to know, and without the visual dot jumping instantly (Physics handles the smoothing).
      </p>
    </div>

    <!-- The Pipeline -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mb-8">The Frame Loop (16ms)</h3>

    <div class="relative border-l-2 border-zinc-200 ml-4 md:ml-8 space-y-16">
        
        <!-- STEP 1: SENSE -->
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-zinc-300 rounded-full group-hover:border-black transition-all"></div>
            
            <div class="flex flex-col xl:flex-row gap-8">
                <div class="flex-1">
                    <span class="mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Phase 01: Sense</span>
                    <h4 class="text-xl font-bold text-zinc-900 mb-4">Input Normalization</h4>
                    <p class="text-zinc-600 leading-relaxed mb-6">
                        The <code>Input</code> system captures native DOM events (mousemove, touchmove). It normalizes coordinates relative to the container and checks for accessibility preferences (reduced-motion).
                    </p>
                    <div class="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-mono">
                        <span class="block font-bold text-zinc-900 mb-1 uppercase tracking-widest text-[10px]">Responsibility</span>
                        Sanitize input. Check device capabilities. Update <span class="text-zinc-900 font-bold">state.pointer</span>.
                    </div>
                </div>
            </div>
        </div>

        <!-- STEP 2: LOGIC -->
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-zinc-300 rounded-full group-hover:border-black transition-all"></div>
            
            <div class="flex flex-col xl:flex-row gap-8">
                <div class="flex-1">
                    <span class="mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Phase 02: Intent</span>
                    <h4 class="text-xl font-bold text-zinc-900 mb-4">Logic Plugins</h4>
                    <p class="text-zinc-600 leading-relaxed mb-6">
                        Plugins with <code>priority &lt; 0</code> execute. This is where "magic" happens. A magnetic plugin might look at the hovered element and say "Hey, I know the mouse is at 500, but I want the cursor to snap to the center of this button at 550."
                    </p>
                    <div class="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-mono">
                        <span class="block font-bold text-zinc-900 mb-1 uppercase tracking-widest text-[10px]">Responsibility</span>
                        Hijack the user's intent. Modify <span class="text-zinc-900 font-bold">state.target</span>.
                    </div>
                </div>
            </div>
        </div>

        <!-- STEP 3: PHYSICS -->
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-black border-2 border-zinc-900 rounded-full group-hover:scale-125 transition-all"></div>
            
            <div class="flex flex-col xl:flex-row gap-8">
                <div class="flex-1">
                    <span class="mono text-[10px] font-bold text-zinc-900 uppercase tracking-widest mb-2 block">Phase 03: Physics</span>
                    <h4 class="text-xl font-bold text-zinc-900 mb-4">Core Damping</h4>
                    <p class="text-zinc-600 leading-relaxed mb-6">
                        The Core calculates the difference between where we are (<span class="mono text-xs text-black bg-zinc-100 px-1">smooth</span>) and where we want to go (<span class="mono text-xs text-black bg-zinc-100 px-1">target</span>). It applies frame-rate independent damping to calculate the new position for this specific frame.
                    </p>
                    <CodeBlock :code="dampCode" lang="javascript" :clean="true" class="border border-zinc-200" />
                </div>
            </div>
        </div>

        <!-- STEP 4: RENDER -->
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-zinc-300 rounded-full group-hover:border-black transition-all"></div>
            
            <div class="flex flex-col xl:flex-row gap-8">
                <div class="flex-1">
                    <span class="mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Phase 04: Render</span>
                    <h4 class="text-xl font-bold text-zinc-900 mb-4">Visual Plugins</h4>
                    <p class="text-zinc-600 leading-relaxed mb-6">
                        Visual plugins (Dot, Ring) read the final <code>state.smooth</code> coordinates and apply CSS transforms to their DOM elements.
                    </p>
                    <div class="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-mono">
                        <span class="block font-bold text-zinc-900 mb-1 uppercase tracking-widest text-[10px]">Responsibility</span>
                        Read <span class="text-zinc-900 font-bold">state.smooth</span>. Write to DOM (transform).
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- Performance Systems -->
    <h3 class="text-2xl font-bold text-zinc-900 tracking-tight mt-20 mb-8">Performance Strategy</h3>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 border border-zinc-200">
        <div class="bg-white p-8">
            <h4 class="text-lg font-bold text-zinc-900 mb-4">Interaction Scraping</h4>
            <p class="text-sm text-zinc-600 leading-relaxed mb-4">
                Reading DOM attributes (<code>getAttribute</code>) or styles (<code>getComputedStyle</code>) during the render loop causes layout thrashing. 
            </p>
            <p class="text-sm text-zinc-600 leading-relaxed">
                Supermouse solves this by parsing interaction data <strong>only once</strong> when the <code>mouseover</code> event fires. It stores the result in a <code>WeakMap</code> cache. The loop reads from this cache, making interaction checks O(1).
            </p>
        </div>
        <div class="bg-white p-8">
            <h4 class="text-lg font-bold text-zinc-900 mb-4">The Stage System</h4>
            <p class="text-sm text-zinc-600 leading-relaxed mb-4">
                The "Double Cursor" glitch happens when an element's CSS (`cursor: pointer`) overrides the body's `cursor: none`.
            </p>
            <p class="text-sm text-zinc-600 leading-relaxed">
                Hiding the body cursor won't be enough, so Supermouse injects a dynamic <code>&lt;style&gt;</code> tag that targets every interactive selector registered by plugins (e.g. <code>a, button, [data-hover]</code>) and applies <code>cursor: none !important</code>.
            </p>
        </div>
    </div>

    <div class="mt-16">
        <h3 class="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-widest">Reference Implementation</h3>
        <CodeBlock :code="loopCode" lang="typescript" title="core/Supermouse.ts (Simplified)" />
    </div>

  </DocsSection>
</template>
