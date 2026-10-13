import { Blob } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface BlobCfg extends CursorConfig {
  size: number;
  color: string;
  rim: string;
  points: number;
  squash: number;
  wobble: number;
  spring: number;
  drag: number;
  hoverSize: number;
  blend: string;
}

export default defineCursor<BlobCfg>({
  id: "blob",
  chapter: "motion",
  order: 300,
  name: "Blob",
  tagline: "A body with mass: it stretches into the move and rings when it is struck.",
  plugins: ["blob"],
  defaults: {
    size: 64,
    color: "#f59e0b",
    rim: "#ffffff",
    points: 14,
    squash: 0.7,
    wobble: 0.6,
    spring: 0.22,
    drag: 0.86,
    hoverSize: 88,
    blend: "normal"
  },
  controls: [
    { key: "size", kind: "range", label: "Diameter", min: 16, max: 160, unit: "px" },
    { key: "color", kind: "color", label: "Body" },
    {
      key: "rim",
      kind: "color",
      label: "Rim",
      allowTransparent: true,
      hint: "Outline stroke. ∅ leaves a bare silhouette."
    },
    {
      key: "points",
      kind: "range",
      label: "Detail",
      min: 6,
      max: 32,
      hint: "Points around the outline. Fewer is lumpier, more is rounder."
    },
    {
      key: "squash",
      kind: "range",
      label: "Stretch",
      min: 0,
      max: 1,
      step: 0.05,
      hint: "How far travel pulls the leading edge out."
    },
    {
      key: "wobble",
      kind: "range",
      label: "Breathing",
      min: 0,
      max: 1,
      step: 0.05,
      hint: "Idle ripple, so the body is never perfectly still."
    },
    {
      key: "spring",
      kind: "range",
      label: "Spring",
      min: 0.05,
      max: 0.6,
      step: 0.01,
      hint: "How hard the outline is pulled back to its rest radius."
    },
    {
      key: "drag",
      kind: "range",
      label: "Damping",
      min: 0.5,
      max: 0.98,
      step: 0.01,
      hint: "Radius kept per frame. Low rings for longer after a press."
    },
    { key: "hoverSize", kind: "range", label: "Swollen to", min: 16, max: 200, unit: "px" },
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
  props: [{ shape: "disc", label: "mass", attrs: { "data-hover": "true" } }],
  create: (cfg) => [
    Blob({
      size: () => cfg.size,
      color: () => cfg.color,
      rim: () => cfg.rim,
      points: () => cfg.points,
      squash: () => cfg.squash,
      wobble: () => cfg.wobble,
      spring: () => cfg.spring,
      drag: () => cfg.drag,
      hoverSize: () => cfg.hoverSize,
      blend: cfg.blend
    })
  ]
});
