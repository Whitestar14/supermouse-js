import { Pixel } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface PixelCfg extends CursorConfig {
  sprite: string;
  cell: number;
  snap: number;
  primary: string;
  secondary: string;
  flip: boolean;
  blend: string;
}

export default defineCursor<PixelCfg>({
  id: "pixel",
  chapter: "art",
  order: 220,
  name: "Pixel",
  tagline: "Eight by eight, scaled without a single soft edge.",
  plugins: ["pixel"],
  defaults: {
    sprite: "arrow",
    cell: 8,
    snap: 0,
    primary: "#f59e0b",
    secondary: "#08080a",
    flip: true,
    blend: "normal"
  },
  controls: [
    {
      key: "sprite",
      kind: "select",
      label: "Sprite",
      options: [
        { value: "arrow", label: "Arrow" },
        { value: "heart", label: "Heart" },
        { value: "star", label: "Star" },
        { value: "ghost", label: "Ghost" }
      ]
    },
    {
      key: "cell",
      kind: "range",
      label: "Pixel",
      min: 2,
      max: 24,
      unit: "px",
      hint: "Size of one sprite pixel, rounded to a whole number."
    },
    {
      key: "snap",
      kind: "range",
      label: "Snap",
      min: 0,
      max: 64,
      step: 2,
      unit: "px",
      hint: "Grid the position lands on. Zero leaves the cursor free."
    },
    { key: "primary", kind: "color", label: "Ink" },
    { key: "secondary", kind: "color", label: "Detail" },
    {
      key: "flip",
      kind: "toggle",
      label: "Face the direction",
      structural: true,
      hint: "Mirror the sprite when travelling left."
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
  create: (cfg) => [
    Pixel({
      sprite: () => cfg.sprite,
      cell: () => cfg.cell,
      snap: () => cfg.snap,
      primary: () => cfg.primary,
      secondary: () => cfg.secondary,
      flip: cfg.flip,
      blend: cfg.blend
    })
  ]
});
