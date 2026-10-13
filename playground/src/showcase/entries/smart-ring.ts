import { SmartRing } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface SmartRingCfg extends CursorConfig {
  size: number;
  hoverSize: number;
  borderWidth: number;
  color: string;
  fill: string;
  skew: boolean;
}

export default defineCursor<SmartRingCfg>({
  id: "smart-ring",
  chapter: "core",
  order: 110,
  name: "SmartRing",
  tagline: "A ring that recognises a target and opens up for it.",
  plugins: ["smart-ring"],
  defaults: {
    size: 22,
    hoverSize: 64,
    borderWidth: 1.5,
    color: "#fafafa",
    fill: "transparent",
    skew: false
  },
  controls: [
    { key: "size", kind: "range", label: "Idle", min: 8, max: 80, unit: "px" },
    { key: "hoverSize", kind: "range", label: "On target", min: 8, max: 180, unit: "px" },
    { key: "borderWidth", kind: "range", label: "Weight", min: 0.5, max: 6, step: 0.5, unit: "px" },
    { key: "color", kind: "color", label: "Ring" },
    { key: "fill", kind: "color", label: "Fill", allowTransparent: true },
    { key: "skew", kind: "toggle", label: "Skew with velocity", structural: true }
  ],
  props: [
    {
      shape: "disc",
      label: "target",
      attrs: { "data-hover": "true" }
    }
  ],
  create: (cfg) => [
    SmartRing({
      name: "showcase-smart-ring",
      size: () => cfg.size,
      hoverSize: () => cfg.hoverSize,
      borderWidth: () => cfg.borderWidth,
      color: () => cfg.color,
      fill: () => cfg.fill,
      enableSkew: cfg.skew
    })
  ]
});
