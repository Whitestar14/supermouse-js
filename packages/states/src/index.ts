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
 * Install this **after** all plugins it manages, or initialization will
 * miss plugins that haven't been registered yet.
 */
export const States = (options: StatesOptions) => {
  const attr = options.attribute ?? "data-supermouse-state";
  const defaultSet = new Set(options.default);

  // Every plugin this instance ever touches
  const managed = new Set<string>();
  Object.values(options.states).forEach((list) => list.forEach((p) => managed.add(p)));
  options.default.forEach((p) => managed.add(p));

  let currentState = "__UNINITIALIZED__";

  return definePlugin(
    {
      name: "states",
      priority: -999,

      install(app) {
        app.registerHoverTarget(`[${attr}]`);
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

        if (nextState === currentState) return;

        const active = nextState === "default" ? options.default : options.states[nextState];

        for (const name of managed) {
          const plugin = app.getPlugin(name);
          if (!plugin) continue;

          const shouldBe = active.includes(name);
          const isEnabled = plugin.isEnabled !== false;

          if (shouldBe && !isEnabled) app.enablePlugin(name);
          if (!shouldBe && isEnabled) app.disablePlugin(name);
        }

        currentState = nextState;
      },

      destroy(app) {
        // Restore defaults on teardown so the app isn't left half-broken
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
