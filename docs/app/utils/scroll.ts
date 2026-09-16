/** DOCUMENTED_HEADER_OFFSET_PX: sticky navbar clearance for hash targets. */
export const HEADER_OFFSET_PX = 120;

/** How long we watch for a hash target to appear before giving up (for now). */
const ANCHOR_WAIT_MS = 3000;

/** How long an unhonoured anchor intent stays valid for a late settle. */
const ANCHOR_INTENT_TTL_MS = 8000;

/** Safety net: never leave a pending reset unapplied forever. */
const TOP_RESET_FALLBACK_MS = 1200;

interface AnchorIntent {
  id: string;
  startedAt: number;
  done: boolean;
}

let pendingAnchor: AnchorIntent | null = null;
let topResetPending = false;
let topResetFallback: ReturnType<typeof setTimeout> | null = null;

/**
 * Resolve a scrolling element. Lenis owns `window` scrolling, so when it is
 * active we drive it and let native `scrollTo` handle nested containers.
 */
function scrollWindow(top: number, behavior: ScrollBehavior): void {
  const lenis = (window as any).lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(top, { immediate: behavior === "auto", duration: 1.2 });
    return;
  }
  window.scrollTo({ top, behavior });
}

/** Scroll to an absolute Y position, honouring Lenis when active. */
export function scrollToY(top: number, behavior: ScrollBehavior = "auto"): void {
  scrollWindow(top, behavior);
}

/** Scroll to the top of the document. */
export function scrollToTop(behavior: ScrollBehavior = "auto"): void {
  scrollWindow(0, behavior);
}

/** Scroll an element to just below the sticky header. */
function scrollElementIntoView(el: HTMLElement, behavior: ScrollBehavior): void {
  scrollWindow(Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX), behavior);
}

/**
 * Wait for `getElementById(id)` to exist, up to `timeoutMs`. Returns null on
 * timeout so callers can fall back instead of hanging.
 */
export function waitForAnchor(id: string, timeoutMs = ANCHOR_WAIT_MS): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const existing = document.getElementById(id);
    if (existing) {
      resolve(existing);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      const el = document.getElementById(id);
      if (!el) return;
      observer.disconnect();
      clearTimeout(timer);
      resolve(el);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    timer = setTimeout(() => {
      observer.disconnect();
      resolve(document.getElementById(id));
    }, timeoutMs);
  });
}

/**
 * Scroll to an anchor once it exists.
 */
export async function scrollToAnchor(
  id: string,
  behavior: ScrollBehavior = "smooth"
): Promise<boolean> {
  const intent: AnchorIntent = { id, startedAt: Date.now(), done: false };
  pendingAnchor = intent;
  topResetPending = false;

  const el = await waitForAnchor(id);
  if (!el) return false;
  // A newer navigation took over while we waited.
  if (pendingAnchor !== intent) return true;

  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  if (pendingAnchor !== intent) return true;

  scrollElementIntoView(el, behavior);
  intent.done = true;

  setTimeout(() => {
    if (pendingAnchor !== intent) return;
    const corrected = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET_PX;
    if (Math.abs(corrected - window.scrollY) > 8) scrollWindow(Math.max(0, corrected), "auto");
  }, 400);

  return true;
}

/**
 * A hash-less navigation wants the next page at the top — but not yet. Record
 * the intent; `page:finish` applies it once the new page is on screen.
 */
export function requestScrollReset(): void {
  pendingAnchor = null;
  topResetPending = true;

  if (topResetFallback) clearTimeout(topResetFallback);
  topResetFallback = setTimeout(settlePendingNavigation, TOP_RESET_FALLBACK_MS);
}

export function settlePendingNavigation(): void {
  if (topResetFallback) {
    clearTimeout(topResetFallback);
    topResetFallback = null;
  }

  if (topResetPending) {
    topResetPending = false;
    scrollToTop("auto");
    return;
  }

  const intent = pendingAnchor;
  if (!intent || intent.done) return;

  if (Date.now() - intent.startedAt > ANCHOR_INTENT_TTL_MS) {
    pendingAnchor = null;
    return;
  }

  const el = document.getElementById(intent.id);
  if (!el) return;

  scrollElementIntoView(el, "auto");
  intent.done = true;
}
