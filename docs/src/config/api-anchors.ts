/**
 * Maps shorthand API link targets used in guide pages to anchor IDs
 * on the API reference page.
 */
export const API_ANCHOR_MAP: Record<string, string> = {
  constructor: "constructor",
  hidecursor: "hidecursor",
  ignoreonnative: "ignoreonnative",
  rules: "rules",
  "data-attributes": "data-attributes",
  container: "container",
  plugins: "constructor",
  use: "use",
  "state.interaction": "interaction",
  setnativecursor: "setnativecursor",
  destroy: "destroy",
  enable: "enable",
  disable: "disable"
};

export function resolveApiAnchor(anchor: string): string {
  const key = anchor.toLowerCase();
  return API_ANCHOR_MAP[key] ?? key;
}

export function resolveApiHref(anchor: string): string {
  return `/docs/reference/api#${resolveApiAnchor(anchor)}`;
}
