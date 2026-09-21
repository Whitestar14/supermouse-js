<script setup lang="ts">
defineProps<{
  title?: string;
  rows: Array<[string, string]>;
}>();
</script>

<template>
  <section class="panel">
    <p v-if="title" class="panel__title">{{ title }}</p>
    <div class="panel__body">
      <div class="readout">
        <div v-for="row in rows" :key="row[0]" class="readout__row">
          <span class="readout__key">{{ row[0] }}</span>
          <span class="readout__value">{{ row[1] }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
