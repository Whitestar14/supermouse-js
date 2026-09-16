export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const rects = new Map<HTMLElement, ViewportRect>();
const listeners = new Map<HTMLElement, Set<() => void>>();
let observer: ResizeObserver | null = null;
let scrollBound = false;
let resizeBound = false;
let refCount = 0;

function measure(container: HTMLElement): ViewportRect {
  const r = container.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function refresh(container: HTMLElement): void {
  rects.set(container, measure(container));
  const set = listeners.get(container);
  if (set) for (const cb of set) cb();
}

function refreshAll(): void {
  for (const container of rects.keys()) refresh(container);
}

function ensureObserver(): void {
  if (observer || typeof ResizeObserver === "undefined") return;
  observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (rects.has(el)) refresh(el);
    }
  });
}

function ensureGlobalListeners(): void {
  if (typeof window === "undefined") return;
  if (!scrollBound) {
    window.addEventListener("scroll", refreshAll, { passive: true, capture: true });
    scrollBound = true;
  }
  if (!resizeBound) {
    window.addEventListener("resize", refreshAll, { passive: true });
    resizeBound = true;
  }
}

export function observe(container: HTMLElement, onChange?: () => void): () => void {
  refCount++;

  if (!rects.has(container)) {
    rects.set(container, measure(container));
    ensureObserver();
    observer?.observe(container);
    ensureGlobalListeners();
  }

  if (onChange) {
    let set = listeners.get(container);
    if (!set) {
      set = new Set();
      listeners.set(container, set);
    }
    set.add(onChange);
  }

  return () => {
    refCount--;

    if (onChange) {
      const set = listeners.get(container);
      set?.delete(onChange);
      if (set && set.size === 0) listeners.delete(container);
    }

    if (refCount === 0) {
      observer?.disconnect();
      observer = null;
      rects.clear();
      listeners.clear();
      if (scrollBound) {
        window.removeEventListener("scroll", refreshAll, { capture: true });
        scrollBound = false;
      }
      if (resizeBound) {
        window.removeEventListener("resize", refreshAll);
        resizeBound = false;
      }
    }
  };
}

export function getRect(container: HTMLElement): ViewportRect {
  let r = rects.get(container);
  if (!r) {
    r = measure(container);
    rects.set(container, r);
  }
  return r;
}

export function toLocal(
  container: HTMLElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  if (container === document.body) return { x: clientX, y: clientY };
  const r = getRect(container);
  return { x: clientX - r.left, y: clientY - r.top };
}

/** For tests. */
export function __resetViewportManagerForTests(): void {
  observer?.disconnect();
  observer = null;
  rects.clear();
  listeners.clear();
  refCount = 0;
  scrollBound = false;
  resizeBound = false;
}
