<script setup lang="ts">
import Hero from "@/components/landing/Hero.vue";
import PluginList from "@/components/landing/PluginList.vue";
import Mission from "@/components/landing/Mission.vue";
import Stats from "@/components/landing/Stats.vue";
import CTA from "@/components/landing/CTA.vue";
import Footer from "@/components/landing/Footer.vue";
import { usePageHead } from "@composables/usePageHead";

usePageHead({
  title: "Modular Cursor System",
  description:
    "A modular, high-performance cursor engine for building dynamic, beautiful cursors for the web."
});
</script>

<template>
  <div class="overflow-hidden bg-white">
    <Hero />
    <PluginList />
    <Mission />
    <Stats />
    <CTA />
    <Footer />
  </div>
</template>
