import { onMounted, onUnmounted, type Ref } from "vue";

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
 * is part of the server-rendered HTML rather than appearing after hydration.
 */
export function useTocSections() {
  return useState<TocSection[]>("docs-toc", () => []);
}

/** Currently highlighted heading id, updated while scrolling. */
export function useTocActiveSection() {
  return useState<string>("docs-toc-active", () => "");
}

/**
 * Drives scroll tracking for the section list published by the page.
 * Mount once per page.
 */
export function useTocScroll(sections: Ref<TocSection[]>) {
  const activeSection = useTocActiveSection();
  let isScrolling = false;
  let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

  const updateActiveSection = () => {
    if (isScrolling || sections.value.length === 0) return;
    const fromTop = window.scrollY + 120;
    let current = sections.value[0]?.id ?? "";
    for (const section of sections.value) {
      const el = document.getElementById(section.id);
      if (el && el.offsetTop <= fromTop) current = section.id;
    }
    activeSection.value = current;
  };

  const scrollTo = (id: string, behavior: ScrollBehavior = "smooth") => {
    const el = document.getElementById(id);
    if (!el) return;
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 800);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior });
    activeSection.value = id;
  };

  onMounted(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) scrollTo(hash, "auto");
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", updateActiveSection);
    window.removeEventListener("resize", updateActiveSection);
  });

  return { activeSection, scrollTo };
}
