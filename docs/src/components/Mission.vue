
<template>
  <section class="relative">
     <!-- Header -->
     <div class="flex border-b border-zinc-200 h-16 md:h-20 bg-white">
      <div class="w-[80px] md:w-[96px] border-r border-zinc-200 flex items-center justify-center shrink-0">
        <span class="mono text-lg font-bold text-zinc-900">02</span>
      </div>
      <div class="flex-1 px-8 flex items-center justify-between">
         <h2 class="text-xl font-bold tracking-tighter text-zinc-900">Our Mission</h2>
         <span class="mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">manifesto.md</span>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row border-b border-zinc-200 relative overflow-hidden">
       <!-- Sidebar Gutter -->
       <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0"></div>

       <!-- Text Content -->
       <div class="flex-1 p-8 md:p-16 lg:p-24 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white relative z-10">
          <h2 class="text-4xl md:text-5xl font-bold tracking-tighter text-zinc-900 mb-8 text-pretty leading-[1.1]">The Mission</h2>
          <div class="prose prose-lg text-zinc-600 font-medium leading-relaxed max-w-2xl text-pretty">
            <p class="mb-6">
              We are building a unified high-performance toolchain for user interaction: including 
              <span class="text-zinc-900 font-bold"> input normalization</span>, 
              <span class="text-zinc-900 font-bold"> physics-based smoothing</span>, and a 
              <span class="text-zinc-900 font-bold"> modular rendering stage</span>.
            </p>
            <p>
              Our mission is to make the next generation of web interfaces more organic and expressive than ever before, without the performance cost of traditional animation libraries.
            </p>
          </div>
       </div>

       <!-- Graphic Content - Animated 3D Cube -->
       <div class="w-full lg:w-[480px] shrink-0 bg-zinc-50/50 relative min-h-[400px] flex items-center justify-center overflow-hidden">
          <div class="absolute inset-0 grid-bg opacity-30 pointer-events-none"></div>
          
          <div class="scene-3d">
            <div class="cube-3d">
              <div class="face face-front">FRONT</div>
              <div class="face face-back">BACK</div>
              <div class="face face-right">RIGHT</div>
              <div class="face face-left">LEFT</div>
              <div class="face face-top">TOP</div>
              <div class="face face-bottom">BTM</div>
            </div>
          </div>

          <div class="absolute top-6 left-6 mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
             pnpm -r build
          </div>
          <div class="absolute bottom-6 right-6 mono text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
             Completed in: 14ms
          </div>
       </div>
    </div>
  </section>
</template>
