import { onScopeDispose, watch, type Ref } from "vue";

/**
 * Locks page scrolling while an overlay is open. Hiding overflow is not enough —
 * Lenis drives the window from its own loop — so this stops Lenis too. The
 * counter keeps stacked overlays from unlocking each other.
 */
let locks = 0;
let previousRootOverflow = "";
let previousPaddingRight = "";
let previousLenisStopped = false;

function acquire(): void {
  locks += 1;
  if (locks > 1 || typeof document === "undefined") return;

  const root = document.documentElement;
  const body = document.body;
  const scrollbar = window.innerWidth - root.clientWidth;

  // Lock the *root* element, never <body>. Setting `overflow: hidden` on <body>
  // makes it a scroll container, which breaks `position: sticky` on the header
  // and side rails — they snap to their static position when an overlay opens
  // on a scrolled page.
  previousRootOverflow = root.style.overflow;
  previousPaddingRight = body.style.paddingRight;
  previousLenisStopped = root.classList.contains("lenis-stopped");

  root.style.overflow = "hidden";
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

  (window as any).lenis?.stop?.();
  root.classList.add("scroll-locked");
}

function release(): void {
  locks = Math.max(0, locks - 1);
  if (locks > 0 || typeof document === "undefined") return;

  const root = document.documentElement;
  root.style.overflow = previousRootOverflow;
  document.body.style.paddingRight = previousPaddingRight;

  if (!previousLenisStopped) (window as any).lenis?.start?.();
  root.classList.remove("scroll-locked");
}

/** Lock/unlock the page whenever `active` flips. */
export function useScrollLock(active: Ref<boolean>): void {
  watch(
    active,
    (locked, wasLocked) => {
      if (locked === wasLocked) return;
      if (locked) acquire();
      else release();
    },
    { immediate: true, flush: "post" }
  );

  onScopeDispose(() => {
    if (active.value) release();
  });
}
