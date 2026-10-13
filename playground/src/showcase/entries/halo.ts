import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { defineCursor, type CursorConfig } from "../types";

interface HaloCfg extends CursorConfig {
  dot: number;
  ring: number;
  color: string;
  dotColor: string;
}

export default defineCursor<HaloCfg>({
  id: "halo",
  chapter: "core",
  order: 30,
  name: "Halo",
  tagline: "Two plugins, one pointer — a core, and a ring that orbits it.",
  plugins: ["dot", "ring"],
  defaults: {
    dot: 6,
    ring: 34,
    color: "#fafafa",
    dotColor: "#f59e0b"
  },
  controls: [
    { key: "dot", kind: "range", label: "Core", min: 2, max: 18, unit: "px" },
    { key: "ring", kind: "range", label: "Ring", min: 12, max: 90, unit: "px" },
    { key: "dotColor", kind: "color", label: "Core colour" },
    { key: "color", kind: "color", label: "Ring colour" }
  ],
  create: (cfg) => [
    Ring({
      size: () => cfg.ring,
      borderWidth: 1.5,
      color: () => cfg.color
    }),
    Dot({
      size: () => cfg.dot,
      color: () => cfg.dotColor
    })
  ]
});
