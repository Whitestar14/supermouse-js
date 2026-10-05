/**
 * Anchor and top-of-page scrolling for a client-rendered app.
 *
 * vue-router resolves `scrollBehavior` before the incoming page has rendered,
 * and the site is `ssr: false`, so the target usually does not exist yet.
 * Navigation records an intent and `drain` carries it out, retrying across
 * frames until the heading appears. `page:finish` restarts the search, for
 * content that settles after the route resolved.
 *
 * Scrolling is instant. Lenis owns the window, so a "smooth" jump would animate
 * the whole page for a heading that is already on screen.
 */

/** Fallback clearance below the sticky header when CSS tokens are unreadable. */
export const HEADER_OFFSET_PX = 120;

/**
 * How long to look for the target before giving up and going to the top.
 *
 * A frame budget is the wrong unit: on a cold load `@nuxt/content` renders the
 * page body over the network, which takes far longer than a handful of frames.
 */
const SEEK_MS = 2500;

/**
 * How long the heading must stay in place before the scroll is considered done.
 *
 * A fixed window from the moment of landing is not enough: the page grows
 * underneath the scroll as async sections arrive, and until it has grown the
 * heading is simply out of reach, so corrections have nothing to do. The window
 * is therefore measured from the last correction, not from the landing.
 */
const QUIET_MS = 600;

/** Absolute stop, so a heading that can never be reached cannot spin forever. */
const MAX_SETTLE_MS = 8000;

/** Correct only when the target is meaningfully off, not for a sub-pixel wobble. */
const CORRECTION_PX = 24;

type PendingNavigation =
  | { kind: "top" }
  | {
      kind: "anchor";
      id: string;
      /** Stop looking for the heading after this. */
      seekUntil: number;
      /** Stop once the heading has needed no correction for this long. */
      quietUntil: number;
      /** Absolute stop, however much the page keeps moving. */
      hardUntil: number;
      /** Where the reader was last placed; null until the first landing. */
      landedAt: number | null;
    };

/** The intent being carried out, or null when the reader owns the scroll. */
let pending: PendingNavigation | null = null;
let frame = 0;

/**
 * Resolve a CSS length to pixels.
 *
 * `--header-h` is authored in `rem`, and `parseFloat` reads `5rem` as `5` —
 * which landed hash targets 29px down, behind an 80px-tall sticky header.
 */
function cssLength(value: string, rootFontSize: number): number {
  const amount = parseFloat(value);
  if (!Number.isFinite(amount)) return NaN;
  const unit = value.trim().replace(/^[-+.\d]+/, "");
  return unit === "rem" || unit === "em" ? amount * rootFontSize : amount;
}

/** Distance to keep between the sticky header and a hash target. */
export function anchorOffset(): number {
  if (typeof document === "undefined") return HEADER_OFFSET_PX;
  const styles = getComputedStyle(document.documentElement);
  const rootFontSize = parseFloat(styles.fontSize);
  const header = cssLength(styles.getPropertyValue("--header-h"), rootFontSize);
  if (!Number.isFinite(header) || header <= 0) return HEADER_OFFSET_PX;
  return header + 24;
}

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
 * Scrolls through Lenis when it owns the window, falling back to the native
 * API otherwise. Both apply immediately, so the position reads back straight
 * away.
 */
function scrollWindow(top: number): void {
  const lenis = (window as any).lenis;
  if (lenis?.scrollTo) {
    lenis.scrollTo(top, { immediate: true, force: true });
    return;
  }
  window.scrollTo({ top, behavior: "auto" });
}

export function scrollToY(top: number): void {
  scrollWindow(top);
}

export function scrollToTop(): void {
  scrollWindow(0);
}

/**
 * Where the heading should sit, clear of the sticky header.
 *
 * Clamped to the reachable range: a heading near the end of the document cannot
 * be raised to the header, and asking for the impossible keeps the position
 * looking wrong when it is in fact as close as the page allows.
 */
function landingY(el: HTMLElement): number {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const wanted = el.getBoundingClientRect().top + window.scrollY - anchorOffset();
  return Math.min(Math.max(0, wanted), maxScroll);
}

/**
 * Records an intent to scroll to `id`, then drains immediately: a
 * table-of-contents click on the page already being read resolves here with the
 * target in the DOM, and no page transition follows to apply it later.
 */
export function requestAnchor(id: string): void {
  const now = performance.now();
  pending = {
    kind: "anchor",
    id,
    seekUntil: now + SEEK_MS,
    quietUntil: 0,
    hardUntil: 0,
    landedAt: null
  };
  drain();
}

/** Records an intent to show the target page from the top. */
export function requestTop(): void {
  pending = { kind: "top" };
  drain();
}

/**
 * Restarts the search. `@nuxt/content` can settle after `page:finish`, and this
 * is what gives a late heading another window.
 */
export function applyPendingNavigation(): void {
  if (pending?.kind !== "anchor") return;
  pending.seekUntil = performance.now() + SEEK_MS;
  drain();
}

/** Forgets the intent and stops the search already in flight. */
function settle(): void {
  pending = null;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

/**
 * Carries the recorded intent out, one frame at a time, until it is done or the
 * reader takes the scroll back.
 *
 * A scroll we did not make is read as the reader taking over — from then on the
 * position is theirs, not ours to keep correcting.
 */
function drain(): void {
  const target = pending;
  if (!target) return;

  if (target.kind === "top") {
    settle();
    scrollWindow(0);
    return;
  }

  const el = findAnchor(target.id);

  if (!el) {
    if (target.landedAt !== null) {
      // We had it and the page re-rendered it away; jumping to the top now
      // would be a worse answer than staying put.
      settle();
      return;
    }
    if (performance.now() >= target.seekUntil) {
      settle();
      scrollWindow(0);
      return;
    }
  } else if (target.landedAt === null) {
    scrollWindow(landingY(el));
    target.landedAt = window.scrollY;
    const now = performance.now();
    target.quietUntil = now + QUIET_MS;
    target.hardUntil = now + MAX_SETTLE_MS;
  } else {
    const wanted = landingY(el);

    if (Math.abs(wanted - window.scrollY) > CORRECTION_PX) {
      // Between ticks only we move the page, so a position we did not ask for
      // means the reader has the scroll now.
      if (Math.abs(window.scrollY - target.landedAt) > CORRECTION_PX) {
        settle();
        return;
      }
      scrollWindow(wanted);
      target.landedAt = window.scrollY;
      // Re-landing restarts the quiet period: the page is still moving.
      target.quietUntil = performance.now() + QUIET_MS;
    }

    const now = performance.now();
    if (now >= target.quietUntil || now >= target.hardUntil) {
      settle();
      return;
    }
  }

  frame = requestAnimationFrame(() => {
    frame = 0;
    drain();
  });
}
