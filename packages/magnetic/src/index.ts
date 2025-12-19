import {
  type SupermousePlugin,
  math,
  resolve,
  type ValueOrGetter,
} from "@supermousejs/core";

export interface MagneticOptions {
  /**
   * Strength of the attraction (0 to 1).
   * Higher = stiffer attraction.
   * @default 0.3
   */
  attraction?: ValueOrGetter<number>;

  /**
   * The distance (in pixels) from the center at which the magnetism activates.
   * @default 100
   */
  distance?: ValueOrGetter<number>;
}

export const Magnetic = (options: MagneticOptions = {}): SupermousePlugin => {
  let lastTarget: HTMLElement | null = null;
  let magnetCenter = { x: 0, y: 0 };
  let isActive = false;

  return {
    name: "magnetic",
    isEnabled: true,

    install(app) {
      // Register the attribute so the Core Input system tracks hover for these elements
      app.registerHoverTarget("[data-supermouse-magnetic]");
    },

    update(app) {
      const target = app.state.hoverTarget;
      const isMagnetic = target?.hasAttribute("data-supermouse-magnetic");

      // 1. Detect Hover Entry (The only time we touch the DOM)
      if (isMagnetic && target !== lastTarget) {
        lastTarget = target!;
        const rect = target!.getBoundingClientRect();

        // Cache the center point relative to the viewport
        magnetCenter.x = rect.left + rect.width / 2;
        magnetCenter.y = rect.top + rect.height / 2;
        isActive = true;
      }
      // 2. Detect Hover Exit
      else if (!isMagnetic && lastTarget) {
        lastTarget = null;
        isActive = false;
      }

      // 3. Apply Physics (Pure Math - No DOM reads)
      if (isActive && lastTarget) {
        const { x, y } = app.state.pointer;

        // Calculate distance from cursor to element center
        const dist = math.dist(x, y, magnetCenter.x, magnetCenter.y);
        const range = resolve(options.distance, app.state, 100);

        if (dist < range) {
          const attraction = resolve(options.attraction, app.state, 0.3);

          // Modify the global target.
          // All other plugins (Dot, Ring) listen to this, so they will "stick" too.
          app.state.target.x = math.lerp(x, magnetCenter.x, attraction);
          app.state.target.y = math.lerp(y, magnetCenter.y, attraction);
        }
      }
    },
  };
};
