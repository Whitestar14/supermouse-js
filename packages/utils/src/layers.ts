/**
 * Standard Z-Index layers for the Supermouse ecosystem.
 * Relative to the Supermouse Container.
 */
export const Layers = {
  /** The top-most layer. For text, tooltips, and crucial UI. */
  OVERLAY: '400', 
  
  /** The main cursor layer. For the primary Dot/Pointer. */
  CURSOR: '300',
  
  /** The secondary layer. For Rings, brackets, or followers. */
  FOLLOWER: '200',
  
  /** The background layer. For trails, sparkles, and particles. */
  TRACE: '100',
} as const;