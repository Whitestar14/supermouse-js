import { Pointer } from "@supermousejs/pointer";
import { defineCursor, type CursorConfig } from "../types";

interface PointerCfg extends CursorConfig {
  size: number;
  color: string;
  opacity: number;
  restDelay: number;
  returnToRest: boolean;
}

export default defineCursor<PointerCfg>({
  id: "pointer",
  chapter: "core",
  order: 80,
  name: "Pointer",
  tagline: "An arrow with manners: stop moving, and it lies down.",
  plugins: ["pointer"],
  defaults: {
    size: 34,
    color: "#fafafa",
    opacity: 1,
    restDelay: 450,
    returnToRest: true
  },
  controls: [
    { key: "size", kind: "range", label: "Size", min: 14, max: 96, unit: "px" },
    { key: "color", kind: "color", label: "Colour" },
    { key: "opacity", kind: "range", label: "Opacity", min: 0.1, max: 1, step: 0.05 },
    {
      key: "restDelay",
      kind: "range",
      label: "Rest delay",
      min: 0,
      max: 2000,
      step: 50,
      unit: "ms"
    },
    { key: "returnToRest", kind: "toggle", label: "Return to rest" }
  ],
  create: (cfg) => [
    Pointer({
      size: () => cfg.size,
      color: () => cfg.color,
      opacity: () => cfg.opacity,
      restDelay: () => cfg.restDelay,
      returnToRest: () => cfg.returnToRest
    })
  ]
});
