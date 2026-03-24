<script setup lang="ts">
import { reactive, onMounted, ref } from "vue";
import { provideSupermouse } from "@supermousejs/vue";
import { Dot } from "@supermousejs/dot";
import { Text } from "@supermousejs/text";
import { Magnetic } from "@supermousejs/magnetic";
import { Image } from "@supermousejs/image";
import { Stick } from "@supermousejs/stick";
import { Pointer } from "@supermousejs/pointer";
import { Trail } from "@supermousejs/trail";
import { SmartRing, SmartIcon, TextRing, Sparkles } from "@supermousejs/labs";

const ICONS = {
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform: rotate(-45deg)"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>`,
  hand: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
};

const pluginsState = reactive<Record<string, boolean>>({
  dot: true,
  ring: true,
  trail: false,
  sparkles: false,
  text: true,
  "text-ring": false,
  image: false,
  icon: false,
  pointer: false,
  magnetic: true,
  stick: true,
});

const mouse = provideSupermouse(
  {
    smoothness: 0.12,
    hideCursor: true,
    ignoreOnNative: true,
    rules: { "a, button": { icon: "hand" } },
  },
  [
    Dot({ name: "dot", size: 6, color: "#f59e0b" }),
    SmartRing({ name: "ring", size: 30, color: "#f59e0b", enableSkew: true }),
    Trail({ name: "trail", color: "#f59e0b", isEnabled: false }),
    Sparkles({ name: "sparkles", color: "#f59e0b", isEnabled: false }),
    Text({ name: "text", offset: [24, 24] }),
    TextRing({
      name: "text-ring",
      text: "EXPERIMENTAL • SYSTEM • ",
      color: "#f59e0b",
      isEnabled: false,
    }),
    Image({ name: "image", offset: [40, 40], isEnabled: false }),
    SmartIcon({
      name: "icon",
      icons: ICONS,
      size: 28,
      color: "#f59e0b",
      isEnabled: false,
    }),
    Pointer({ name: "pointer", size: 32, color: "#f59e0b", isEnabled: false }),
    Magnetic({ name: "magnetic" }),
    Stick({ name: "stick" }),
  ]
);

const togglePlugin = (name: string) => {
  pluginsState[name] = !pluginsState[name];
  if (mouse.value) {
    if (pluginsState[name]) mouse.value.enablePlugin(name);
    else mouse.value.disablePlugin(name);
  }
};

const fps = ref(0);
onMounted(() => {
  let frames = 0;
  let prevTime = performance.now();
  const tick = () => {
    frames++;
    const time = performance.now();
    if (time >= prevTime + 1000) {
      fps.value = frames;
      frames = 0;
      prevTime = time;
    }
    requestAnimationFrame(tick);
  };
  tick();
});
</script>

<template>
  <div
    class="flex h-screen bg-[#0a0a0a] text-zinc-300 font-sans overflow-hidden selection:bg-amber-500/30"
  >
    <!-- MAIN WORKSPACE -->
    <main class="flex-1 relative flex flex-col overflow-hidden">
      <!-- High-Density Grid -->
      <div
        class="absolute inset-0 pointer-events-none opacity-[0.03]"
        style="
          background-image: radial-gradient(#fff 1px, transparent 1px);
          background-size: 24px 24px;
        "
      ></div>

      <!-- Top Bar Info -->
      <header
        class="h-14 border-b border-zinc-900 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md relative z-30"
      >
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span
              class="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-white"
              >Lab_System_v2</span
            >
          </div>
          <div class="h-4 w-[1px] bg-zinc-800"></div>
          <span class="text-[10px] font-mono text-zinc-500 uppercase"
            >Buffer: 128ms</span
          >
        </div>
        <div class="flex items-center gap-6">
          <div class="flex flex-col items-end">
            <span
              class="text-[9px] font-mono text-zinc-600 uppercase leading-none"
              >Status</span
            >
            <span
              class="text-[10px] font-mono text-emerald-400 font-bold uppercase leading-tight"
              >Operational</span
            >
          </div>
          <div class="flex flex-col items-end">
            <span
              class="text-[9px] font-mono text-zinc-600 uppercase leading-none"
              >Sync</span
            >
            <span
              class="text-[10px] font-mono text-white font-bold uppercase leading-tight"
              >{{ fps }} FPS</span
            >
          </div>
        </div>
      </header>

      <!-- TEST GRID -->
      <div
        class="flex-1 overflow-y-auto p-6 md:p-12 relative z-10 custom-scrollbar"
      >
        <div class="max-w-7xl mx-auto">
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-900 border border-zinc-900 overflow-hidden shadow-2xl"
          >
            <!-- Cell: Magnetic -->
            <div
              class="bg-[#0f0f0f] p-10 flex flex-col items-center justify-center min-h-[300px] group relative hover:bg-black transition-colors"
            >
              <span
                class="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest"
                >01 / Magnetic_Force</span
              >
              <div class="flex gap-8">
                <button
                  v-for="i in 2"
                  :key="i"
                  class="w-16 h-16 rounded-full border border-zinc-800 flex items-center justify-center hover:border-amber-500/50 hover:bg-amber-500/5 transition-all duration-300"
                  data-supermouse-magnetic
                >
                  <div class="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
                </button>
              </div>
            </div>

            <!-- Cell: Stick -->
            <div
              class="bg-[#0f0f0f] p-10 flex flex-col items-center justify-center min-h-[300px] relative hover:bg-black transition-colors"
            >
              <span
                class="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest"
                >02 / Stick_Constraint</span
              >
              <button
                class="px-10 py-5 bg-white text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-amber-500 transition-colors"
                data-supermouse-stick
              >
                Lock Cursor
              </button>
            </div>

            <!-- Cell: Tooltip -->
            <div
              class="bg-[#0f0f0f] p-10 flex flex-col items-center justify-center min-h-[300px] relative hover:bg-black transition-colors"
            >
              <span
                class="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest"
                >03 / Dynamic_Text</span
              >
              <div
                class="w-full aspect-video border border-dashed border-zinc-800 flex items-center justify-center cursor-help group"
                data-supermouse-text="Diagnostic Active: Safe to Proceed"
              >
                <span
                  class="text-xs text-zinc-500 group-hover:text-white transition-colors"
                  >Inspect Surface</span
                >
              </div>
            </div>

            <!-- Cell: Image -->
            <div
              class="bg-[#0f0f0f] p-10 flex flex-col items-center justify-center min-h-[300px] relative hover:bg-black transition-colors"
            >
              <span
                class="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest"
                >04 / Visual_Buffer</span
              >
              <div
                class="w-full h-24 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 text-[10px] uppercase font-bold tracking-widest"
                data-supermouse-img="https://images.unsplash.com/photo-1614728263952-84ea206f99b6?w=600&q=80"
              >
                Media Hover
              </div>
            </div>

            <!-- Cell: Ring -->
            <div
              class="bg-[#0f0f0f] p-10 flex flex-col items-center justify-center min-h-[300px] relative hover:bg-black transition-colors"
            >
              <span
                class="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest"
                >05 / Text_Rotation</span
              >
              <div
                class="w-32 h-32 rounded-full border border-zinc-800 flex items-center justify-center hover:border-zinc-600 transition-colors"
                data-supermouse-text-ring="SUPERMOUSE • SYSTEM • LAB • "
              >
                <div
                  class="w-2 h-2 bg-amber-500 rounded-full animate-ping"
                ></div>
              </div>
            </div>

            <!-- Cell: Interaction Rules -->
            <div
              class="bg-[#0f0f0f] p-10 flex flex-col items-center justify-center min-h-[300px] relative hover:bg-black transition-colors"
            >
              <span
                class="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 uppercase tracking-widest"
                >06 / Rule_Engine</span
              >
              <div class="flex flex-col gap-2 w-full max-w-[160px]">
                <a
                  href="#"
                  class="block p-3 border border-zinc-800 text-[10px] uppercase font-bold text-center hover:bg-zinc-800 transition-colors"
                  >Link Actor</a
                >
                <button
                  class="block p-3 border border-zinc-800 text-[10px] uppercase font-bold text-center hover:bg-zinc-800 transition-colors"
                  data-supermouse-icon="search"
                >
                  Search Actor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- SIDEBAR: Plugin Registry -->
    <aside
      class="w-80 border-l border-zinc-900 bg-black flex flex-col shrink-0 relative z-40"
    >
      <div class="p-8 border-b border-zinc-900">
        <h2
          class="text-xs font-bold text-white uppercase tracking-[0.3em] mb-2"
        >
          Registry
        </h2>
        <p class="text-[10px] text-zinc-600 font-mono leading-relaxed">
          Toggle middleware components to observe physics interactions.
        </p>
      </div>

      <div
        class="flex-1 overflow-y-auto p-4 space-y-px bg-zinc-900 custom-scrollbar"
      >
        <div
          v-for="(enabled, name) in pluginsState"
          :key="name"
          class="group flex items-center justify-between p-4 bg-[#0a0a0a] hover:bg-[#111] transition-colors cursor-pointer"
          @click="togglePlugin(name)"
        >
          <div class="flex flex-col">
            <span
              class="text-[10px] font-mono uppercase tracking-widest"
              :class="enabled ? 'text-amber-500' : 'text-zinc-700'"
              >{{ name }}</span
            >
            <span class="text-[8px] text-zinc-800 font-mono uppercase">{{
              enabled ? "Mounted" : "Idle"
            }}</span>
          </div>

          <div
            class="w-8 h-4 border border-zinc-800 relative flex items-center transition-colors"
            :class="enabled ? 'border-amber-500/50 bg-amber-500/10' : ''"
          >
            <div
              class="w-2 h-2 mx-1 transition-all duration-300"
              :class="
                enabled
                  ? 'bg-amber-500 translate-x-3'
                  : 'bg-zinc-800 translate-x-0'
              "
            ></div>
          </div>
        </div>
      </div>

      <!-- System Log -->
      <div class="p-6 border-t border-zinc-900 bg-black">
        <div
          class="text-[9px] font-mono text-zinc-600 uppercase tracking-widest mb-4"
        >
          Output Log
        </div>
        <div class="space-y-1 font-mono text-[9px] text-zinc-500">
          <div class="flex justify-between">
            <span>Kernel Init</span> <span class="text-emerald-500">OK</span>
          </div>
          <div class="flex justify-between">
            <span>Plugins Sync</span>
            <span class="text-emerald-500">11/11</span>
          </div>
          <div class="flex justify-between">
            <span>Pointer Polling</span> <span class="text-zinc-700">60Hz</span>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #222;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #333;
}

/* Ensure data-attributes don't interfere with flex centering */
[data-supermouse-magnetic],
[data-supermouse-stick] {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
