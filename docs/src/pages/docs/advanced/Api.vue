<script setup lang="ts">
import DocsSection from "@components/docs/DocsSection.vue";
import { API_SECTIONS } from "@composables/useApiReference";

// API Section Components
import ApiCoreClass from "@components/docs/api/ApiCoreClass.vue";
import ApiConstructor from "@components/docs/api/ApiConstructor.vue";
import ApiOptions from "@components/docs/api/ApiOptions.vue";
import ApiState from "@components/docs/api/ApiState.vue";
import ApiMethods from "@components/docs/api/ApiMethods.vue";
import ApiPluginInterface from "@components/docs/api/ApiPluginInterface.vue";
import ApiUtilities from "@components/docs/api/ApiUtilities.vue";
</script>

<template>
  <DocsSection label="Reference" title="API" :sections="API_SECTIONS">
    <ApiCoreClass />
    <ApiConstructor />
    <ApiOptions />
    <ApiState />
    <ApiMethods />
    <ApiPluginInterface />
    <ApiUtilities />
  </DocsSection>
</template>
