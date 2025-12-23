
<script setup lang="ts">
// No data imports needed anymore
</script>

<template>
  <section class="relative">
    <!-- Header -->
    <div class="flex border-b border-zinc-200 h-16 md:h-20 bg-white">
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-zinc-900">01</span>
      </div>
      <div class="flex-1 px-8 flex items-center justify-between">
         <h2 class="text-xl font-bold tracking-tighter text-zinc-900">Ecosystem</h2>
         <span class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">plugins.json</span>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row border-b border-zinc-200">
       <!-- Sidebar Gutter -->
       <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-zinc-50/30"></div>
       
       <!-- Content Container -->
       <div class="flex-1 flex flex-col md:flex-row">
          
          <!-- Text Block -->
          <div class="flex-1 p-8 md:p-16 lg:p-24 bg-white relative z-10">
             <div class="max-w-2xl">
                <span class="inline-block px-3 py-1 bg-zinc-100 text-zinc-900 mono text-[10px] uppercase font-bold tracking-widest mb-6">
                    Architecture
                </span>
                <h3 class="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 mb-8 leading-[1.05]">
                    Plugins are first-class citizens.
                </h3>
                <p class="text-lg text-zinc-600 font-medium leading-relaxed mb-8 text-pretty">
                    Supermouse isn't a monolith. It's a tiny kernel that coordinates independent modules. 
                    From the <span class="text-black font-bold">Dot</span> cursor to the <span class="text-black font-bold">Magnetic</span> effect, everything is a plugin.
                </p>
                <div class="flex flex-col sm:flex-row gap-4">
                    <router-link to="/docs/advanced/authoring" class="inline-flex h-12 items-center px-6 bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-colors">
                        Write a Plugin
                    </router-link>
                    <router-link to="/docs/plugins/dot" class="inline-flex h-12 items-center px-6 border border-zinc-200 text-zinc-900 font-bold text-sm hover:bg-zinc-50 transition-colors">
                        Browse Ecosystem
                    </router-link>
                </div>
             </div>
          </div>

          <!-- Graphic Block -->
          <div class="w-full md:w-[320px] lg:w-[400px] border-t md:border-t-0 md:border-l border-zinc-200 bg-zinc-50/50 flex flex-col justify-center p-12">
              <div class="space-y-4 opacity-60 hover:opacity-100 transition-opacity duration-500">
                  <!-- Fake Module Blocks -->
                  <div class="h-16 border border-zinc-300 bg-white shadow-sm flex items-center px-4 gap-4">
                      <div class="w-8 h-8 bg-zinc-100 rounded-sm"></div>
                      <div class="flex-1 h-2 bg-zinc-100 rounded-sm"></div>
                  </div>
                  <div class="h-16 border border-zinc-900 bg-zinc-900 shadow-xl flex items-center px-4 gap-4 transform -translate-x-4">
                      <div class="w-8 h-8 bg-zinc-700 rounded-sm"></div>
                      <div class="flex-1 h-2 bg-zinc-700 rounded-sm"></div>
                  </div>
                  <div class="h-16 border border-zinc-300 bg-white shadow-sm flex items-center px-4 gap-4">
                      <div class="w-8 h-8 bg-zinc-100 rounded-sm"></div>
                      <div class="flex-1 h-2 bg-zinc-100 rounded-sm"></div>
                  </div>
              </div>
              <p class="mt-8 text-center mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
                  Modular Runtime
              </p>
          </div>

       </div>
    </div>
  </section>
</template>
