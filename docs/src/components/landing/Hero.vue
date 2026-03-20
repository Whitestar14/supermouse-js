<script setup lang="ts">
import { ref } from "vue";
import CodeBlock from "@shared/CodeBlock.vue";

const copied = ref(false);

const copyCommand = () => {
  navigator.clipboard.writeText("pnpm add @supermousejs/core");
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
};

const heroCode = `import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';

const app = new Supermouse();

app.use(Dot({
  size: 8,
  color: '#f59e0b',
  mixBlendMode: 'difference'
}));`;
</script>

<template>
  <div class="relative border-b border-zinc-200 bg-white">
    <div class="flex flex-col lg:flex-row min-h-[640px]">
      <!-- Sidebar Spacer -->
      <div class="hidden lg:block w-[96px] border-r border-zinc-200 shrink-0 bg-white z-10" />

      <!-- Main Content Area -->
      <div class="flex-1 relative flex flex-col lg:flex-row items-center">
        <!-- Background Grid -->
        <!-- <div class="absolute inset-0 grid-bg opacity-100 pointer-events-none mix-blend-multiply" /> -->

        <div class="w-full h-full flex flex-col lg:flex-row max-w-7xl mx-auto z-10">
          <!-- Text Column -->
          <div
            class="flex-1 py-16 px-6 md:px-12 lg:px-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white/95 backdrop-blur-sm"
          >
            <!-- Version Badge -->
            <div class="inline-flex items-center gap-2 mb-10">
              <span class="mono text-[11px] uppercase tracking-widest text-zinc-500 font-bold"
                >v2.0 Stable</span
              >
            </div>

            <!-- Headline -->
            <h1
              class="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-zinc-900 mb-8 leading-[1.05]"
            >
              Cursor Engine <br />
              for Modern Tooling.
            </h1>

            <!-- Subtext -->
            <p class="text-xl text-zinc-600 font-medium max-w-md mb-12 leading-relaxed text-pretty">
              A modular engine with
              <span class="text-black font-bold border-b-2 border-black/10">optimized defaults</span
              >. Fully replaceable parts for maximum control.
            </p>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <router-link
                to="/docs"
                class="h-12 px-8 bg-black text-white text-sm font-bold flex items-center justify-center hover:bg-zinc-800 transition-colors"
              >
                Get Started
              </router-link>

              <button
                class="group h-12 px-5 bg-white border border-zinc-200 flex items-center gap-4 hover:border-zinc-400 transition-colors"
                @click="copyCommand"
              >
                <span class="mono text-zinc-400 text-xs select-none">$</span>
                <code class="mono flex-1 text-sm text-zinc-900 font-bold"
                  >pnpm add @supermousejs/core</code
                >
                <div class="relative size-4 justify-self-end ml-2">
                  <svg
                    v-if="!copied"
                    class="size-4 text-zinc-400 group-hover:text-black transition-colors"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <svg
                    v-else
                    class="w-4 h-4 text-zinc-900"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          <!-- Code Column -->
          <div
            class="w-full lg:w-[520px] shrink-0 bg-zinc-50/50 flex flex-col justify-center p-8 lg:p-12"
          >
            <CodeBlock
              :code="heroCode"
              title="main.ts"
              class="shadow-none border border-zinc-200"
            />

            <div class="mt-8 flex gap-8 justify-center opacity-40 grayscale">
              <!-- Fake logos/tech badges -->
              <div class="size-6 text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                  <path
                    d="M0 8.934l49.854.158 14.167 24.47 14.432-24.47L128 8.935l-63.834 110.14zm126.98.637l-24.36.02-38.476 66.053L25.691 9.592.942 9.572l63.211 107.89zm-25.149-.008l-22.745.168-15.053 24.647L49.216 9.73l-22.794-.168 37.731 64.476zm-75.834-.17l23.002.009m-23.002-.01l23.002.01"
                    fill="none"
                  />
                  <path
                    d="M25.997 9.393l23.002.009L64.035 34.36 79.018 9.404 102 9.398 64.15 75.053z"
                    fill="#35495e"
                  />
                  <path
                    d="M.91 9.569l25.067-.172 38.15 65.659L101.98 9.401l25.11.026-62.966 108.06z"
                    fill="#41b883"
                  />
                </svg>
              </div>
              <div class="size-6 text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                  <path fill="#fff" d="M22.67 47h99.67v73.67H22.67z" />
                  <path
                    data-name="original"
                    fill="#007acc"
                    d="M1.5 63.91v62.5h125v-125H1.5zm100.73-5a15.56 15.56 0 017.82 4.5 20.58 20.58 0 013 4c0 .16-5.4 3.81-8.69 5.85-.12.08-.6-.44-1.13-1.23a7.09 7.09 0 00-5.87-3.53c-3.79-.26-6.23 1.73-6.21 5a4.58 4.58 0 00.54 2.34c.83 1.73 2.38 2.76 7.24 4.86 8.95 3.85 12.78 6.39 15.16 10 2.66 4 3.25 10.46 1.45 15.24-2 5.2-6.9 8.73-13.83 9.9a38.32 38.32 0 01-9.52-.1 23 23 0 01-12.72-6.63c-1.15-1.27-3.39-4.58-3.25-4.82a9.34 9.34 0 011.15-.73L82 101l3.59-2.08.75 1.11a16.78 16.78 0 004.74 4.54c4 2.1 9.46 1.81 12.16-.62a5.43 5.43 0 00.69-6.92c-1-1.39-3-2.56-8.59-5-6.45-2.78-9.23-4.5-11.77-7.24a16.48 16.48 0 01-3.43-6.25 25 25 0 01-.22-8c1.33-6.23 6-10.58 12.82-11.87a31.66 31.66 0 019.49.26zm-29.34 5.24v5.12H56.66v46.23H45.15V69.26H28.88v-5a49.19 49.19 0 01.12-5.17C29.08 59 39 59 51 59h21.83z"
                  />
                </svg>
              </div>
              <div class="size-6 text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                  <defs>
                    <linearGradient
                      id="a"
                      x1="6"
                      x2="235"
                      y1="33"
                      y2="344"
                      gradientTransform="translate(0 .937) scale(.3122)"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stop-color="#41d1ff" />
                      <stop offset="1" stop-color="#bd34fe" />
                    </linearGradient>
                    <linearGradient
                      id="b"
                      x1="194.651"
                      x2="236.076"
                      y1="8.818"
                      y2="292.989"
                      gradientTransform="translate(0 .937) scale(.3122)"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop offset="0" stop-color="#ffea83" />
                      <stop offset=".083" stop-color="#ffdd35" />
                      <stop offset="1" stop-color="#ffa800" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#a)"
                    d="M124.766 19.52 67.324 122.238c-1.187 2.121-4.234 2.133-5.437.024L3.305 19.532c-1.313-2.302.652-5.087 3.261-4.622L64.07 25.187a3.09 3.09 0 0 0 1.11 0l56.3-10.261c2.598-.473 4.575 2.289 3.286 4.594Zm0 0"
                  />
                  <path
                    fill="url(#b)"
                    d="M91.46 1.43 48.954 9.758a1.56 1.56 0 0 0-1.258 1.437l-2.617 44.168a1.563 1.563 0 0 0 1.91 1.614l11.836-2.735a1.562 1.562 0 0 1 1.88 1.836l-3.517 17.219a1.562 1.562 0 0 0 1.985 1.805l7.308-2.223c1.133-.344 2.223.652 1.985 1.812l-5.59 27.047c-.348 1.692 1.902 2.614 2.84 1.164l.625-.968 34.64-69.13c.582-1.16-.421-2.48-1.69-2.234l-12.185 2.352a1.558 1.558 0 0 1-1.793-1.965l7.95-27.562A1.56 1.56 0 0 0 91.46 1.43Zm0 0"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
