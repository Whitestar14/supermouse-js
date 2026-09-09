import type { TOCSection } from "./api/types";

export * from "./api/types";

export interface ApiItemMeta {
  name: string;
  category: "Options" | "State" | "Methods" | "Plugin Interface" | "Utilities" | "Core";
  signature: string;
  description: string;
  path: string;
}

export const API_SECTIONS: TOCSection[] = [
  { id: "core-class", label: "Core Class" },
  { id: "constructor", label: "Constructor" },
  { id: "options", label: "Options" },
  { id: "state", label: "MouseState" },
  { id: "methods", label: "Methods" },
  { id: "plugin-interface", label: "Plugin Interface" },
  { id: "utilities", label: "Utilities" }
];

export const API_CATALOG: Record<string, ApiItemMeta> = {
  damping: {
    name: "damping",
    category: "Options",
    signature: "damping?: number = 0.15",
    description: "Physics smoothing factor between 0 (instant response) and 1 (high lag).",
    path: "/docs/reference/api#options"
  },
  container: {
    name: "container",
    category: "Options",
    signature: "container?: HTMLElement | string = document.body",
    description: "Bounding DOM element for cursor tracking and stage rendering.",
    path: "/docs/reference/api#options"
  },
  plugins: {
    name: "plugins",
    category: "Options",
    signature: "plugins?: SupermousePlugin[] = []",
    description: "Array of visual and behavioural cursor plugins to register on init.",
    path: "/docs/reference/api#options"
  },
  "state.pointer": {
    name: "state.pointer",
    category: "State",
    signature: "pointer: { x: number; y: number; vx: number; vy: number }",
    description: "Raw un-smoothed pointer coordinates and instantaneous velocity.",
    path: "/docs/reference/api#state"
  },
  "state.smooth": {
    name: "state.smooth",
    category: "State",
    signature: "smooth: { x: number; y: number; vx: number; vy: number }",
    description: "Interpolated smooth coordinates calculated by the physics spring loop.",
    path: "/docs/reference/api#state"
  },
  destroy: {
    name: "destroy()",
    category: "Methods",
    signature: "destroy(): void",
    description: "Stops the animation loop, tears down listeners, and cleans up DOM nodes.",
    path: "/docs/reference/api#methods"
  },
  update: {
    name: "update()",
    category: "Methods",
    signature: "update(options: Partial<SupermouseOptions>): void",
    description: "Dynamically updates global options or individual plugin parameters.",
    path: "/docs/reference/api#methods"
  },
  SupermousePlugin: {
    name: "SupermousePlugin",
    category: "Plugin Interface",
    signature: "interface SupermousePlugin { name: string; init?(ctx): void; onRender?(state, ctx): void; }",
    description: "Contract implemented by all Supermouse visual and physics extensions.",
    path: "/docs/reference/api#plugin-interface"
  }
};

export function resolveApiAnchor(target: string): string {
  const normalized = target.trim().toLowerCase();

  if (normalized.startsWith("state.")) {
    return normalized
      .slice("state.".length)
      .replace(/[()]/g, "")
      .replace(/[^a-z0-9\-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return normalized
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveApiHref(anchor: string): string {
  const catalogItem = API_CATALOG[anchor.toLowerCase()] || API_CATALOG[anchor];
  if (catalogItem) {
    return catalogItem.path;
  }
  return `/docs/reference/api#${resolveApiAnchor(anchor)}`;
}
