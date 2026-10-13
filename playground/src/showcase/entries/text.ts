import { Text } from "@supermousejs/text";
import { Dot } from "@supermousejs/dot";
import { defineCursor, type CursorConfig } from "../types";

interface TextCfg extends CursorConfig {
  duration: number;
  offset: string;
}

export default defineCursor<TextCfg>({
  id: "text",
  chapter: "core",
  order: 70,
  name: "Text",
  tagline: "The cursor reads the label before you click it.",
  plugins: ["dot", "text"],
  defaults: {
    duration: 160,
    offset: "28,28"
  },
  controls: [
    {
      key: "duration",
      kind: "range",
      label: "Fade",
      min: 0,
      max: 600,
      unit: "ms",
      structural: true
    },
    {
      key: "offset",
      kind: "select",
      label: "Offset",
      structural: true,
      hint: "Where the label sits relative to the pointer.",
      options: [
        { value: "28,28", label: "Below right" },
        { value: "-28,28", label: "Below left" },
        { value: "28,-28", label: "Above right" }
      ]
    }
  ],
  props: [
    {
      shape: "plate",
      label: "read",
      attrs: { "data-supermouse-text": "Release notes", "data-hover": "true" }
    }
  ],
  create: (cfg) => [
    Dot({ size: 6, color: "#f59e0b" }),
    Text({
      duration: cfg.duration,
      offset: cfg.offset.split(",").map(Number) as [number, number],
      className: "showcase-tip"
    })
  ]
});
