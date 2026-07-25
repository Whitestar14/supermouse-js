import { Dot } from "@supermousejs/dot";
import { ICONS } from "@config/icons";
import { type PresetRecipe, call, obj } from "../types";

export const basicDotRecipe: PresetRecipe = {
  id: "basic-dot",
  name: "Precision Dot",
  description: "The standard verified cursor. Minimalist and fast.",
  icon: ICONS.dot,
  schema: [
    {
      key: "size",
      label: "Size",
      type: "range",
      min: 4,
      max: 40,
      step: 1,
      defaultValue: 10,
      unit: "px",
      description: "Diameter in pixels"
    },
    { key: "color", label: "Color", type: "color", defaultValue: "#000000" },
    {
      key: "mixBlendMode",
      label: "Blend Mode",
      type: "select",
      options: ["normal", "difference", "exclusion"],
      defaultValue: "normal"
    }
  ],
  setup: (app, config) => {
    app.use(
      Dot({
        size: () => config.size,
        color: () => config.color,
        mixBlendMode: config.mixBlendMode
      })
    );
  },
  generateAST: (config) => ({
    imports: {
      "@supermousejs/dot": ["Dot"]
    },
    chain: [
      call(
        "Dot",
        obj({
          size: config.size,
          color: config.color,
          mixBlendMode: config.mixBlendMode !== "normal" ? config.mixBlendMode : undefined
        })
      )
    ]
  })
};

export default basicDotRecipe;
