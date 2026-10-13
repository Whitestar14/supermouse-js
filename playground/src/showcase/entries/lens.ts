import { Lens } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface LensCfg extends CursorConfig {
  size: number;
  hoverSize: number;
  blur: number;
  saturation: number;
  brightness: number;
  tint: string;
  rim: string;
  press: boolean;
}

export default defineCursor<LensCfg>({
  id: "lens",
  chapter: "optics",
  order: 170,
  name: "Lens",
  tagline: "A disc of glass held over the page, refracting what is under it.",
  plugins: ["lens"],
  defaults: {
    size: 64,
    hoverSize: 108,
    blur: 5,
    saturation: 1.5,
    brightness: 1.12,
    tint: "transparent",
    rim: "#7c7c86",
    press: true
  },
  controls: [
    { key: "size", kind: "range", label: "Diameter", min: 24, max: 180, unit: "px" },
    {
      key: "hoverSize",
      kind: "range",
      label: "Open to",
      min: 24,
      max: 240,
      unit: "px",
      hint: "Diameter over the target below."
    },
    { key: "blur", kind: "range", label: "Blur", min: 0, max: 24, step: 0.5, unit: "px" },
    { key: "saturation", kind: "range", label: "Saturation", min: 0, max: 3, step: 0.1 },
    { key: "brightness", kind: "range", label: "Brightness", min: 0.4, max: 2, step: 0.05 },
    {
      key: "tint",
      kind: "color",
      label: "Tint",
      allowTransparent: true,
      hint: "A solid tint paints over the blur. ∅ leaves the glass clear."
    },
    { key: "rim", kind: "color", label: "Rim" },
    {
      key: "press",
      kind: "toggle",
      label: "Squeeze on press",
      structural: true
    }
  ],
  props: [{ shape: "disc", label: "glass", attrs: { "data-hover": "true" } }],
  create: (cfg) => [
    Lens({
      size: () => cfg.size,
      hoverSize: () => cfg.hoverSize,
      blur: () => cfg.blur,
      saturation: () => cfg.saturation,
      brightness: () => cfg.brightness,
      tint: () => cfg.tint,
      rim: () => cfg.rim,
      press: cfg.press
    })
  ]
});
