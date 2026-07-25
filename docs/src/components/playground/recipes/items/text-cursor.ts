import { Dot } from "@supermousejs/dot";
import { Text } from "@supermousejs/text";
import { ICONS } from "@config/icons";
import { type PresetRecipe, call, obj, arr } from "../types";

export const textCursorRecipe: PresetRecipe = {
  id: "text-cursor",
  name: "Context Label",
  description: "Displays a label next to the cursor when hovering elements.",
  icon: ICONS.context,
  schema: [
    {
      key: "offsetY",
      label: "Vertical Offset",
      type: "range",
      min: 10,
      max: 50,
      defaultValue: 24,
      unit: "px"
    }
  ],
  setup: (app, config) => {
    app.use(Dot({ size: 8, color: "#000000" }));
    app.use(
      Text({
        offset: [0, config.offsetY],
        duration: 200
      })
    );
  },
  generateAST: (config) => ({
    imports: {
      "@supermousejs/dot": ["Dot"],
      "@supermousejs/text": ["Text"]
    },
    chain: [
      call("Dot", obj({ size: 8, color: "#000000" })),
      call("Text", obj({ offset: arr([0, config.offsetY]) }))
    ]
  })
};

export default textCursorRecipe;
