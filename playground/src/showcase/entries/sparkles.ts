import { Sparkles } from "@supermousejs/labs";
import { Dot } from "@supermousejs/dot";
import { defineCursor, type CursorConfig } from "../types";

interface SparklesCfg extends CursorConfig {
  color: string;
  frequency: number;
  count: number;
  decay: number;
}

export default defineCursor<SparklesCfg>({
  id: "sparkles",
  chapter: "core",
  order: 90,
  name: "Sparkles",
  tagline: "Movement, shed as light and left to fade.",
  plugins: ["dot", "sparkles"],
  defaults: {
    color: "#fcd34d",
    frequency: 9,
    count: 36,
    decay: 2.5
  },
  controls: [
    { key: "color", kind: "color", label: "Colour" },
    {
      key: "frequency",
      kind: "range",
      label: "Density",
      min: 2,
      max: 40,
      structural: true,
      hint: "Pixels of travel between particles. Lower is denser."
    },
    { key: "count", kind: "range", label: "Pool", min: 6, max: 80, structural: true },
    { key: "decay", kind: "range", label: "Decay", min: 0.5, max: 6, step: 0.5, structural: true }
  ],
  create: (cfg) => [
    Sparkles({
      color: () => cfg.color,
      frequency: cfg.frequency,
      count: cfg.count,
      decay: cfg.decay
    }),
    Dot({ size: 4, color: () => cfg.color })
  ]
});
