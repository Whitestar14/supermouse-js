import type { ValueOrGetter } from '@supermousejs/core';
import { definePlugin, normalize, math } from '@supermousejs/utils';

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

  const getAttraction = normalize(options.attraction, 0.3);
  const getDistance = normalize(options.distance, 100);

  return definePlugin({
    name: "magnetic",
    priority: -10,

    install(app) {
      app.registerHoverTarget("[data-supermouse-magnetic]");
    },

    update(app) {
      const target = app.state.hoverTarget;
      const val = app.state.interaction.magnetic;
      const isMagnetic = val === true || val === 'true' || (typeof val === 'number' && val > 0);

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
        const range = getDistance(app.state);

        if (dist < range) {
          const attraction = typeof val === 'number' ? val : getAttraction(app.state);
          app.state.target.x = math.lerp(x, magnetCenter.x, attraction);
          app.state.target.y = math.lerp(y, magnetCenter.y, attraction);
        }
      }
    },
  }, options);
};