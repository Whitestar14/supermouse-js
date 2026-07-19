import { ref, onMounted, onUnmounted, nextTick, markRaw } from "vue";
import { useRoute } from "vue-router";
import { useDocsSidebar } from "./useDocsSidebar";
import TableOfContents from "@components/docs/TableOfContents.vue";
import type { TOCSection } from "./useApiReference";

export function useToc(customSections?: TOCSection[]) {
  const route = useRoute();
  const activeSection = ref<string>("");
  const sections = ref<TOCSection[]>(customSections || []);
  const { setRightSidebar, clearRightSidebar } = useDocsSidebar();
  let isScrolling = false;
  let scrollTimeout: any = null;

  const updateActiveSection = () => {
    if (isScrolling) return;

    const offset = 120;
    const fromTop = window.scrollY + offset;
    let current = sections.value[0]?.id ?? "";

    for (const section of sections.value) {
      const el = document.getElementById(section.id);
      if (!el) continue;
      if (el.offsetTop <= fromTop) {
        current = section.id;
      }
    }
    activeSection.value = current;
  };

  const scrollTo = (id: string, behavior: ScrollBehavior = "smooth") => {
    const el = document.getElementById(id);
    if (!el) return;

    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);

    // Resume scroll listener after typical smooth scroll duration
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 800);

    const offset = 120;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior });

    activeSection.value = id;
  };

  const scrollToHash = (behavior: ScrollBehavior = "smooth") => {
    const hash = route.hash.replace("#", "");
    if (!hash) return;
    scrollTo(hash, behavior);
  };

  const initToc = () => {
    if (!customSections) {
      // Auto-scan document for sections if not provided
      const headings = document.querySelectorAll(".docs-content h2[id], .docs-content h3[id]");
      sections.value = Array.from(headings).map((el) => {
        let text = (el.textContent || "")
          .replace(/^\s*#\s*/, "")
          .replace(/#$/, "")
          .trim();
        return {
          id: el.id,
          label: text
        };
      });
    }

    if (sections.value.length === 0) return;

    setRightSidebar({
      component: markRaw(TableOfContents),
      props: {
        sections: sections.value,
        activeSection
      },
      on: {
        navigate: scrollTo
      }
    });

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection, { passive: true });
  };

  onMounted(async () => {
    await nextTick();
    initToc();
    await nextTick(() => scrollToHash("auto"));
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", updateActiveSection);
    window.removeEventListener("resize", updateActiveSection);
    clearRightSidebar();
  });

  return { sections, activeSection, scrollTo };
}
