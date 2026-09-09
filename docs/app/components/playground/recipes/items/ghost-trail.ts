import { Dot } from "@supermousejs/dot";
import { Trail } from "@supermousejs/trail";
import { SmartRing } from "@supermousejs/labs";
import { ICONS } from "@config/icons";
import { type PresetRecipe, call, obj } from "../types";

export const ghostTrailRecipe: PresetRecipe = {
  id: "ghost-trail",
  name: "Ghost Trail",
  description: "A high-latency trail effect using transparency.",
  icon: ICONS.ghost,
  schema: [
    { key: "size", label: "Size", type: "range", min: 10, max: 50, defaultValue: 20, unit: "px" },
    { key: "color", label: "Color", type: "color", defaultValue: "#6366f1" },
    {
      key: "opacity",
      label: "Opacity",
      type: "range",
      min: 0.1,
      max: 1,
      step: 0.1,
      defaultValue: 0.5
    }
  ],
  setup: (app, config) => {
    app.use(Dot({ size: 4, color: () => config.color }));
    app.use(
      SmartRing({
        size: () => config.size,
        color: () => config.color,
        mixBlendMode: "normal",
        enableSkew: true
      })
    );
    app.use(
      Trail({
        length: 15,
        size: () => config.size,
        color: () => config.color,
        isEnabled: true
      })
    );
  },
  generateAST: (config) => ({
    imports: {
      "@supermousejs/dot": ["Dot"],
      "@supermousejs/labs": ["SmartRing"],
      "@supermousejs/trail": ["Trail"]
    },
    chain: [
      call("Dot", obj({ size: 4, color: config.color })),
      call("SmartRing", obj({ size: config.size, color: config.color, mixBlendMode: "normal" })),
      call("Trail", obj({ length: 15, size: config.size, color: config.color, isEnabled: true }))
    ]
  })
};

export default ghostTrailRecipe;
