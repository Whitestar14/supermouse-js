import { reactive } from "vue";
import type { SupermousePlugin } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { Magnetic } from "@supermousejs/magnetic";
import { Pointer } from "@supermousejs/pointer";
import { Stick } from "@supermousejs/stick";
import { Trail } from "@supermousejs/trail";
import { Text } from "@supermousejs/text";
import { SmartRing, Sparkles } from "@supermousejs/labs";

export interface DemoSpec {
  size: number;
  color: string;
  smoothness: number;
}

export const createDemoSpec = (): DemoSpec =>
  reactive({ size: 10, color: "#f59e0b", smoothness: 0.15 });

/**
 * Owns the instance's smoothing while its scope is active — `smoothness` is an
 * instance option, so a region can only adjust it from inside a scope.
 */
export const smoothnessPlugin = (read: () => number): SupermousePlugin => {
  let previous = 0;

  return {
    name: "preview-smoothness",
    priority: -1000,
    install(app) {
      previous = app.options.smoothness;
    },
    onEnable(app) {
      previous = app.options.smoothness;
      app.options.smoothness = read();
    },
    update(app) {
      app.options.smoothness = read();
    },
    onDisable(app) {
      app.options.smoothness = previous;
    }
  };
};

/**
 * A demo is a plugin list, not an imperative setup: the stage installs it into
 * its own scope, so options are read from the live spec every frame.
 */
export type DemoPlugins = (spec: DemoSpec) => SupermousePlugin[];

export const DEMOS: Record<string, DemoPlugins> = {
  dot: (spec) => [Dot({ size: () => spec.size, color: () => spec.color })],

  ring: (spec) => [
    Ring({ size: () => spec.size + 18, borderWidth: 2, color: () => spec.color })
  ],

  "dot-ring": (spec) => [
    Ring({ size: () => spec.size + 18, borderWidth: 2, color: () => spec.color }),
    Dot({ size: () => spec.size, color: () => spec.color })
  ],

  magnetic: (spec) => [
    Magnetic({ attraction: 0.4, distance: 110 }),
    Dot({ size: () => spec.size, color: () => spec.color })
  ],

  pointer: (spec) => [Pointer({ size: () => spec.size + 20, color: () => spec.color })],

  trail: (spec) => [
    Dot({ size: 5, color: () => spec.color }),
    Trail({ length: 14, size: () => spec.size, color: () => spec.color })
  ],

  sparkles: (spec) => [Sparkles({ color: () => spec.color, frequency: 8 })],

  stick: (spec) => [
    Stick({ padding: 12 }),
    SmartRing({
      size: 20,
      hoverSize: 44,
      fill: "transparent",
      borderWidth: 2,
      color: () => spec.color
    }),
    Dot({ size: 6, hideOnShape: true, color: () => spec.color })
  ],

  text: (spec) => [
    Dot({ size: () => spec.size, color: () => spec.color }),
    Text({ duration: 150, offset: [28, 28], className: "supermouse-tooltip-cursor" })
  ],

  "smart-ring": (spec) => [
    SmartRing({
      name: "demo-smart-ring",
      size: () => spec.size + 10,
      hoverSize: () => spec.size + 34,
      fill: "transparent",
      borderWidth: 2,
      color: () => spec.color,
      mixBlendMode: "normal"
    })
  ]
};

/** Plugin id -> demo id for the live previews on `/docs/plugins/[id]`. */
export const PLUGIN_DEMO_IDS: Record<string, string> = {
  dot: "dot",
  ring: "ring",
  magnetic: "magnetic",
  pointer: "pointer",
  trail: "trail",
  sparkles: "sparkles",
  stick: "stick",
  text: "text",
  "smart-ring": "smart-ring"
};
