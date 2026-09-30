import { definePlugin } from "@supermousejs/utils";

export interface StatesOptions {
  name?: string;
  isEnabled?: boolean;
  /** Plugins active when no state attribute is hovered. */
  default: string[];
  /** Map of state names to plugin names to enable. */
  states: Record<string, string[]>;
  /** Attribute that triggers a state change. */
  attribute?: string;
}

/**
 * State machine plugin.
 *
 * Hovers over `[data-supermouse-state="foo"]` enable the plugin list
 * registered for `"foo"`. Everything else falls back to `default`.
 *
 * States re-evaluates every frame, so it can be installed at any point in
 * the plugin registration order. Managed plugins installed after States
 * are picked up on the next frame.
 *
 * States is authoritative for `isEnabled` on the plugins it manages.
 * Manually calling `app.enablePlugin()` or `app.disablePlugin()` on a
 * managed plugin will be reverted on the next frame if it disagrees with
 * the current state.
 */
export const States = (options: StatesOptions) => {
  const attr = options.attribute ?? "data-supermouse-state";
  const defaultSet = new Set(options.default);

  const managed = new Set<string>();
  Object.values(options.states).forEach((list) => list.forEach((p) => managed.add(p)));
  options.default.forEach((p) => managed.add(p));

  return definePlugin(
    {
      name: "states",
      priority: -999,

      install(app) {
        app.addHoverSelectors(`[${attr}]`);
      },

      update(app) {
        const target = app.state.hoverTarget;
        let nextState = "default";

        if (target) {
          const stateEl = target.closest(`[${attr}]`);
          if (stateEl) {
            const val = stateEl.getAttribute(attr);
            if (val && options.states[val]) nextState = val;
          }
        }

        const active = nextState === "default" ? options.default : options.states[nextState];

        for (const name of managed) {
          const plugin = app.getPlugin(name);
          if (!plugin) continue;

          const shouldBe = active.includes(name);
          const isEnabled = plugin.isEnabled !== false;

          if (shouldBe && !isEnabled) app.enablePlugin(name);
          if (!shouldBe && isEnabled) app.disablePlugin(name);
        }
      },

      destroy(app) {
        for (const name of managed) {
          const plugin = app.getPlugin(name);
          if (!plugin) continue;
          if (defaultSet.has(name) && plugin.isEnabled === false) {
            app.enablePlugin(name);
          }
        }
      }
    },
    options
  );
};
