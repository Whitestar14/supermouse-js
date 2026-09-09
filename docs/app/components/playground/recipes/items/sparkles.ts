import { Dot } from "@supermousejs/dot";
import { Sparkles } from "@supermousejs/labs";
import { ICONS } from "@config/icons";
import { type PresetRecipe, call, obj } from "../types";

export const sparklesRecipe: PresetRecipe = {
  id: "sparkles",
  name: "Fairy Dust",
  description: "Emits particles while moving. Magical.",
  icon: ICONS.trail,
  schema: [
    { key: "color", label: "Sparkle Color", type: "color", defaultValue: "#fbbf24" },
    {
      key: "velocity",
      label: "Min Speed",
      type: "range",
      min: 0,
      max: 50,
      defaultValue: 10,
      unit: "px/f",
      description: "Speed required to spawn"
    }
  ],
  setup: (app, config) => {
    app.use(Dot({ size: 8, color: () => config.color }));
    app.use(
      Sparkles({
        color: () => config.color,
        frequency: config.velocity
      })
    );
  },
  generateAST: (config) => ({
    imports: {
      "@supermousejs/dot": ["Dot"],
      "@supermousejs/labs": ["Sparkles"]
    },
    chain: [
      call("Dot", obj({ size: 8, color: config.color })),
      call("Sparkles", obj({ color: config.color, frequency: config.velocity }))
    ]
  })
};

export default sparklesRecipe;
