import { Dot } from "@supermousejs/dot";
import { defineCursor, type CursorConfig } from "../types";

interface DotCfg extends CursorConfig {
  size: number;
  color: string;
  opacity: number;
  blend: string;
  hideOnShape: boolean;
}

export default defineCursor<DotCfg>({
  id: "dot",
  chapter: "core",
  order: 10,
  name: "Dot",
  tagline: "A single point of light, trailing your intent by a hair.",
  plugins: ["dot"],
  defaults: {
    size: 10,
    color: "#f59e0b",
    opacity: 1,
    blend: "normal",
    hideOnShape: false
  },
  controls: [
    { key: "size", kind: "range", label: "Size", min: 2, max: 48, unit: "px" },
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
    },
    {
      key: "hideOnShape",
      kind: "toggle",
      label: "Yield to shapes",
      structural: true,
      hint: "Stand down while Stick or SmartRing owns the cursor."
    }
  ],
  create: (cfg) => [
    Dot({
      size: () => cfg.size,
      color: () => cfg.color,
      opacity: () => cfg.opacity,
      mixBlendMode: cfg.blend,
      hideOnShape: cfg.hideOnShape
    })
  ]
});
