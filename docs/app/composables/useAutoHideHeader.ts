import { onMounted, onScopeDispose, watch, type Ref } from "vue";

/**
 * Drives the app's slide-away header.
 *
 * The movement itself is pure CSS: `.header-shell` elements translate by
 * `--header-shift`, which `html.header-hidden` flips to the negative header
 * height. This composable only decides *when* that class is present, so the
 * header, the docs sub-header and the sticky rails all travel on one variable
 * with one transition — no measured heights, no per-element JS, and nothing
 * can reserve a gap while the header is mid-flight.
 *
 * Elements can pin the header open (mobile menus, drawers) via `pinned`.
 */

const HIDE_AFTER = 140;
const DELTA = 8;

let pins = 0;
let hidden = false;
let lastY = 0;
let consumers = 0;

function apply(): void {
  document.documentElement.classList.toggle("header-hidden", hidden && pins === 0);
}

function setHidden(next: boolean): void {
  if (next === hidden) return;
  hidden = next;
  apply();
}

function onScroll(): void {
  // Overlays own the header while they're open.
  if (pins > 0) return;

  const y = window.scrollY;
  if (y <= HIDE_AFTER) {
    setHidden(false);
    lastY = y;
    return;
  }

  const delta = y - lastY;
  if (Math.abs(delta) < DELTA) return;
  setHidden(delta > 0);
  lastY = y;
}

function onResize(): void {
  if (!hidden) apply();
}

function attach(): void {
  consumers += 1;
  if (consumers > 1) return;
  lastY = window.scrollY;
  hidden = false;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
}

function detach(): void {
  consumers = Math.max(0, consumers - 1);
  if (consumers > 0) return;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onResize);
  pins = 0;
  hidden = false;
  document.documentElement.classList.remove("header-hidden");
}

export function useAutoHideHeader(pinned?: Ref<boolean>): void {
  let held = false;

  const sync = (active: boolean): void => {
    if (active === held) return;
    held = active;
    pins += active ? 1 : -1;
    if (active) {
      setHidden(false);
    } else {
      lastY = window.scrollY;
      apply();
    }
  };

  onMounted(() => {
    attach();
    setHidden(false);
    lastY = window.scrollY;
  });

  if (pinned) {
    watch(pinned, sync, { immediate: false });
  }

  onScopeDispose(() => {
    if (held) {
      held = false;
      pins = Math.max(0, pins - 1);
    }
    detach();
  });
}
