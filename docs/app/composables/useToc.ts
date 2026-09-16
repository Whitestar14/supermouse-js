import { onMounted, onUnmounted, watch, type Ref } from "vue";
import { HEADER_OFFSET_PX } from "@utils/scroll";

/** A single heading in the right-hand table of contents. */
export interface TocSection {
  id: string;
  label: string;
  /** 2 = h2 (top level), 3 = h3 (indented). */
  depth: 2 | 3;
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
 * Highlights the section currently in view.
 *
 * Scrolling is deliberately *not* handled here. Anchor clicks go through the
 * router and every navigation is positioned by `@utils/scroll`, so the rail
 * only has to observe — the previous duplicate copy of the scroll logic (and
 * the "isScrolling" suppression timer it needed) is gone with it.
 */
export function useTocScroll(sections: Ref<TocSection[]>) {
  const activeSection = useTocActiveSection();

  const update = (): void => {
    if (sections.value.length === 0) return;

    const fromTop = window.scrollY + HEADER_OFFSET_PX + 1;
    let current = sections.value[0]?.id ?? "";

    for (const section of sections.value) {
      const el = document.getElementById(section.id);
      if (!el) continue;
      if (el.getBoundingClientRect().top + window.scrollY <= fromTop) current = section.id;
    }

    activeSection.value = current;
  };

  onMounted(() => {
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", update);
    window.removeEventListener("resize", update);
  });

  watch(sections, update, { flush: "post" });
}
