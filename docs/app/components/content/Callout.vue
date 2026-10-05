<script setup lang="ts">
export type CalloutVariant = "note" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    title?: string;
    variant?: CalloutVariant | "neutral";
  }>(),
  { variant: "note" }
);

interface CalloutStyle {
  /** Outer shell: hairline + the 4px semantic rail. */
  shell: string;
  title: string;
  body: string;
}

const VARIANTS: Record<CalloutVariant, CalloutStyle> = {
  note: {
    shell: "border-border border-l-inverse bg-surface-muted",
    title: "text-inverse",
    body: "text-body"
  },
  warning: {
    shell: "border-border border-l-accent bg-accent-soft",
    title: "text-accent-strong",
    body: "text-body"
  },
  danger: {
    shell: "border-border border-l-danger bg-danger-soft",
    title: "text-danger-strong",
    body: "text-body"
  }
};

const DEFAULT_TITLES: Record<CalloutVariant, string> = {
  note: "Note",
  warning: "Warning",
  danger: "Danger"
};

/** Unknown/alias variants normalise to a known one instead of rendering unstyled. */
const resolvedVariant = computed<CalloutVariant>(() =>
  props.variant === "neutral" ? "note" : VARIANTS[props.variant] ? props.variant : "note"
);

const style = computed(() => VARIANTS[resolvedVariant.value]);
const title = computed(() => props.title ?? DEFAULT_TITLES[resolvedVariant.value]);
</script>

<template>
  <aside
    class="my-8 border border-l-4 p-4 text-sm"
    :class="style.shell"
    :role="resolvedVariant === 'note' ? 'note' : 'alert'"
  >
    <span class="block mb-2 text-[10px] font-bold uppercase tracking-wide" :class="style.title">
      {{ title }}
    </span>
    <div class="callout-body leading-relaxed" :class="style.body">
      <slot />
    </div>
  </aside>
</template>
