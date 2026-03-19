<script setup lang="ts">
import Hero from "@/components/landing/Hero.vue";
import PluginList from "@/components/landing/PluginList.vue";
import Mission from "@/components/landing/Mission.vue";
import Stats from "@/components/landing/Stats.vue";
import CTA from "@/components/landing/CTA.vue";
import Footer from "@/components/landing/Footer.vue";
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
