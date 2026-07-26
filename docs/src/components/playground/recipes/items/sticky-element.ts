import { Dot } from "@supermousejs/dot";
import { Stick } from "@supermousejs/stick";
import { SmartRing } from "@supermousejs/labs";
import { ICONS } from "@config/icons";
import { type PresetRecipe, call, obj } from "../types";

export const stickyElementRecipe: PresetRecipe = {
  id: "sticky-element",
  name: "Sticky Element",
  description: "The Ring cursor morphs to match the shape of the hovered element.",
  icon: ICONS.stick,
  schema: [
    {
      key: "padding",
      label: "Padding",
      type: "range",
      min: 0,
      max: 30,
      step: 1,
      defaultValue: 10,
      unit: "px"
    },
    { key: "color", label: "Ring Color", type: "color", defaultValue: "#000000" },
    {
      key: "hideDot",
      label: "Hide Dot",
      type: "toggle",
      defaultValue: true,
      description: "Fade out the center dot when sticking."
    }
  ],
  setup: (app, config) => {
    app.use(Stick({ padding: Number(config.padding) }));
    app.use(
      Dot({
        size: 8,
        color: config.color,
        hideOnShape: config.hideDot
      })
    );
    app.use(
      SmartRing({
        size: 30,
        color: config.color,
        enableSkew: true
      })
    );

    setTimeout(() => {
      const btns = document.querySelectorAll("button, [data-hover]");
      btns.forEach((b) => b.setAttribute("data-supermouse-stick", "true"));
    }, 50);
  },
  generateAST: (config) => ({
    imports: {
      "@supermousejs/stick": ["Stick"],
      "@supermousejs/dot": ["Dot"],
      "@supermousejs/labs": ["SmartRing"]
    },
    chain: [
      call("Stick", obj({ padding: config.padding })),
      call("Dot", obj({ size: 8, color: config.color, hideOnShape: config.hideDot })),
      call("SmartRing", obj({ size: 30, color: config.color, enableSkew: true }))
    ]
  })
};

export default stickyElementRecipe;
