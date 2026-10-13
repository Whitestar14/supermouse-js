import { Ring } from "@supermousejs/ring";
import { defineCursor, type CursorConfig } from "../types";

interface RingCfg extends CursorConfig {
  size: number;
  borderWidth: number;
  color: string;
  opacity: number;
  blend: string;
}

export default defineCursor<RingCfg>({
  id: "ring",
  chapter: "core",
  order: 20,
  name: "Ring",
  tagline: "A circle that admits it is only ever nearly there.",
  plugins: ["ring"],
  defaults: {
    size: 28,
    borderWidth: 2,
    color: "#fafafa",
    opacity: 1,
    blend: "normal"
  },
  controls: [
    { key: "size", kind: "range", label: "Diameter", min: 8, max: 96, unit: "px" },
    { key: "borderWidth", kind: "range", label: "Weight", min: 0.5, max: 6, step: 0.5, unit: "px" },
    { key: "color", kind: "color", label: "Colour" },
    { key: "opacity", kind: "range", label: "Opacity", min: 0.1, max: 1, step: 0.05 },
    {
      key: "blend",
      kind: "select",
      label: "Blend",
      structural: true,
      options: [
        { value: "normal", label: "Normal" },
        { value: "difference", label: "Difference" },
        { value: "exclusion", label: "Exclusion" },
        { value: "screen", label: "Screen" }
      ]
    }
  ],
  create: (cfg) => [
    Ring({
      size: () => cfg.size,
      borderWidth: () => cfg.borderWidth,
      color: () => cfg.color,
      opacity: () => cfg.opacity,
      mixBlendMode: cfg.blend
    })
  ]
});
