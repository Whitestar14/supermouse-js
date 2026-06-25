<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import DocsSection from "@components/docs/DocsSection.vue";
import TableOfContents from "@components/docs/TableOfContents.vue";
import { useDocsSidebar } from "@composables/useDocsSidebar";
import { API_SECTIONS } from "@composables/useApiReference";

// API Section Components
import ApiCoreClass from "@components/docs/api/ApiCoreClass.vue";
import ApiConstructor from "@components/docs/api/ApiConstructor.vue";
import ApiOptions from "@components/docs/api/ApiOptions.vue";
import ApiState from "@components/docs/api/ApiState.vue";
import ApiMethods from "@components/docs/api/ApiMethods.vue";
import ApiPluginInterface from "@components/docs/api/ApiPluginInterface.vue";
import ApiUtilities from "@components/docs/api/ApiUtilities.vue";

const route = useRoute();
const activeSection = ref<string>("core-class");
const { setRightSidebar, clearRightSidebar } = useDocsSidebar();

const scrollTo = (id: string, behavior: ScrollBehavior = "smooth") => {
  const el = document.getElementById(id);
  if (!el) return;

  const offset = 120;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior });

  const section = API_SECTIONS.find((s) => s.id === id);
  if (section) {
    activeSection.value = id;
    return;
  }

  for (const section of API_SECTIONS) {
    const sectionEl = document.getElementById(section.id);
    if (!sectionEl) continue;
    if (sectionEl.contains(el)) {
      activeSection.value = section.id;
      break;
    }
  }
};

const scrollToHash = (behavior: ScrollBehavior = "smooth") => {
  const hash = route.hash.replace("#", "");
  if (!hash) return;
  scrollTo(hash, behavior);
};

const updateActiveSection = () => {
  const offset = 120;
  const fromTop = window.scrollY + offset;
  let current = API_SECTIONS[0]?.id ?? "";

  for (const section of API_SECTIONS) {
    const el = document.getElementById(section.id);
    if (!el) continue;

    if (el.offsetTop <= fromTop) {
      current = section.id;
    }
  }

  activeSection.value = current;
};

onMounted(() => {
  updateActiveSection();
  window.addEventListener("scroll", updateActiveSection, { passive: true });
  window.addEventListener("resize", updateActiveSection, { passive: true });

  setRightSidebar({
    component: TableOfContents,
    props: {
      sections: API_SECTIONS,
      activeSection
    },
    on: {
      navigate: scrollTo
    }
  });

  nextTick(() => scrollToHash("auto"));
});

watch(
  () => route.hash,
  () => nextTick(() => scrollToHash())
);

onUnmounted(() => {
  window.removeEventListener("scroll", updateActiveSection);
  window.removeEventListener("resize", updateActiveSection);
  clearRightSidebar();
});
</script>

<template>
  <DocsSection label="Reference" title="API">
    <ApiCoreClass />
    <ApiConstructor />
    <ApiOptions />
    <ApiState />
    <ApiMethods />
    <ApiPluginInterface />
    <ApiUtilities />
  </DocsSection>
</template>
