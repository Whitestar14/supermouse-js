
<script setup lang="ts">
import DocsSection from './DocsSection.vue';
</script>

<template>
  <DocsSection id="architecture" label="04. Internals" title="Architecture">
     <div class="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
        <!-- Core Runtime -->
        <div class="col-span-1">
           <h3 class="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <div class="w-2 h-2 bg-black"></div>
                Core Runtime
           </h3>
           <p class="text-sm text-zinc-600 mb-4 leading-relaxed">
               Located at <code>packages/core/src/Supermouse.ts</code>. It acts as the central hub managing state and the requestAnimationFrame loop.
           </p>
           <div class="bg-zinc-50 border border-zinc-200 p-4 text-xs font-mono text-zinc-500 space-y-2">
                <div class="flex justify-between"><span>state.pointer</span> <span class="text-zinc-300">Input</span></div>
                <div class="flex justify-between"><span>state.target</span> <span class="text-zinc-300">Physics</span></div>
                <div class="flex justify-between"><span>state.smooth</span> <span class="text-zinc-300">Render</span></div>
           </div>
        </div>

        <!-- Systems -->
        <div class="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="p-6 border border-zinc-200 bg-white hover:border-black transition-colors">
                 <h4 class="font-bold text-zinc-900 mb-2 font-mono text-sm">Input System</h4>
                 <p class="text-sm text-zinc-600 leading-relaxed">
                    Listens for <code>mousemove</code> and <code>touch</code>. Handles the Veto logic (Native cursor overrides) and accessibility checks.
                 </p>
              </div>
              <div class="p-6 border border-zinc-200 bg-white hover:border-black transition-colors">
                 <h4 class="font-bold text-zinc-900 mb-2 font-mono text-sm">Stage System</h4>
                 <p class="text-sm text-zinc-600 leading-relaxed">
                    Manages the fixed <code>div</code> container and injects global CSS to hide the native cursor on specific elements.
                 </p>
              </div>
        </div>
     </div>

     <!-- Loop Visualizer -->
     <div class="border border-zinc-200 bg-zinc-50 p-8">
        <h3 class="font-bold text-zinc-900 mb-8 uppercase tracking-widest text-xs">The Update Loop (1 Frame)</h3>
        
        <div class="relative flex flex-col md:flex-row justify-between gap-4">
            <!-- Connector Line -->
            <div class="absolute top-4 left-0 right-0 h-0.5 bg-zinc-200 hidden md:block z-0"></div>

            <div class="relative z-10 flex flex-col gap-4 md:w-1/4 group">
                <div class="w-8 h-8 bg-white border border-zinc-300 rounded-full flex items-center justify-center font-bold text-xs text-zinc-500 group-hover:border-black group-hover:text-black transition-colors">1</div>
                <div>
                    <h4 class="font-bold text-sm text-zinc-900">Visibility</h4>
                    <p class="text-xs text-zinc-500">Check Input/Veto state</p>
                </div>
            </div>

            <div class="relative z-10 flex flex-col gap-4 md:w-1/4 group">
                <div class="w-8 h-8 bg-white border border-zinc-300 rounded-full flex items-center justify-center font-bold text-xs text-zinc-500 group-hover:border-black group-hover:text-black transition-colors">2</div>
                <div>
                    <h4 class="font-bold text-sm text-zinc-900">Targeting</h4>
                    <p class="text-xs text-zinc-500">Update target coordinates</p>
                </div>
            </div>

            <div class="relative z-10 flex flex-col gap-4 md:w-1/4 group">
                <div class="w-8 h-8 bg-white border border-zinc-300 rounded-full flex items-center justify-center font-bold text-xs text-zinc-500 group-hover:border-black group-hover:text-black transition-colors">3</div>
                <div>
                    <h4 class="font-bold text-sm text-zinc-900">Plugins</h4>
                    <p class="text-xs text-zinc-500">Run <code>plugin.update()</code></p>
                </div>
            </div>

            <div class="relative z-10 flex flex-col gap-4 md:w-1/4 group">
                <div class="w-8 h-8 bg-white border border-zinc-300 rounded-full flex items-center justify-center font-bold text-xs text-zinc-500 group-hover:border-black group-hover:text-black transition-colors">4</div>
                <div>
                    <h4 class="font-bold text-sm text-zinc-900">Smoothing</h4>
                    <p class="text-xs text-zinc-500">Lerp & Velocity</p>
                </div>
            </div>
        </div>
     </div>
  </DocsSection>
</template>
