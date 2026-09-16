<script setup lang="ts">
import { computed } from "vue";

/**
 * The single button primitive for the site.
 *
 * Renders a `NuxtLink` when `to` is set, an external `<a>` when `href` is set,
 * and a native `<button>` otherwise — so the same visual language is used for
 * navigation and actions without repeating the class soup on every page.
 */
type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const props = withDefaults(
  defineProps<{
    to?: string;
    href?: string;
    variant?: Variant;
    size?: Size;
    block?: boolean;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
  }>(),
  {
    variant: "primary",
    size: "md",
    block: false,
    type: "button",
    disabled: false
  }
);

const VARIANTS: Record<Variant, string> = {
  primary: "bg-inverse text-surface hover:bg-elevated",
  secondary: "bg-surface text-inverse border border-border hover:bg-surface-muted",
  ghost: "bg-transparent text-inverse hover:bg-surface-muted"
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-4 text-xs",
  md: "h-12 px-6 text-sm",
  lg: "h-14 md:h-16 px-8 md:px-12 text-base md:text-lg"
};

const classes = computed(() => [
  "inline-flex items-center justify-center gap-3 font-bold tracking-tight transition-colors select-none",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inverse focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
  "disabled:opacity-50 disabled:pointer-events-none",
  VARIANTS[props.variant],
  SIZES[props.size],
  props.block ? "w-full" : ""
]);
</script>

<template>
  <NuxtLink v-if="to" :to="to" :class="classes">
    <slot />
  </NuxtLink>

  <a v-else-if="href" :href="href" target="_blank" rel="noopener noreferrer" :class="classes">
    <slot />
  </a>

  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
