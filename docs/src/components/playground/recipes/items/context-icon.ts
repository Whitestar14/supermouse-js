import { SmartIcon } from "@supermousejs/labs";
import { ICONS } from "@config/icons";
import { ICON_SVGS } from "../constants";
import { type PresetRecipe, call, obj, id } from "../types";

export const contextIconRecipe: PresetRecipe = {
  id: "context-icon",
  name: "Context Icons",
  description: "Swaps SVG icons based on semantic tags (links, inputs) or custom attributes.",
  icon: ICONS.labs,
  schema: [
    { key: "size", label: "Size", type: "range", min: 16, max: 48, defaultValue: 24, unit: "px" },
    { key: "color", label: "Color", type: "color", defaultValue: "#000000" },
    {
      key: "transitionDuration",
      label: "Transition",
      type: "range",
      min: 0,
      max: 500,
      defaultValue: 200,
      unit: "ms",
      description: "Morph duration"
    },
    {
      key: "anchor",
      label: "Anchor Point",
      type: "select",
      options: ["center", "top-left"],
      defaultValue: "top-left",
      description: 'Align "Top Left" for arrows.'
    }
  ],
  setup: (app, config) => {
    app.options.ignoreOnNative = null;
    app.options.rules = {
      "a, button": { icon: "hand" },
      input: { icon: "text" }
    };

    app.use(
      SmartIcon({
        icons: ICON_SVGS,
        size: () => config.size,
        color: () => config.color,
        transitionDuration: config.transitionDuration,
        anchor: () => config.anchor
      })
    );
  },
  generateAST: (config) => ({
    imports: {
      "@supermousejs/labs": ["SmartIcon"]
    },
    coreOptions: {
      ignoreOnNative: null,
      rules: obj({
        "a, button": obj({ icon: "hand" }),
        input: obj({ icon: "text" })
      })
    },
    preStatements: [
      "const icons = {\n  default: `<svg>...</svg>`,\n  hand: `<svg>...</svg>`,\n  text: `<svg>...</svg>`\n};\n"
    ],
    chain: [
      call(
        "SmartIcon",
        obj({
          icons: id("icons"),
          size: config.size,
          color: config.color,
          transitionDuration: config.transitionDuration,
          anchor: config.anchor
        })
      )
    ]
  })
};

export default contextIconRecipe;
