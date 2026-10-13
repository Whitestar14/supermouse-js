import { Stick } from "@supermousejs/stick";
import { SmartRing } from "@supermousejs/labs";
import { Dot } from "@supermousejs/dot";
import { defineCursor, type CursorConfig } from "../types";

interface StickCfg extends CursorConfig {
  padding: number;
  borderWidth: number;
  color: string;
}

export default defineCursor<StickCfg>({
  id: "stick",
  chapter: "core",
  order: 60,
  name: "Stick",
  tagline: "The pointer stops being a dot and becomes a frame.",
  plugins: ["stick", "smart-ring", "dot"],
  defaults: {
    padding: 14,
    borderWidth: 1.5,
    color: "#f59e0b"
  },
  controls: [
    {
      key: "padding",
      kind: "range",
      label: "Padding",
      min: 0,
      max: 48,
      structural: true,
      hint: "Extra room around the target, measured once on hover."
    },
    { key: "borderWidth", kind: "range", label: "Weight", min: 0.5, max: 5, step: 0.5, unit: "px" },
    { key: "color", kind: "color", label: "Colour" }
  ],
  props: [
    {
      shape: "plate",
      label: "hold",
      attrs: { "data-supermouse-stick": "true", "data-hover": "true" }
    }
  ],
  create: (cfg) => [
    Stick({ padding: cfg.padding }),
    SmartRing({
      name: "showcase-stick-ring",
      size: 18,
      hoverSize: 0,
      fill: "transparent",
      borderWidth: () => cfg.borderWidth,
      color: () => cfg.color
    }),
    Dot({ size: 6, hideOnShape: true, color: () => cfg.color })
  ]
});
