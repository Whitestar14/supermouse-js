import { Pendulum } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface PendulumCfg extends CursorConfig {
  rod: number;
  bob: number;
  color: string;
  gravity: number;
  drag: number;
  entrance: number;
  hoverSize: number;
  blend: string;
}

export default defineCursor<PendulumCfg>({
  id: "pendulum",
  chapter: "motion",
  order: 320,
  name: "Pendulum",
  tagline: "A bob on a rigid rod, hinged at the pointer and left to physics.",
  plugins: ["pendulum"],
  defaults: {
    rod: 96,
    bob: 14,
    color: "#f59e0b",
    gravity: 2600,
    drag: 0.985,
    entrance: 0.4,
    hoverSize: 24,
    blend: "normal"
  },
  controls: [
    {
      key: "rod",
      kind: "range",
      label: "Rod",
      min: 20,
      max: 160,
      unit: "px",
      hint: "A constraint, not a spring: the bob cannot get closer or further."
    },
    { key: "bob", kind: "range", label: "Bob", min: 6, max: 40, unit: "px" },
    { key: "color", kind: "color", label: "Colour" },
    {
      key: "gravity",
      kind: "range",
      label: "Gravity",
      min: 400,
      max: 6000,
      step: 100,
      unit: "px/s²"
    },
    {
      key: "drag",
      kind: "range",
      label: "Air drag",
      min: 0.9,
      max: 0.999,
      step: 0.001,
      hint: "Energy kept per frame. Near 1 and the bob swings for a long time."
    },
    {
      key: "entrance",
      kind: "range",
      label: "Entrance",
      min: 0,
      max: 1,
      step: 0.05,
      hint: "How far off the vertical the bob is released when the cursor appears."
    },
    { key: "hoverSize", kind: "range", label: "Bob over target", min: 6, max: 64, unit: "px" },
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
  props: [{ shape: "disc", label: "hinge", attrs: { "data-hover": "true" } }],
  create: (cfg) => [
    Pendulum({
      rod: () => cfg.rod,
      bob: () => cfg.bob,
      color: () => cfg.color,
      gravity: () => cfg.gravity,
      drag: () => cfg.drag,
      entrance: () => cfg.entrance,
      hoverSize: () => cfg.hoverSize,
      blend: cfg.blend
    })
  ]
});
