import type { TOCSection } from "./api/types";

export * from "./api/types";

export const API_SECTIONS: TOCSection[] = [
  { id: "core-class", label: "Core Class" },
  { id: "constructor", label: "Constructor" },
  { id: "options", label: "Options" },
  { id: "state", label: "MouseState" },
  { id: "methods", label: "Methods" },
  { id: "plugin-interface", label: "Plugin Interface" },
  { id: "utilities", label: "Utilities" }
];

export function resolveApiAnchor(target: string): string {
  return target
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveApiHref(anchor: string): string {
  return `/docs/reference/api#${resolveApiAnchor(anchor)}`;
}
