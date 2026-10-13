import { Trail } from "@supermousejs/trail";
import { Dot } from "@supermousejs/dot";
import { defineCursor, type CursorConfig } from "../types";

interface TrailCfg extends CursorConfig {
  length: number;
  size: number;
  color: string;
}

export default defineCursor<TrailCfg>({
  id: "trail",
  chapter: "core",
  order: 40,
  name: "Trail",
  tagline: "Where the cursor has been, held for a moment.",
  plugins: ["dot", "trail"],
  defaults: {
    length: 16,
    size: 8,
    color: "#f59e0b"
  },
  controls: [
    {
      key: "length",
      kind: "range",
      label: "Segments",
      min: 2,
      max: 40,
      structural: true,
      hint: "The trail is a fixed pool, so the count is set at construction."
    },
    { key: "size", kind: "range", label: "Size", min: 2, max: 24, unit: "px" },
    { key: "color", kind: "color", label: "Colour" }
  ],
  create: (cfg) => [
    Trail({
      length: cfg.length,
      size: () => cfg.size,
      color: () => cfg.color
    }),
    Dot({ size: () => Math.max(3, cfg.size / 3), color: () => cfg.color })
  ]
});
