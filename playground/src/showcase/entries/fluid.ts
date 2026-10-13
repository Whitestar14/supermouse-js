import { Fluid } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface FluidCfg extends CursorConfig {
  resolution: number;
  color: string;
  force: number;
  swirl: number;
  fade: number;
  drag: number;
  iterations: number;
  ink: number;
  blend: string;
}

export default defineCursor<FluidCfg>({
  id: "fluid",
  chapter: "motion",
  order: 340,
  name: "Fluid",
  tagline: "An actual fluid: the pointer pushes a velocity field, and the dye goes with it.",
  plugins: ["fluid"],
  defaults: {
    resolution: 96,
    color: "#f59e0b",
    force: 1.1,
    swirl: 0.35,
    fade: 0.55,
    drag: 1.4,
    iterations: 12,
    ink: 0.28,
    blend: "screen"
  },
  controls: [
    {
      key: "resolution",
      kind: "range",
      label: "Grid",
      min: 32,
      max: 192,
      step: 8,
      unit: "cells",
      hint: "Simulation width. The height follows the frame, and the upscale is the blur."
    },
    { key: "color", kind: "color", label: "Dye" },
    {
      key: "force",
      kind: "range",
      label: "Push",
      min: 0.2,
      max: 3,
      step: 0.05,
      hint: "1 travels with the hand. Above that the fluid leads it."
    },
    {
      key: "swirl",
      kind: "range",
      label: "Swirl",
      min: 0,
      max: 1,
      step: 0.05,
      hint: "Rotational share of the push, so the dye curls on the way out."
    },
    {
      key: "fade",
      kind: "range",
      label: "Fade",
      min: 0.05,
      max: 3,
      step: 0.05,
      hint: "Dye lost per second. The control that keeps the stage from silting up."
    },
    {
      key: "drag",
      kind: "range",
      label: "Viscosity",
      min: 0,
      max: 5,
      step: 0.1,
      hint: "Velocity lost per second. High and the flow dies the moment you stop."
    },
    {
      key: "iterations",
      kind: "range",
      label: "Pressure solve",
      min: 0,
      max: 30,
      hint: "Iterations of the projection. Zero leaves the flow compressing into itself."
    },
    {
      key: "ink",
      kind: "range",
      label: "Ink",
      min: 0.05,
      max: 1,
      step: 0.01,
      hint: "Dye laid down per frame at the pointer."
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
    Fluid({
      resolution: () => cfg.resolution,
      color: () => cfg.color,
      force: () => cfg.force,
      swirl: () => cfg.swirl,
      fade: () => cfg.fade,
      drag: () => cfg.drag,
      iterations: () => cfg.iterations,
      ink: () => cfg.ink,
      blend: cfg.blend
    })
  ]
});
