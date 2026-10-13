import { Reflection } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface ReflectionCfg extends CursorConfig {
  axis: string;
  size: number;
  color: string;
  opacity: number;
  lines: boolean;
  blur: number;
  blend: string;
}

export default defineCursor<ReflectionCfg>({
  id: "reflection",
  chapter: "art",
  order: 250,
  name: "Reflection",
  tagline: "A cursor with a likeness, moving the way a mirror would move it.",
  plugins: ["reflection"],
  defaults: {
    axis: "x",
    size: 10,
    color: "#f59e0b",
    opacity: 0.55,
    lines: true,
    blur: 0,
    blend: "difference"
  },
  controls: [
    {
      key: "axis",
      kind: "select",
      label: "Mirror",
      options: [
        { value: "x", label: "Vertical" },
        { value: "y", label: "Horizontal" },
        { value: "both", label: "Both (+ corner)" }
      ]
    },
    { key: "size", kind: "range", label: "Diameter", min: 4, max: 48, unit: "px" },
    { key: "color", kind: "color", label: "Colour" },
    { key: "opacity", kind: "range", label: "Opacity", min: 0.1, max: 1, step: 0.05 },
    {
      key: "blur",
      kind: "range",
      label: "Blur",
      min: 0,
      max: 8,
      step: 0.5,
      unit: "px",
      hint: "Soften the likeness so it cannot be mistaken for a second cursor."
    },
    {
      key: "lines",
      kind: "toggle",
      label: "Draw the mirror",
      structural: true,
      hint: "A hairline on the axis being reflected across."
    },
    {
      key: "blend",
      kind: "select",
      label: "Blend",
      structural: true,
      options: [
        { value: "difference", label: "Difference" },
        { value: "screen", label: "Screen" },
        { value: "normal", label: "Normal" }
      ]
    }
  ],
  create: (cfg) => [
    Reflection({
      axis: () => cfg.axis,
      size: () => cfg.size,
      color: () => cfg.color,
      opacity: () => cfg.opacity,
      lines: cfg.lines,
      blur: () => cfg.blur,
      blend: cfg.blend
    })
  ]
});
