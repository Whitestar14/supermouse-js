import { ASCII } from "@supermousejs/labs";
import { defineCursor, type CursorConfig } from "../types";

/**
 * The select carries a key; the plugin receives the characters. Keeping the
 * presets here rather than in the plugin means a cursor can use any string at
 * all, and the control schema stays a flat bag of values.
 */
const CHARSETS: Record<string, string> = {
  digits: "0123456789",
  blocks: "░▒▓█",
  punctuation: "·+*#%@",
  code: "<>/{}[]=+",
  kana: "アイウエオカキクケコ"
};

interface AsciiCfg extends CursorConfig {
  charset: string;
  size: number;
  spacing: number;
  color: string;
  fade: number;
  spread: number;
  tilt: number;
  react: boolean;
  blend: string;
}

export default defineCursor<AsciiCfg>({
  id: "ascii",
  chapter: "art",
  order: 230,
  name: "ASCII",
  tagline: "The path, transcribed — and evaporating as it is written.",
  plugins: ["ascii"],
  defaults: {
    charset: "digits",
    size: 14,
    spacing: 13,
    color: "#f59e0b",
    fade: 1.6,
    spread: 7,
    tilt: 12,
    react: true,
    blend: "normal"
  },
  controls: [
    {
      key: "charset",
      kind: "select",
      label: "Alphabet",
      options: [
        { value: "digits", label: "Digits" },
        { value: "blocks", label: "Blocks" },
        { value: "punctuation", label: "Punctuation" },
        { value: "code", label: "Brackets" },
        { value: "kana", label: "Katakana" }
      ]
    },
    { key: "size", kind: "range", label: "Glyph", min: 8, max: 40, unit: "px" },
    { key: "spacing", kind: "range", label: "Density", min: 5, max: 48, unit: "px" },
    { key: "color", kind: "color", label: "Ink" },
    {
      key: "fade",
      kind: "range",
      label: "Evaporation",
      min: 0.1,
      max: 6,
      step: 0.1,
      hint: "Alpha lost per second. Zero would never forget anything."
    },
    { key: "spread", kind: "range", label: "Scatter", min: 0, max: 24, unit: "px" },
    { key: "tilt", kind: "range", label: "Tilt", min: 0, max: 45, unit: "°" },
    {
      key: "react",
      kind: "toggle",
      label: "Spaced by speed",
      structural: true,
      hint: "Widen the interval with speed so a fast pass reads as data."
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
    ASCII({
      charset: () => CHARSETS[cfg.charset] ?? cfg.charset,
      size: () => cfg.size,
      spacing: () => cfg.spacing,
      color: () => cfg.color,
      fade: () => cfg.fade,
      spread: () => cfg.spread,
      tilt: () => cfg.tilt,
      react: cfg.react,
      blend: cfg.blend
    })
  ]
});
