
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Intro from '../components/docs/Intro.vue';
import QuickStart from '../components/docs/QuickStart.vue';
import ProjectLayout from '../components/docs/ProjectLayout.vue';
import Goals from '../components/docs/Goals.vue';
import Architecture from '../components/docs/Architecture.vue';
import PluginSystem from '../components/docs/PluginSystem.vue';
import Cookbook from '../components/docs/Cookbook.vue';
import Toolchain from '../components/docs/Toolchain.vue';
import Roadmap from '../components/docs/Roadmap.vue';
import Development from '../components/docs/Development.vue';
import Contributing from '../components/docs/Contributing.vue';

const activeSection = ref('intro');

const sections = [
  { id: 'intro', title: 'Introduction', label: '00' },
  { id: 'quick-start', title: 'Quick Start', label: '01' },
  { id: 'project-layout', title: 'Project Layout', label: '02' },
  { id: 'goals', title: 'Goals & Principles', label: '03' },
  { id: 'architecture', title: 'Architecture', label: '04' },
  { id: 'plugin-system', title: 'Plugin Authoring', label: '05' },
  { id: 'cookbook', title: 'Cookbook', label: '06' },
  { id: 'toolchain', title: 'Toolchain', label: '07' },
  { id: 'roadmap', title: 'Roadmap', label: '08' },
  { id: 'development', title: 'Development', label: '09' },
  { id: 'contributing', title: 'Contributing', label: '10' },
];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) {
    const navHeight = 20; 
    const y = el.getBoundingClientRect().top + window.scrollY - navHeight;
    window.scrollTo({ top: y, behavior: 'smooth' });
    activeSection.value = id;
  }
};

// Intersection Observer to highlight sidebar
onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeSection.value = entry.target.id;
      }
    });
  }, { 
    // Increased detection area to ensure sections like QuickStart (which are tall)
    // or smaller ones are caught correctly.
    // -10% from top means we ignore the top 10% (e.g. sticky header area)
    // -20% from bottom keeps focus slightly above center-bottom.
    rootMargin: '-10% 0px -20% 0px' 
  });

  sections.forEach(section => {
    const el = document.getElementById(section.id);
    if (el) observer.observe(el);
  });
});
</script>

<template>
  <div class="flex flex-col lg:flex-row min-h-screen bg-white">
    
    <!-- Sidebar Navigation (Sticky on Desktop) -->
    <aside class="hidden lg:block w-[280px] border-r border-zinc-200 shrink-0 relative bg-zinc-50/50">
      <div class="sticky top-0 h-screen overflow-y-auto py-12 px-8 scrollbar-hide">
        <div class="flex items-center gap-2 mb-12">
           <div class="w-3 h-3 bg-black"></div>
           <span class="mono text-xs font-bold uppercase tracking-widest text-zinc-900">Table of Contents</span>
        </div>
        
        <nav class="flex flex-col gap-1">
          <a 
            v-for="section in sections" 
            :key="section.id"
            href="#" 
            @click.prevent="scrollTo(section.id)"
            class="group flex items-baseline gap-4 py-2 text-sm transition-all duration-200"
            :class="activeSection === section.id ? 'translate-x-2' : 'hover:translate-x-1'"
          >
            <span class="mono text-[10px] font-bold" 
                  :class="activeSection === section.id ? 'text-black' : 'text-zinc-400 group-hover:text-zinc-600'">
              {{ section.label }}
            </span>
            <span class="font-medium tracking-tight"
                  :class="activeSection === section.id ? 'text-black font-bold' : 'text-zinc-500 group-hover:text-zinc-900'">
              {{ section.title }}
            </span>
          </a>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 min-w-0 bg-white">
      <div class="max-w-4xl mx-auto px-6 md:px-16 py-12 md:py-24 space-y-32">
        
        <Intro />
        
        <QuickStart />
        <ProjectLayout />
        <Goals />
        <Architecture />
        <PluginSystem />
        <Cookbook />
        <Toolchain />
        <Roadmap />
        <Development />
        <Contributing />

      </div>
    </div>
  </div>
</template>
