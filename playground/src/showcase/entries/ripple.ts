import { Ripple } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface RippleCfg extends CursorConfig {
  size: number;
  color: string;
  count: number;
  duration: number;
  thickness: number;
  hold: boolean;
  interval: number;
  spacing: number;
  blend: string;
}

export default defineCursor<RippleCfg>({
  id: "ripple",
  chapter: "optics",
  order: 160,
  name: "Ripple",
  tagline: "A struck surface, carrying rings away from the point of contact.",
  plugins: ["ripple"],
  defaults: {
    size: 96,
    color: "#f2f2f4",
    count: 10,
    duration: 900,
    thickness: 2,
    hold: true,
    interval: 260,
    spacing: 260,
    blend: "screen"
  },
  controls: [
    { key: "size", kind: "range", label: "Reach", min: 20, max: 260, unit: "px" },
    { key: "color", kind: "color", label: "Colour" },
    { key: "count", kind: "range", label: "Pool", min: 3, max: 24, structural: true },
    {
      key: "duration",
      kind: "range",
      label: "Lifetime",
      min: 300,
      max: 2400,
      step: 100,
      unit: "ms"
    },
    { key: "thickness", kind: "range", label: "Weight", min: 0.5, max: 8, step: 0.5, unit: "px" },
    {
      key: "hold",
      kind: "toggle",
      label: "Sustain",
      structural: true,
      hint: "Keep emitting rings while the button stays down."
    },
    {
      key: "interval",
      kind: "range",
      label: "Pulse",
      min: 80,
      max: 900,
      step: 20,
      unit: "ms",
      hint: "Gap between rings while sustained."
    },
    {
      key: "spacing",
      kind: "range",
      label: "Drag rings",
      min: 40,
      max: 600,
      step: 20,
      unit: "px",
      hint: "Travel between rings while dragging."
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
    Ripple({
      size: () => cfg.size,
      color: () => cfg.color,
      count: cfg.count,
      duration: () => cfg.duration,
      thickness: () => cfg.thickness,
      hold: cfg.hold,
      interval: () => cfg.interval,
      spacing: () => cfg.spacing,
      blend: cfg.blend
    })
  ]
});
