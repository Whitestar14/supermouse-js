import { Glitch } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface GlitchCfg extends CursorConfig {
  size: number;
  color: string;
  red: string;
  cyan: string;
  intensity: number;
  chaos: number;
  hoverBoost: boolean;
  blend: string;
}

export default defineCursor<GlitchCfg>({
  id: "glitch",
  chapter: "optics",
  order: 120,
  name: "Glitch",
  tagline: "A signal that keeps losing a frame, and drawing the loss.",
  plugins: ["glitch"],
  defaults: {
    size: 18,
    color: "#f2f2f4",
    red: "#ff2e63",
    cyan: "#00e5ff",
    intensity: 6,
    chaos: 0.35,
    hoverBoost: true,
    blend: "screen"
  },
  controls: [
    { key: "size", kind: "range", label: "Size", min: 6, max: 48, unit: "px" },
    { key: "color", kind: "color", label: "Core" },
    { key: "red", kind: "color", label: "Ghost A" },
    { key: "cyan", kind: "color", label: "Ghost B" },
    {
      key: "intensity",
      kind: "range",
      label: "Separation",
      min: 0,
      max: 20,
      step: 0.5,
      unit: "px",
      hint: "Both the chromatic split and the displacement scale."
    },
    {
      key: "chaos",
      kind: "range",
      label: "Chaos",
      min: 0,
      max: 1,
      step: 0.05,
      hint: "The tear rate — how often a slice is lost and shifted."
    },
    {
      key: "hoverBoost",
      kind: "toggle",
      label: "Lose it on hover",
      structural: true,
      hint: "Intensify while the target below is hovered."
    },
    {
      key: "blend",
      kind: "select",
      label: "Blend",
      structural: true,
      options: [
        { value: "screen", label: "Screen" },
        { value: "normal", label: "Normal" },
        { value: "plus-lighter", label: "Add" }
      ]
    }
  ],
  props: [{ shape: "plate", label: "signal", attrs: { "data-hover": "true" } }],
  create: (cfg) => [
    Glitch({
      size: () => cfg.size,
      color: () => cfg.color,
      red: () => cfg.red,
      cyan: () => cfg.cyan,
      intensity: () => cfg.intensity,
      chaos: () => cfg.chaos,
      hoverBoost: cfg.hoverBoost,
      blend: cfg.blend
    })
  ]
});
