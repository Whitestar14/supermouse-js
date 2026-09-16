import { onMounted, onUnmounted, type Ref } from "vue";

export function useAutoHideHeader(
  el: Ref<HTMLElement | null>,
  options: { pinned?: Ref<boolean>; hideAfter?: number } = {}
): void {
  const { pinned, hideAfter = 140 } = options;

  // Structural type so the dynamic import stays type-only.
  let gsap: typeof import("gsap").gsap | null = null;
  let hidden = false;
  let lastY = 0;

  const publishOffset = (visible: boolean): void => {
    const height = visible ? (el.value?.offsetHeight ?? 0) : 0;
    document.documentElement.style.setProperty("--header-h", `${height}px`);
  };

  const setHidden = (next: boolean): void => {
    if (next === hidden || !el.value) return;
    hidden = next;
    publishOffset(!next);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!gsap) return;

    if (reduced) {
      gsap.set(el.value, { yPercent: next ? -100 : 0 });
      return;
    }

    gsap.to(el.value, {
      yPercent: next ? -100 : 0,
      duration: next ? 0.28 : 0.34,
      ease: next ? "power2.out" : "power3.out",
      overwrite: true
    });
  };

  const onScroll = (): void => {
    const y = window.scrollY;

    // Overlays (mobile menu) own the header while they are open.
    if (pinned?.value || y <= hideAfter) {
      setHidden(false);
      lastY = y;
      return;
    }

    const delta = y - lastY;
    if (Math.abs(delta) < 8) return; // ignore trackpad jitter
    setHidden(delta > 0);
    lastY = y;
  };

  const onResize = (): void => {
    if (!hidden) publishOffset(true);
  };

  onMounted(async () => {
    if (!el.value) return;

    ({ gsap } = await import("gsap"));
    gsap.set(el.value, { yPercent: 0 });
    lastY = window.scrollY;
    publishOffset(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
  });

  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    document.documentElement.style.removeProperty("--header-h");
  });
}
