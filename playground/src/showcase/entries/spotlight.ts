import { Spotlight } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface SpotlightCfg extends CursorConfig {
  maxRadius: number;
  expandRate: number;
  lagRate: number;
  color: string;
  blendMode: string;
}

export default defineCursor<SpotlightCfg>({
  id: "spotlight",
  chapter: "optics",
  order: 190,
  name: "Spotlight",
  tagline: "A torch held to a surface — and the mass that makes it drag.",
  plugins: ["spotlight"],
  defaults: {
    maxRadius: 150,
    expandRate: 6,
    lagRate: 8,
    color: "#ffffff",
    blendMode: "difference"
  },
  controls: [
    {
      key: "maxRadius",
      kind: "range",
      label: "Radius",
      min: 40,
      max: 340,
      unit: "px",
      hint: "How far the reveal opens inside the surface."
    },
    { key: "expandRate", kind: "range", label: "Open", min: 1, max: 24, unit: "rate" },
    { key: "lagRate", kind: "range", label: "Trail", min: 1, max: 30, step: 0.5, unit: "rate" },
    { key: "color", kind: "color", label: "Light" },
    {
      key: "blendMode",
      kind: "select",
      label: "Blend",
      structural: true,
      options: [
        { value: "difference", label: "Difference" },
        { value: "screen", label: "Screen" },
        { value: "normal", label: "Normal" }
      ]
    }
  ],
  props: [
    {
      shape: "screen",
      label: "surface",
      attrs: { "data-supermouse-spotlight": "true" }
    }
  ],
  create: (cfg) => [
    Spotlight({
      selector: "[data-supermouse-spotlight]",
      maxRadius: () => cfg.maxRadius,
      expandRate: () => cfg.expandRate,
      lagRate: () => cfg.lagRate,
      color: () => cfg.color,
      blendMode: cfg.blendMode
    })
  ]
});
