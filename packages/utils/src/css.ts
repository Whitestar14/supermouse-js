/**
 * Common cubic-bezier easing strings for CSS transitions.
 */
export const Easings = {
  /** Good for entrance animations (starts fast, slows down) */
  EASE_OUT_EXPO: "cubic-bezier(0.16, 1, 0.3, 1)",
  /** Good for elastic/bouncy UI elements */
  ELASTIC_OUT: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Standard smooth movement */
  SMOOTH: "ease-out"
} as const;

/**
 * Standard Z-Index layers for the Supermouse ecosystem.
 * Relative to the Supermouse Container.
 */
export const Layers = {
  /** The top-most layer. For text, tooltips, and crucial UI. */
  OVERLAY: "400",

  /** The main cursor layer. For the primary Dot/Pointer. */
  CURSOR: "300",

  /** The secondary layer. For Rings, brackets, or followers. */
  FOLLOWER: "200",

  /** The background layer. For trails, sparkles, and particles. */
  TRACE: "100"
} as const;
