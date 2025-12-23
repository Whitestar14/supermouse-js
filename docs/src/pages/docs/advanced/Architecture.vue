
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
      <p class="text-xl text-zinc-900 font-bold leading-tight max-w-3xl mb-6">
        Supermouse treats the cursor as a game character. It runs a continuous loop that separates <span class="text-amber-600">User Input</span> from <span class="text-amber-600">Cursor Intent</span> and <span class="text-amber-600">Visual Rendering</span>.
      </p>
      <p class="text-zinc-600 leading-relaxed max-w-3xl">
        This separation is what allows a magnetic button to "pull" the cursor (modifying Intent) without the input system needing to know, and without the visual dot jumping instantly (Physics handles the smoothing).
      </p>
    </div>

    <!-- The Pipeline -->
    <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mb-8 pb-4 border-b border-zinc-200">
        The Frame Loop (16ms)
    </h3>

    <div class="relative border-l-2 border-zinc-200 ml-4 md:ml-8 space-y-12">
        
        <!-- STEP 1: SENSE -->
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-zinc-300 rounded-full group-hover:border-amber-500 group-hover:scale-125 transition-all"></div>
            
            <div class="flex flex-col xl:flex-row gap-8">
                <div class="flex-1">
                    <span class="mono text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 block">Phase 01: Sense</span>
                    <h4 class="text-2xl font-bold text-zinc-900 mb-3">Input Normalization</h4>
                    <p class="text-zinc-600 text-sm leading-relaxed mb-4">
                        The <code>Input</code> system captures native DOM events (mousemove, touchmove). It normalizes coordinates relative to the container and checks for accessibility preferences (reduced-motion).
                    </p>
                    <div class="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-mono">
                        <span class="block font-bold text-zinc-900 mb-1">Responsibility:</span>
                        Sanitize input. Check device capabilities. Update <span class="text-amber-700">state.pointer</span>.
                    </div>
                </div>
                <div class="w-full xl:w-[320px] shrink-0">
                    <div class="bg-zinc-900 p-4 text-zinc-400 font-mono text-xs leading-loose rounded-sm">
                        <span class="text-zinc-500">// State Snapshot</span><br>
                        pointer: <span class="text-white">{ x: 500, y: 300 }</span><br>
                        target: <span class="text-zinc-600">{ x: 490, y: 295 }</span><br>
                        smooth: <span class="text-zinc-600">{ x: 450, y: 250 }</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- STEP 2: LOGIC -->
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-zinc-300 rounded-full group-hover:border-amber-500 group-hover:scale-125 transition-all"></div>
            
            <div class="flex flex-col xl:flex-row gap-8">
                <div class="flex-1">
                    <span class="mono text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 block">Phase 02: Intent</span>
                    <h4 class="text-2xl font-bold text-zinc-900 mb-3">Logic Plugins</h4>
                    <p class="text-zinc-600 text-sm leading-relaxed mb-4">
                        Plugins with <code>priority &lt; 0</code> execute. This is where "magic" happens. A magnetic plugin might look at the hovered element and say "Hey, I know the mouse is at 500, but I want the cursor to snap to the center of this button at 550."
                    </p>
                    <div class="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-mono">
                        <span class="block font-bold text-zinc-900 mb-1">Responsibility:</span>
                        Hijack the user's intent. Modify <span class="text-amber-700">state.target</span>.
                    </div>
                </div>
                <div class="w-full xl:w-[320px] shrink-0">
                    <div class="bg-zinc-900 p-4 text-zinc-400 font-mono text-xs leading-loose rounded-sm">
                        <span class="text-zinc-500">// State Snapshot</span><br>
                        pointer: <span class="text-zinc-500">{ x: 500, y: 300 }</span><br>
                        target: <span class="text-amber-400">{ x: 550, y: 320 }</span><span class="text-zinc-600"> // Modified!</span><br>
                        smooth: <span class="text-zinc-600">{ x: 450, y: 250 }</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- STEP 3: PHYSICS -->
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-black border-2 border-zinc-900 rounded-full group-hover:scale-125 transition-all"></div>
            
            <div class="flex flex-col xl:flex-row gap-8">
                <div class="flex-1">
                    <span class="mono text-[10px] font-bold text-black uppercase tracking-widest mb-2 block">Phase 03: Physics</span>
                    <h4 class="text-2xl font-bold text-zinc-900 mb-3">Core Damping</h4>
                    <p class="text-zinc-600 text-sm leading-relaxed mb-4">
                        The Core calculates the difference between where we are (<span class="mono text-xs">smooth</span>) and where we want to go (<span class="mono text-xs">target</span>). It applies frame-rate independent damping to calculate the new position for this specific frame.
                    </p>
                    <CodeBlock :code="dampCode" lang="javascript" :clean="true" class="border border-zinc-200" />
                </div>
                <div class="w-full xl:w-[320px] shrink-0">
                    <div class="bg-zinc-900 p-4 text-zinc-400 font-mono text-xs leading-loose rounded-sm">
                        <span class="text-zinc-500">// State Snapshot</span><br>
                        pointer: <span class="text-zinc-500">{ x: 500, y: 300 }</span><br>
                        target: <span class="text-zinc-500">{ x: 550, y: 320 }</span><br>
                        smooth: <span class="text-white">{ x: 485, y: 275 }</span><span class="text-zinc-600"> // Interpolated</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- STEP 4: RENDER -->
        <div class="relative pl-8 md:pl-12 group">
            <div class="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-zinc-300 rounded-full group-hover:border-amber-500 group-hover:scale-125 transition-all"></div>
            
            <div class="flex flex-col xl:flex-row gap-8">
                <div class="flex-1">
                    <span class="mono text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2 block">Phase 04: Render</span>
                    <h4 class="text-2xl font-bold text-zinc-900 mb-3">Visual Plugins</h4>
                    <p class="text-zinc-600 text-sm leading-relaxed mb-4">
                        Visual plugins (Dot, Ring) read the final <code>state.smooth</code> coordinates and apply CSS transforms to their DOM elements.
                    </p>
                    <div class="p-4 bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-mono">
                        <span class="block font-bold text-zinc-900 mb-1">Responsibility:</span>
                        Read <span class="text-amber-700">state.smooth</span>. Write to DOM (transform).
                    </div>
                </div>
                <div class="w-full xl:w-[320px] shrink-0 flex items-center justify-center bg-zinc-100 border border-zinc-200">
                    <div class="relative w-full h-full min-h-[140px] flex items-center justify-center opacity-50">
                        <div class="w-2 h-2 bg-black rounded-full absolute" style="transform: translate(10px, -10px)"></div>
                        <div class="w-8 h-8 border border-black rounded-full absolute" style="transform: translate(5px, -5px)"></div>
                        <span class="absolute bottom-2 right-2 font-mono text-[10px] text-zinc-400">OUTPUT</span>
                    </div>
                </div>
            </div>
        </div>

    </div>

    <!-- Performance Systems -->
    <h3 class="font-mono text-xs font-bold uppercase tracking-widest text-zinc-900 mt-20 mb-8 pb-4 border-b border-zinc-200">
        Performance Strategy
    </h3>

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
                Supermouse doesn't just hide the body cursor. It injects a dynamic <code>&lt;style&gt;</code> tag that targets every interactive selector registered by plugins (e.g. <code>a, button, [data-hover]</code>) and applies <code>cursor: none !important</code>.
            </p>
        </div>
    </div>

    <div class="mt-16">
        <h3 class="text-sm font-bold text-zinc-900 mb-4">Reference Implementation</h3>
        <CodeBlock :code="loopCode" lang="typescript" title="core/Supermouse.ts (Simplified)" />
    </div>

  </DocsSection>
</template>
