import { Spring } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface SpringCfg extends CursorConfig {
  size: number;
  color: string;
  frequency: number;
  damping: number;
  squash: number;
  hoverSize: number;
  showTarget: boolean;
  blend: string;
}

export default defineCursor<SpringCfg>({
  id: "spring",
  chapter: "motion",
  order: 310,
  name: "Spring",
  tagline: "Smoothing as a physical system: a frequency to travel at, a ratio to settle by.",
  plugins: ["spring"],
  defaults: {
    size: 16,
    color: "#f59e0b",
    frequency: 3.2,
    damping: 0.75,
    squash: 0.5,
    hoverSize: 26,
    showTarget: true,
    blend: "normal"
  },
  controls: [
    { key: "size", kind: "range", label: "Diameter", min: 6, max: 64, unit: "px" },
    { key: "color", kind: "color", label: "Colour" },
    {
      key: "frequency",
      kind: "range",
      label: "Frequency",
      min: 0.5,
      max: 10,
      step: 0.1,
      unit: "Hz",
      hint: "How fast the body wants to arrive. Low is a heavy float."
    },
    {
      key: "damping",
      kind: "range",
      label: "Damping ratio",
      min: 0.1,
      max: 2,
      step: 0.05,
      hint: "1 arrives clean. Below 1 it overshoots and rings; above 1 creeps."
    },
    {
      key: "squash",
      kind: "range",
      label: "Squash",
      min: 0,
      max: 1,
      step: 0.05,
      hint: "Stretch along the momentum the body is carrying."
    },
    { key: "hoverSize", kind: "range", label: "Grows to", min: 6, max: 96, unit: "px" },
    {
      key: "showTarget",
      kind: "toggle",
      label: "Show the pointer",
      structural: true,
      hint: "A hairline at the raw pointer, so the lag can be seen."
    },
    {
      key: "blend",
      kind: "select",
      label: "Blend",
      structural: true,
      options: [
        { value: "normal", label: "Normal" },
        { value: "screen", label: "Screen" },
        { value: "difference", label: "Difference" }
      ]
    }
  ],
  props: [{ shape: "disc", label: "target", attrs: { "data-hover": "true" } }],
  create: (cfg) => [
    Spring({
      size: () => cfg.size,
      color: () => cfg.color,
      frequency: () => cfg.frequency,
      damping: () => cfg.damping,
      squash: () => cfg.squash,
      hoverSize: () => cfg.hoverSize,
      showTarget: cfg.showTarget,
      blend: cfg.blend
    })
  ]
});
