<script setup lang="ts">
import type { TocSection } from "@composables/useToc";

defineProps<{
  sections: TocSection[];
  activeSection: string;
}>();

/** Indent and weight per heading level. */
const TOC_DEPTH: Record<number, string> = {
  2: "text-sm",
  3: "text-xs pl-4",
  4: "text-xs pl-8"
};

const router = useRouter();

const go = (event: MouseEvent, id: string): void => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
    return;
  }
  event.preventDefault();
  void router.push({ hash: `#${id}` });
};
</script>

<template>
  <div>
    <div class="font-mono text-xs font-bold uppercase tracking-widest text-subtle mb-3">
      On This Page
    </div>
    <nav class="flex flex-col gap-2">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        class="transition-colors leading-snug"
        :class="[
          TOC_DEPTH[section.depth],
          activeSection === section.id
            ? 'text-inverse font-semibold'
            : section.depth === 2
              ? 'text-body hover:text-inverse'
              : 'text-subtle hover:text-strong'
        ]"
        @click="go($event, section.id)"
      >
        {{ section.label }}
      </a>
    </nav>
  </div>
</template>
