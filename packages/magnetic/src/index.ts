import {
  definePlugin,
  math,
  resolve,
  type ValueOrGetter,
} from "@supermousejs/core";

export interface MagneticOptions {
  name?: string;
  isEnabled?: boolean;
  attraction?: ValueOrGetter<number>;
  distance?: ValueOrGetter<number>;
}

export const Magnetic = (options: MagneticOptions = {}) => {
  let lastTarget: HTMLElement | null = null;
  let magnetCenter = { x: 0, y: 0 };
  let isActive = false;

  return definePlugin({
    name: "magnetic",
    priority: -10,

    install(app) {
      app.registerHoverTarget("[data-supermouse-magnetic]");
    },

    update(app) {
      const target = app.state.hoverTarget;
      const isMagnetic = target?.hasAttribute("data-supermouse-magnetic");

      if (isMagnetic && target !== lastTarget) {
        lastTarget = target!;
        const rect = target!.getBoundingClientRect();
        magnetCenter.x = rect.left + rect.width / 2;
        magnetCenter.y = rect.top + rect.height / 2;
        isActive = true;
      }
      else if (!isMagnetic && lastTarget) {
        lastTarget = null;
        isActive = false;
      }

      if (isActive && lastTarget) {
        const { x, y } = app.state.pointer;
        const dist = math.dist(x, y, magnetCenter.x, magnetCenter.y);
        const range = resolve(options.distance, app.state, 100);

        if (dist < range) {
          const attraction = resolve(options.attraction, app.state, 0.3);
          app.state.target.x = math.lerp(x, magnetCenter.x, attraction);
          app.state.target.y = math.lerp(y, magnetCenter.y, attraction);
        }
      }
    },
  }, options);
};