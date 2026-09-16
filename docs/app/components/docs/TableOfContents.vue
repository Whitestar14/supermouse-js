<script setup lang="ts">
import type { TocSection } from "@composables/useToc";

defineProps<{
  sections: TocSection[];
  activeSection: string;
}>();

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
    <nav class="flex flex-col gap-1 text-sm">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        class="transition-colors leading-snug"
        :class="[
          section.depth === 3 ? 'pl-3 text-xs' : 'text-sm',
          activeSection === section.id
            ? 'text-inverse font-semibold'
            : section.depth === 3
              ? 'text-subtle hover:text-strong'
              : 'text-body hover:text-inverse'
        ]"
        @click="go($event, section.id)"
      >
        {{ section.label }}
      </a>
    </nav>
  </div>
</template>
