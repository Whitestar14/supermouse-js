import { Magnetic } from "@supermousejs/magnetic";
import { Dot } from "@supermousejs/dot";
import { defineCursor, type CursorConfig } from "../types";

interface MagneticCfg extends CursorConfig {
  attraction: number;
  distance: number;
  color: string;
}

export default defineCursor<MagneticCfg>({
  id: "magnetic",
  chapter: "core",
  order: 50,
  name: "Magnetic",
  tagline: "Come close, and the field finishes the move for you.",
  plugins: ["magnetic", "dot"],
  defaults: {
    attraction: 0.45,
    distance: 140,
    color: "#f59e0b"
  },
  controls: [
    {
      key: "attraction",
      kind: "range",
      label: "Attraction",
      min: 0.05,
      max: 1,
      step: 0.05,
      hint: "How much of the remaining gap the cursor surrenders."
    },
    { key: "distance", kind: "range", label: "Reach", min: 40, max: 360, unit: "px" },
    { key: "color", kind: "color", label: "Colour" }
  ],
  props: [
    {
      shape: "disc",
      label: "field",
      attrs: { "data-supermouse-magnetic": "true", "data-hover": "true" }
    }
  ],
  create: (cfg) => [
    Magnetic({
      attraction: () => cfg.attraction,
      distance: () => cfg.distance
    }),
    Dot({ size: 8, color: () => cfg.color })
  ]
});
