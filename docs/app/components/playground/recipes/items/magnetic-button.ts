import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { Magnetic } from "@supermousejs/magnetic";
import { ICONS } from "@config/icons";
import { type PresetRecipe, call, obj } from "../types";

export const magneticButtonRecipe: PresetRecipe = {
  id: "magnetic-button",
  name: "Magnetic Force",
  description: "Attracts the cursor to interactive elements using the Magnetic plugin.",
  icon: ICONS.magnetic,
  schema: [
    {
      key: "attraction",
      label: "Attraction",
      type: "range",
      min: 0.1,
      max: 1,
      step: 0.1,
      defaultValue: 0.4,
      description: "How strongly it sticks (0-1)"
    },
    {
      key: "distance",
      label: "Range",
      type: "range",
      min: 50,
      max: 200,
      step: 10,
      defaultValue: 120,
      unit: "px",
      description: "Capture radius"
    }
  ],
  plugins: (config) => [
    Magnetic({
      attraction: () => config.attraction,
      distance: () => config.distance
    }),
    Dot({ size: 8, color: "#000" }),
    Ring({ size: 30, color: "#000" })
  ],
  generateAST: (config) => ({
    imports: {
      "@supermousejs/magnetic": ["Magnetic"],
      "@supermousejs/dot": ["Dot"],
      "@supermousejs/ring": ["Ring"]
    },
    chain: [
      call("Magnetic", obj({ attraction: config.attraction, distance: config.distance })),
      call("Dot", obj({ size: 8, color: "#000000" })),
      call("Ring", obj({ size: 30, color: "#000000" }))
    ]
  })
};

export default magneticButtonRecipe;
