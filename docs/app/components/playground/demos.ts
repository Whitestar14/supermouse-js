import { reactive } from "vue";
import type { SupermouseInstance } from "@supermousejs/vue";
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
 * Registry of reusable demo setups for `CursorDemo` blocks.
 */
export type DemoSetup = (app: SupermouseInstance, spec: DemoSpec) => void;

export const DEMOS: Record<string, DemoSetup> = {
  dot: (app, spec) => {
    app.use(Dot({ size: () => spec.size, color: () => spec.color }));
  },

  ring: (app, spec) => {
    app.use(Ring({ size: () => spec.size + 18, borderWidth: 2, color: () => spec.color }));
  },

  "dot-ring": (app, spec) => {
    app.use(Ring({ size: () => spec.size + 18, borderWidth: 2, color: () => spec.color }));
    app.use(Dot({ size: () => spec.size, color: () => spec.color }));
  },

  magnetic: (app, spec) => {
    app.use(Magnetic({ attraction: 0.4, distance: 110 }));
    app.use(Dot({ size: () => spec.size, color: () => spec.color }));
  },

  pointer: (app, spec) => {
    app.use(Pointer({ size: () => spec.size + 20, color: () => spec.color }));
  },

  trail: (app, spec) => {
    app.use(Dot({ size: 5, color: () => spec.color }));
    app.use(Trail({ length: 14, size: () => spec.size, color: () => spec.color }));
  },

  sparkles: (app, spec) => {
    app.use(Sparkles({ color: () => spec.color, frequency: 8 }));
  },

  stick: (app, spec) => {
    app.use(Stick({ padding: 12 }));
    app.use(
      SmartRing({
        size: 20,
        hoverSize: 44,
        fill: "transparent",
        borderWidth: 2,
        color: () => spec.color
      })
    );
    app.use(Dot({ size: 6, hideOnShape: true, color: () => spec.color }));
  },

  text: (app, spec) => {
    app.use(Dot({ size: () => spec.size, color: () => spec.color }));
    app.use(Text({ duration: 150, offset: [28, 28], className: "supermouse-tooltip-cursor" }));
  },

  "smart-ring": (app, spec) => {
    app.use(
      SmartRing({
        name: "demo-smart-ring",
        size: () => spec.size + 10,
        hoverSize: () => spec.size + 34,
        fill: "transparent",
        borderWidth: 2,
        color: () => spec.color,
        mixBlendMode: "normal"
      })
    );
  }
};

/**
 * Plugin id -> demo id for auto-embedding live previews on `/docs/plugins/[id]`
 * pages. Plugins missing from this map simply get no inline preview yet — add
 * an entry (and a `DEMOS` setup above) to opt in.
 */
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
