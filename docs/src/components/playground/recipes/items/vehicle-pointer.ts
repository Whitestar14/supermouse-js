import { Pointer } from "@supermousejs/pointer";
import { ICONS } from "@config/icons";
import { POINTER_SVG } from "../constants";
import { type PresetRecipe, call, obj, id } from "../types";

export const vehiclePointerRecipe: PresetRecipe = {
  id: "vehicle-pointer",
  name: "Vehicle Pointer",
  description: "A brutalist arrow that rotates based on velocity.",
  icon: ICONS.pointer,
  schema: [
    { key: "size", label: "Size", type: "range", min: 16, max: 64, defaultValue: 32, unit: "px" },
    { key: "color", label: "Color", type: "color", defaultValue: "#000000" },
    {
      key: "restingAngle",
      label: "Rest Angle",
      type: "range",
      min: -180,
      max: 180,
      defaultValue: -45,
      unit: "deg",
      description: "Angle when stopped"
    },
    {
      key: "returnToRest",
      label: "Return to Rest",
      type: "toggle",
      defaultValue: true,
      description: "Snap back to rest angle when stopped"
    },
    {
      key: "restDelay",
      label: "Rest Delay",
      type: "range",
      min: 0,
      max: 2000,
      step: 50,
      defaultValue: 200,
      unit: "ms",
      description: "Wait time before resetting"
    }
  ],
  setup: (app, config) => {
    app.use(
      Pointer({
        size: () => config.size,
        color: () => config.color,
        restingAngle: () => config.restingAngle,
        returnToRest: () => config.returnToRest,
        restDelay: () => config.restDelay,
        svg: POINTER_SVG
      })
    );
  },
  generateAST: (config) => ({
    imports: {
      "@supermousejs/pointer": ["Pointer"]
    },
    chain: [
      call(
        "Pointer",
        obj({
          size: config.size,
          color: config.color,
          restingAngle: config.restingAngle,
          returnToRest: config.returnToRest,
          restDelay: config.restDelay,
          svg: id("POINTER_SVG")
        })
      )
    ]
  })
};

export default vehiclePointerRecipe;
