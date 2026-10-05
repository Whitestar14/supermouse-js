<script setup lang="ts">
import type { Lab } from "../lib/labs";

defineProps<{ lab: Lab }>();
</script>

<template>
  <header class="lab__head">
    <span class="lab__tag">{{ lab.label }}</span>
    <h1 class="lab__title">{{ lab.question }}</h1>
    <p class="lab__question">← → to move between labs · 1–8 to jump · hash routes are shareable</p>
  </header>
</template>
