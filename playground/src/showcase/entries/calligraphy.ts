import { Calligraphy } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface CalligraphyCfg extends CursorConfig {
  points: number;
  width: number;
  spring: number;
  friction: number;
  color: string;
  idle: boolean;
  idleRate: number;
  blend: string;
}

export default defineCursor<CalligraphyCfg>({
  id: "calligraphy",
  chapter: "art",
  order: 210,
  name: "Calligraphy",
  tagline: "A wet nib on a spring, swelling where the hand slows down.",
  plugins: ["calligraphy"],
  defaults: {
    points: 44,
    width: 7,
    spring: 0.4,
    friction: 0.5,
    color: "#f59e0b",
    idle: true,
    idleRate: 1,
    blend: "screen"
  },
  controls: [
    {
      key: "points",
      kind: "range",
      label: "Links",
      min: 8,
      max: 90,
      structural: true,
      hint: "The ribbon is a fixed chain, so its length is set at construction."
    },
    { key: "width", kind: "range", label: "Nib", min: 1, max: 24, step: 0.5, unit: "px" },
    {
      key: "spring",
      kind: "range",
      label: "Spring",
      min: 0.05,
      max: 1,
      step: 0.05,
      hint: "How hard each link is pulled toward the one ahead of it."
    },
    {
      key: "friction",
      kind: "range",
      label: "Friction",
      min: 0.2,
      max: 0.95,
      step: 0.05,
      hint: "Velocity each link keeps. Low is a heavy, draggy hand."
    },
    { key: "color", kind: "color", label: "Ink" },
    {
      key: "idle",
      kind: "toggle",
      label: "Sign while idle",
      structural: true,
      hint: "Draw a dormant signature before the pointer has moved."
    },
    { key: "idleRate", kind: "range", label: "Signature rate", min: 0.2, max: 3, step: 0.1 },
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
    Calligraphy({
      points: cfg.points,
      width: () => cfg.width,
      spring: () => cfg.spring,
      friction: () => cfg.friction,
      color: () => cfg.color,
      idle: cfg.idle,
      idleRate: () => cfg.idleRate,
      blend: cfg.blend
    })
  ]
});
