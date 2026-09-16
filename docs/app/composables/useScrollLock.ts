import { onScopeDispose, watch, type Ref } from "vue";

/**
 * Locks page scrolling while an overlay is open (mobile nav, search, editor).
 *
 * `body { overflow: hidden }` alone does **not** work here: Lenis keeps driving
 * the window scroll from its own rAF loop, which is why the mobile menu could
 * still be scrolled behind the overlay. This stops Lenis, hides overflow and
 * compensates for the scrollbar so the layout doesn't shift sideways.
 *
 * A module-level counter means stacked overlays can't unlock each other: the
 * page is only released when the last one closes.
 */
let locks = 0;
let previousOverflow = "";
let previousPaddingRight = "";
let previousLenisStopped = false;

function acquire(): void {
  locks += 1;
  if (locks > 1 || typeof document === "undefined") return;

  const root = document.documentElement;
  const body = document.body;
  const scrollbar = window.innerWidth - root.clientWidth;

  previousOverflow = body.style.overflow;
  previousPaddingRight = body.style.paddingRight;
  previousLenisStopped = root.classList.contains("lenis-stopped");

  body.style.overflow = "hidden";
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

  (window as any).lenis?.stop?.();
  root.classList.add("scroll-locked");
}

function release(): void {
  locks = Math.max(0, locks - 1);
  if (locks > 0 || typeof document === "undefined") return;

  const body = document.body;
  body.style.overflow = previousOverflow;
  body.style.paddingRight = previousPaddingRight;

  if (!previousLenisStopped) (window as any).lenis?.start?.();
  document.documentElement.classList.remove("scroll-locked");
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
