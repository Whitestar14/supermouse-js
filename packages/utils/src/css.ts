/**
 * Common cubic-bezier easing strings for CSS transitions.
 */
export const Easings = {
  /** Good for entrance animations (starts fast, slows down) */
  EASE_OUT_EXPO: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Good for elastic/bouncy UI elements */
  ELASTIC_OUT: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  /** Standard smooth movement */
  SMOOTH: 'ease-out',
} as const;