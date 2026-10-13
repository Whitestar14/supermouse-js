import { Grain } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface GrainCfg extends CursorConfig {
  size: number;
  grain: number;
  density: number;
  color: string;
  flicker: number;
  react: boolean;
  blend: string;
}

export default defineCursor<GrainCfg>({
  id: "grain",
  chapter: "art",
  order: 240,
  name: "Grain",
  tagline: "Emulsion under the pointer, and a longer exposure when it moves.",
  plugins: ["grain"],
  defaults: {
    size: 96,
    grain: 0.75,
    density: 0.55,
    color: "#f2f2f4",
    flicker: 8,
    react: true,
    blend: "screen"
  },
  controls: [
    { key: "size", kind: "range", label: "Disc", min: 40, max: 260, unit: "px" },
    {
      key: "grain",
      kind: "range",
      label: "Grain",
      min: 0.2,
      max: 2,
      step: 0.05,
      hint: "Noise frequency. Higher is finer, more film-like."
    },
    {
      key: "density",
      kind: "range",
      label: "Density",
      min: 0,
      max: 1,
      step: 0.05,
      hint: "Threshold on the noise field — how much of it survives as speckle."
    },
    { key: "color", kind: "color", label: "Colour" },
    {
      key: "flicker",
      kind: "range",
      label: "Flicker",
      min: 0,
      max: 24,
      structural: true,
      hint: "New noise fields per second. Zero freezes the grain."
    },
    {
      key: "react",
      kind: "toggle",
      label: "Expose by speed",
      structural: true,
      hint: "Fatten the grain while the pointer is moving."
    },
    {
      key: "blend",
      kind: "select",
      label: "Blend",
      structural: true,
      options: [
        { value: "screen", label: "Screen" },
        { value: "overlay", label: "Overlay" },
        { value: "normal", label: "Normal" }
      ]
    }
  ],
  create: (cfg) => [
    Grain({
      size: () => cfg.size,
      grain: () => cfg.grain,
      density: () => cfg.density,
      color: () => cfg.color,
      flicker: () => cfg.flicker,
      react: cfg.react,
      blend: cfg.blend
    })
  ]
});
