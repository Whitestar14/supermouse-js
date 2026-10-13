import { TextRing } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

interface TextRingCfg extends CursorConfig {
  text: string;
  radius: number;
  fontSize: number;
  speed: number;
  color: string;
  spread: boolean;
}

export default defineCursor<TextRingCfg>({
  id: "text-ring",
  chapter: "core",
  order: 100,
  name: "TextRing",
  tagline: "A sentence that refuses to sit still.",
  plugins: ["text-ring"],
  defaults: {
    text: "SUPERMOUSE • MODULAR CURSOR SYSTEM • ",
    radius: 64,
    fontSize: 10,
    speed: 36,
    color: "#fafafa",
    spread: false
  },
  controls: [
    { key: "text", kind: "text", label: "Text", structural: true },
    { key: "radius", kind: "range", label: "Radius", min: 24, max: 160, unit: "px" },
    {
      key: "fontSize",
      kind: "range",
      label: "Type size",
      min: 6,
      max: 24,
      unit: "px",
      structural: true
    },
    {
      key: "speed",
      kind: "range",
      label: "Speed",
      min: -120,
      max: 120,
      unit: "°/s",
      structural: true
    },
    { key: "color", kind: "color", label: "Colour" },
    {
      key: "spread",
      kind: "toggle",
      label: "Spread to fit",
      structural: true,
      hint: "Distribute glyphs around the whole circle instead of their natural width."
    }
  ],
  create: (cfg) => [
    TextRing({
      text: cfg.text,
      radius: () => cfg.radius,
      fontSize: cfg.fontSize,
      speed: cfg.speed,
      color: () => cfg.color,
      spread: cfg.spread
    })
  ]
});
