import type { SupermousePlugin } from "@supermousejs/core";
import type { ChapterId } from "./chapters";

/** Anything a control can read off a cursor's config. */
export type CursorValue = number | string | boolean;
export type CursorConfig = Record<string, CursorValue>;

interface ControlBase {
  /** Key on the entry's config object. */
  key: string;
  label: string;
  /** One line of context, rendered under the field. */
  hint?: string;
  /**
   * Options the plugin reads once, at construction. A control marked
   * structural rebuilds the cursor's plugin set when it changes; everything
   * else is passed as a getter and takes effect on the next frame.
   */
  structural?: boolean;
}

export interface RangeControl extends ControlBase {
  kind: "range";
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export interface ColorControl extends ControlBase {
  kind: "color";
  /** Offer a "none" swatch for options that accept `transparent`. */
  allowTransparent?: boolean;
}

export interface ToggleControl extends ControlBase {
  kind: "toggle";
}

export interface SelectControl extends ControlBase {
  kind: "select";
  options: Array<{ value: string; label: string }>;
}

export interface TextControl extends ControlBase {
  kind: "text";
}

export type CursorControl =
  | RangeControl
  | ColorControl
  | ToggleControl
  | SelectControl
  | TextControl;

/**
 * An interactive target the scene renders for cursors that read the DOM —
 * Stick measures a box, Magnetic pulls toward one, Text needs a label.
 */
export interface CursorProp {
  label?: string;
  /** `screen` is a large framed surface for reveals that need room. */
  shape?: "plate" | "disc" | "screen";
  /** `data-*` attributes stamped on the element (e.g. `data-supermouse-stick`). */
  attrs: Record<string, string>;
}

export interface CursorEntry<C extends CursorConfig = CursorConfig> {
  id: string;
  /** Which chapter of the tour this cursor belongs to. */
  chapter: ChapterId;
  /**
   * Showcase order. Numbers are spaced by ten so a new cursor can be dropped
   * between two existing ones without renumbering anything.
   */
  order: number;
  name: string;
  /** The one line under the title — what this cursor *is*. */
  tagline: string;
  /** Plugin names this cursor is built from, shown as credit chips. */
  plugins: string[];
  defaults: C;
  controls: CursorControl[];
  props?: CursorProp[];
  /** Builds the plugin list from live config. Getters are read every frame. */
  create: (cfg: C) => SupermousePlugin[];
}

/**
 * Identity helper: keeps author-facing entries type-checked while the registry
 * stores them with their config generic erased.
 */
export function defineCursor<C extends CursorConfig>(entry: CursorEntry<C>): CursorEntry {
  // The registry only needs the config as a bag of values; entries keep their
  // own literal typing on the way in.
  return entry as unknown as CursorEntry;
}
