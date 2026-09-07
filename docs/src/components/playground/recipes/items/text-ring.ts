import { Dot } from "@supermousejs/dot";
import { TextRing } from "@supermousejs/labs";
import { ICONS } from "@config/icons";
import { type PresetRecipe, call, obj } from "../types";

export const textRingRecipe: PresetRecipe = {
  id: "text-ring",
  name: "Text Ring",
  description: "Rotates a text message around your cursor.",
  icon: ICONS.text,
  schema: [
    { key: "text", label: "Message", type: "text", defaultValue: "SUPERMOUSE • V2 • " },
    {
      key: "radius",
      label: "Radius",
      type: "range",
      min: 20,
      max: 100,
      defaultValue: 60,
      unit: "px"
    },
    {
      key: "spread",
      label: "Auto-Fit (Spread)",
      type: "toggle",
      defaultValue: false,
      description: "Evenly distributes text along the circle."
    },
    {
      key: "speed",
      label: "Speed",
      type: "range",
      min: -5,
      max: 5,
      step: 0.1,
      defaultValue: 0.5,
      unit: "deg/f"
    },
    {
      key: "fontSize",
      label: "Font Size",
      type: "range",
      min: 8,
      max: 32,
      defaultValue: 12,
      unit: "px"
    },
    { key: "color", label: "Color", type: "color", defaultValue: "#000000" }
  ],
  setup: (app, config) => {
    app.use(Dot({ size: 6, color: () => config.color }));
    app.use(
      TextRing({
        text: () => config.text,
        radius: () => config.radius,
        fontSize: () => config.fontSize,
        speed: () => config.speed,
        color: () => config.color,
        spread: config.spread
      })
    );
  },
  generateAST: (config) => ({
    imports: {
      "@supermousejs/dot": ["Dot"],
      "@supermousejs/labs": ["TextRing"]
    },
    chain: [
      call("Dot", obj({ size: 6, color: config.color })),
      call(
        "TextRing",
        obj({
          text: config.text,
          radius: config.radius,
          spread: config.spread,
          speed: config.speed,
          fontSize: config.fontSize,
          color: config.color
        })
      )
    ]
  })
};

export default textRingRecipe;
