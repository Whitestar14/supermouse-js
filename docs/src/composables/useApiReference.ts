import { TOCSection, ApiItem } from "./api/types";
import { constructorEntry, optionsData } from "./api/core";
import { stateData } from "./api/state";
import { methodsData } from "./api/methods";
import { pluginHooks } from "./api/plugins";
import {
  mathUtilities,
  domUtilities,
  effectsUtilities,
  constantUtilities,
  otherUtilities
} from "./api/utilities";

export * from "./api/types";
export * from "./api/core";
export * from "./api/state";
export * from "./api/methods";
export * from "./api/plugins";
export * from "./api/utilities";

export const API_SECTIONS: TOCSection[] = [
  { id: "core-class", label: "Core Class" },
  { id: "constructor", label: "Constructor" },
  { id: "options", label: "Options" },
  { id: "state", label: "MouseState" },
  { id: "methods", label: "Methods" },
  { id: "plugin-interface", label: "Plugin Interface" },
  { id: "utilities", label: "Utilities" }
];

export const ALL_API_ENTRIES: ApiItem[] = [
  constructorEntry,
  ...optionsData,
  ...stateData,
  ...methodsData,
  ...pluginHooks,
  ...mathUtilities,
  ...domUtilities,
  ...effectsUtilities,
  ...constantUtilities,
  ...otherUtilities
];

export function resolveApiAnchor(target: string): string {
  const cleanTarget = target.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Try to find an exact match in the IDs
  const matchById = ALL_API_ENTRIES.find(
    (item) => item.id.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanTarget
  );
  if (matchById) return matchById.id;

  // Try to find a match in the names
  const matchByName = ALL_API_ENTRIES.find(
    (item) => item.name.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanTarget
  );
  if (matchByName) return matchByName.id;

  // Custom heuristics for legacy/shorthand anchors
  if (cleanTarget === "stateinteraction") return "interaction";
  if (cleanTarget === "plugins") return "plugin-interface";
  if (cleanTarget === "hidecursor") return "hidecursor";
  if (cleanTarget === "ignoreonnative") return "ignoreonnative";
  if (cleanTarget === "dataattributes") return "data-attributes";

  // Fallback to simple slugify
  return target
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9\-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveApiHref(anchor: string): string {
  return `/docs/reference/api#${resolveApiAnchor(anchor)}`;
}
