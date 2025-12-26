
<template>
  <section class="relative">
     <!-- Header -->
    <div class="flex border-b border-zinc-200 h-16 md:h-20 bg-white">
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-zinc-900">03</span>
      </div>
      <div class="flex-1 px-6 md:px-8 flex items-center justify-between">
         <h2 class="text-lg md:text-xl font-bold tracking-tighter text-zinc-900">Impact</h2>
         <span class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold hidden sm:inline-block">analytics.json</span>
      </div>
    </div>

    <div class="border-b border-zinc-200 overflow-hidden relative min-h-[400px] md:min-h-[500px] flex flex-col">
       <div class="flex-1 flex">
          <!-- Gutter -->
          <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 z-10 bg-white/50"></div>
          
          <div class="flex-1 relative flex flex-col px-6 py-12 md:p-16 lg:p-24">
             <div class="relative z-10 max-w-3xl">
                <h2 class="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 tracking-tighter leading-[1.1] mb-6">
                   Our projects are already trusted by <br class="hidden sm:block"/>
                   thousands of developers around the world.
                </h2>
                <div class="flex flex-wrap gap-8 mt-12">
                   <div>
                      <div class="text-3xl sm:text-4xl font-bold font-mono text-zinc-900">1.2K</div>
                      <div class="text-xs uppercase font-bold tracking-widest text-zinc-400 mt-2">Monthly Downloads</div>
                   </div>
                   <div class="w-px h-16 bg-zinc-200 hidden sm:block"></div>
                   <div>
                      <div class="text-3xl sm:text-4xl font-bold font-mono text-zinc-900">14ms</div>
                      <div class="text-xs uppercase font-bold tracking-widest text-zinc-400 mt-2">Avg. Load Time</div>
                   </div>
                </div>
             </div>
             
             <!-- Big Graph Background -->
             <div class="absolute inset-x-0 bottom-0 h-[200px] md:h-[300px] pointer-events-none">
                <div class="absolute inset-0 grid-bg opacity-30"></div>
                <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
                   <defs>
                      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="rgb(245, 158, 11)" stop-opacity="0.2" />
                        <stop offset="100%" stop-color="rgb(245, 158, 11)" stop-opacity="0" />
                      </linearGradient>
                   </defs>
                   <path d="M0,300 L0,250 L50,260 L100,240 L150,280 L200,220 L250,230 L300,180 L350,200 L400,150 L450,160 L500,120 L550,140 L600,100 L650,110 L700,50 L750,70 L800,20 L850,40 L900,10 L950,5 L1000,0 L1000,300 Z" 
                         fill="url(#grad1)" />
                   <path d="M0,250 L50,260 L100,240 L150,280 L200,220 L250,230 L300,180 L350,200 L400,150 L450,160 L500,120 L550,140 L600,100 L650,110 L700,50 L750,70 L800,20 L850,40 L900,10 L950,5 L1000,0" 
                         fill="none" stroke="#f59e0b" stroke-width="3" vector-effect="non-scaling-stroke" />
                </svg>
             </div>
          </div>
       </div>
    </div>
  </section>
</template>
