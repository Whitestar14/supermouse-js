import { MotionBlur } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface MotionBlurCfg extends CursorConfig {
  size: number;
  color: string;
  intensity: number;
  maxSpread: number;
  stretch: boolean;
  blend: string;
}

export default defineCursor<MotionBlurCfg>({
  id: "motion-blur",
  chapter: "optics",
  order: 130,
  name: "Motion Blur",
  tagline: "Legible at rest, a streak the moment it moves. With the shutter open.",
  plugins: ["motion-blur"],
  defaults: {
    size: 12,
    color: "#f2f2f4",
    intensity: 26,
    maxSpread: 40,
    stretch: true,
    blend: "screen"
  },
  controls: [
    { key: "size", kind: "range", label: "Head", min: 4, max: 40, unit: "px" },
    { key: "color", kind: "color", label: "Colour" },
    {
      key: "intensity",
      kind: "range",
      label: "Shutter",
      min: 0,
      max: 90,
      step: 1,
      unit: "px",
      hint: "Blur in pixels at 1000px/s of travel. A brisk sweep is about that fast."
    },
    { key: "maxSpread", kind: "range", label: "Ceiling", min: 4, max: 140, unit: "px" },
    {
      key: "stretch",
      kind: "toggle",
      label: "Stretch the head",
      structural: true,
      hint: "Widen the head along the axis of travel."
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
  create: (cfg) => [
    MotionBlur({
      size: () => cfg.size,
      color: () => cfg.color,
      intensity: () => cfg.intensity,
      maxSpread: () => cfg.maxSpread,
      stretch: cfg.stretch,
      blend: cfg.blend
    })
  ]
});
