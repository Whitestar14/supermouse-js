import { Halftone } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface HalftoneCfg extends CursorConfig {
  size: number;
  cell: number;
  dot: number;
  color: string;
  react: boolean;
  mask: boolean;
}

export default defineCursor<HalftoneCfg>({
  id: "halftone",
  chapter: "optics",
  order: 180,
  name: "Halftone",
  tagline: "A printed dot screen, loading up with ink as it accelerates.",
  plugins: ["halftone"],
  defaults: {
    size: 132,
    cell: 9,
    dot: 0.32,
    color: "#f2f2f4",
    react: true,
    mask: true
  },
  controls: [
    { key: "size", kind: "range", label: "Disc", min: 40, max: 320, unit: "px" },
    { key: "cell", kind: "range", label: "Pitch", min: 3, max: 24, step: 0.5, unit: "px" },
    { key: "dot", kind: "range", label: "Dot", min: 0.05, max: 0.5, step: 0.01 },
    { key: "color", kind: "color", label: "Ink" },
    {
      key: "react",
      kind: "toggle",
      label: "React to speed",
      structural: true,
      hint: "Tighten the pitch and fatten the dots as the pointer accelerates."
    },
    {
      key: "mask",
      kind: "toggle",
      label: "Fade the rim",
      structural: true,
      hint: "Dissolve the grid at the edge instead of cutting it."
    }
  ],
  create: (cfg) => [
    Halftone({
      size: () => cfg.size,
      cell: () => cfg.cell,
      dot: () => cfg.dot,
      color: () => cfg.color,
      react: cfg.react,
      mask: cfg.mask
    })
  ]
});
