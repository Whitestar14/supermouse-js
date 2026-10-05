import { onMounted, onUnmounted, watch, type Ref } from "vue";
import { anchorOffset, findAnchor } from "@utils/scroll";

/** A single heading in the right-hand table of contents. */
export interface TocSection {
  id: string;
  label: string;
  /** 2 = h2, 3 = h3 nested under it, 4 = h4 nested under that. */
  depth: 2 | 3 | 4;
}

/**
 * Publishes a page's headings for the rail and keeps the active one in sync.
 *
 * Both page shapes (markdown pages and the generated plugin page) call this, so
 * the layout never has to know where a section list came from.
 */
export function useToc(sections: Ref<TocSection[]>): void {
  const state = useTocSections();
  watch(sections, (value) => (state.value = value), { immediate: true });
  useTocScroll(sections);
}

/**
 * Headings for the current page. The docs page publishes them during its own
 * setup; the docs layout reads them later in the same render pass, so the rail
 * is part of the first paint rather than appearing after hydration.
 */
export function useTocSections() {
  return useState<TocSection[]>("docs-toc", () => []);
}

/** Currently highlighted heading id, updated while scrolling. */
export function useTocActiveSection() {
  return useState<string>("docs-toc-active", () => "");
}

/**
 * A heading becomes "current" once it rises above a reading line this far down
 * the viewport. Anchoring that line to the header alone meant a section only lit
 * up when its heading sat at the very top of the screen, under the sliding nav.
 */
const ACTIVE_LINE_RATIO = 0.3;

/** Within this many pixels of the end, the last section wins. */
const BOTTOM_EPSILON_PX = 8;

/**
 * The section the reader picked from the rail, held until they scroll.
 *
 * Geometry cannot express this on its own. A heading only becomes current once
 * it rises above the reading line, and right after a click it can sit below one
 * for two reasons: the next heading is close enough underneath to count as
 * passed, or the document ends before the page can scroll far enough to raise
 * it. A click states the reader's intent outright, so it outranks the estimate
 * until they take the scroll back.
 */
let pinnedId: string | null = null;

/** Lights `id` as the current section until the reader scrolls or clicks away. */
export function pinTocSection(id: string): void {
  pinnedId = id;
  useTocActiveSection().value = id;
}

/**
 * Highlights the section in view. Scrolling lives in `@utils/scroll`, so the
 * rail only observes.
 */
export function useTocScroll(sections: Ref<TocSection[]>) {
  const activeSection = useTocActiveSection();
  let frame = 0;

  const compute = (): void => {
    if (pinnedId) return;

    const list = sections.value;
    if (list.length === 0) return;

    const line = window.scrollY + Math.max(anchorOffset(), window.innerHeight * ACTIVE_LINE_RATIO);

    let current = list[0]!.id;

    for (const section of list) {
      const el = findAnchor(section.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top + window.scrollY <= line) current = section.id;
    }

    // Trailing sections never cross `line`, since the page cannot scroll past
    // its own end. Hand the highlight to the last one at the bottom.
    const atBottom =
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - BOTTOM_EPSILON_PX;
    if (atBottom) current = list[list.length - 1]!.id;

    activeSection.value = current;
  };

  /** Coalesce scroll bursts into one measurement per frame. */
  const schedule = (): void => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      compute();
    });
  };

  /**
   * Hands the rail back to the reading position. These all land before a TOC
   * link's own `click`, so pinning still wins for the jump it triggers.
   */
  const release = (): void => {
    pinnedId = null;
  };

  onMounted(() => {
    compute();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchmove", release, { passive: true });
    window.addEventListener("pointerdown", release, { passive: true });
    window.addEventListener("keydown", release);
  });

  onUnmounted(() => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("wheel", release);
    window.removeEventListener("touchmove", release);
    window.removeEventListener("pointerdown", release);
    window.removeEventListener("keydown", release);
  });

  watch(sections, compute, { flush: "post" });
}
