/**
 * Anchor scrolling for a client-rendered app.
 *
 * The site is `ssr: false` and page bodies arrive through async data, so a hash
 * target usually does not exist yet when vue-router resolves `scrollBehavior`.
 * Its native `{ el: to.hash }` silently no-ops and the page stays put — the
 * flaky "clicked a link and landed at the top" bug. Everything here waits
 * (bounded) for the element and scrolls through one code path.
 *
 * Scrolling is instant. Lenis owns the window, so a "smooth" jump would animate
 * the whole page for a heading that is already on screen — that is the jank,
 * not a feature.
 */

/** Fallback clearance below the sticky header when CSS tokens are unreadable. */
export const HEADER_OFFSET_PX = 120;

/** How long we watch for a hash target to appear before giving up. */
const ANCHOR_WAIT_MS = 1500;

/** How long an unhonoured anchor intent stays valid for a late settle. */
const ANCHOR_INTENT_TTL_MS = 8000;

/** Safety net: never leave a pending top-reset unapplied forever. */
const TOP_RESET_FALLBACK_MS = 1200;

/** Only correct a late layout shift if it actually moved the target. */
const CORRECTION_THRESHOLD_PX = 24;

interface AnchorIntent {
  id: string;
  startedAt: number;
  done: boolean;
}

let pendingAnchor: AnchorIntent | null = null;
let topResetPending = false;
let topResetFallback: ReturnType<typeof setTimeout> | null = null;

/** Distance to keep between the sticky header and a hash target. */
export function anchorOffset(): number {
  if (typeof document === "undefined") return HEADER_OFFSET_PX;
  const styles = getComputedStyle(document.documentElement);
  const header = parseFloat(styles.getPropertyValue("--header-h"));
  if (!Number.isFinite(header) || header <= 0) return HEADER_OFFSET_PX;
  return header + 24;
}

const headerOffset = anchorOffset;

/**
 * Resolve a heading id.
 *
 * MDC prefixes ids that start with a digit (`5. Opt out` -> `#_5-opt-out`), and
 * authors write both forms in prose, so try the plausible spellings before
 * declaring an anchor missing.
 */
export function findAnchor(id: string): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const direct = document.getElementById(id);
  if (direct) return direct;

  const prefixed = document.getElementById(`_${id}`);
  if (prefixed) return prefixed;

  try {
    return document.querySelector<HTMLElement>(`[id="${CSS.escape(id)}"]`);
  } catch {
    return null;
  }
}

/**
 * Resolve a scrolling element. Lenis owns `window` scrolling, so when it is
 * active we drive it; nested containers keep native behaviour.
 */
function scrollWindow(top: number): void {
  const lenis = (window as any).lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(top, { immediate: true, force: true });
    return;
  }
  window.scrollTo({ top, behavior: "auto" });
}

/** Scroll to an absolute Y position. */
export function scrollToY(top: number): void {
  scrollWindow(top);
}

/** Scroll to the top of the document. */
export function scrollToTop(): void {
  scrollWindow(0);
}

/** Scroll an element to just below the sticky header. */
function scrollElementIntoView(el: HTMLElement): void {
  scrollWindow(Math.max(0, el.getBoundingClientRect().top + window.scrollY - headerOffset()));
}

/**
 * Wait for `getAnchor(id)` to exist, up to `timeoutMs`. Resolves null on
 * timeout so callers can fall back instead of hanging.
 */
export function waitForAnchor(id: string, timeoutMs = ANCHOR_WAIT_MS): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(null);
      return;
    }

    const existing = findAnchor(id);
    if (existing) {
      resolve(existing);
      return;
    }

    let timer: ReturnType<typeof setTimeout>;
    const observer = new MutationObserver(() => {
      const el = findAnchor(id);
      if (!el) return;
      observer.disconnect();
      clearTimeout(timer);
      resolve(el);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    timer = setTimeout(() => {
      observer.disconnect();
      resolve(findAnchor(id));
    }, timeoutMs);
  });
}

const nextFrame = (): Promise<void> =>
  new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * Scroll to an anchor once it exists. Resolves `true` when the target was
 * found and honoured.
 */
export async function scrollToAnchor(id: string): Promise<boolean> {
  const intent: AnchorIntent = { id, startedAt: Date.now(), done: false };
  pendingAnchor = intent;
  topResetPending = false;

  const el = await waitForAnchor(id);
  if (!el) return false;
  // A newer navigation took over while we waited.
  if (pendingAnchor !== intent) return true;

  // Let the page settle (fonts, async body, sticky offsets) before measuring.
  await nextFrame();
  if (pendingAnchor !== intent) return true;

  scrollElementIntoView(el);
  intent.done = true;

  // A late layout shift (images, async sections) can move the target; nudge
  // once, instantly, and only when it's actually off.
  setTimeout(() => {
    if (pendingAnchor !== intent) return;
    const target = el.getBoundingClientRect().top + window.scrollY - headerOffset();
    if (Math.abs(target - window.scrollY) > CORRECTION_THRESHOLD_PX) {
      scrollWindow(Math.max(0, target));
    }
  }, 280);

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
    scrollToTop();
    return;
  }

  const intent = pendingAnchor;
  if (!intent || intent.done) return;

  if (Date.now() - intent.startedAt > ANCHOR_INTENT_TTL_MS) {
    pendingAnchor = null;
    return;
  }

  const el = findAnchor(intent.id);
  if (!el) return;

  scrollElementIntoView(el);
  intent.done = true;
}
