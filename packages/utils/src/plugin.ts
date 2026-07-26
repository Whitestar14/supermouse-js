import type { SupermouseInstance, SupermousePlugin } from "@supermousejs/core";

/** Options that can be passed to any plugin factory. */
export interface BasePluginOptions {
  /** Overrides the plugin's internal name. */
  name?: string;
  /** Whether the plugin starts enabled. Defaults to `true`. */
  isEnabled?: boolean;
}

// ─── Config types ───

interface CoreConfig {
  /** Unique identifier. Used by `getPlugin()`, `enablePlugin()`, etc. */
  name: string;
  /**
   * Execution order in the frame loop. Lower = earlier.
   *
   * - **Logic plugins** (mutate `state.target`) should use negative values,
   *   typically `-10` or lower.
   * - **Visual plugins** (read `state.smooth`, touch the DOM) should use
   *   `0` or positive values.
   */
  priority?: number;
  /** Whether the plugin starts enabled. Defaults to `true`. */
  isEnabled?: boolean;
  /**
   * Called once when the plugin is registered via `app.use()`.
   * The stage container is already mounted at this point.
   */
  install?(app: SupermouseInstance): void;
}

/**
 * Declarative config for a **logic** plugin.
 *
 * Logic plugins modify cursor intent (e.g. magnetism, snapping, gravity).
 * They must **not** touch the DOM.
 *
 * @example
 * ```ts
 * const Gravity = definePlugin({
 *   name: "gravity",
 *   priority: -10,
 *   update(app, dt) {
 *     if (!app.state.hasReceivedInput) return;
 *     app.state.target.y += 5;
 *   },
 * });
 * ```
 */
export interface LogicConfig extends CoreConfig {
  /**
   * Called every frame while the plugin is enabled.
   * @param app       The Supermouse instance.
   * @param deltaTime Elapsed time since last frame, in **milliseconds**.
   */
  update?(app: SupermouseInstance, deltaTime: number): void;
  /** Called when the plugin is removed or the app is destroyed. */
  destroy?(app: SupermouseInstance): void;
  /** Called when `app.enablePlugin(name)` is invoked. */
  onEnable?(app: SupermouseInstance): void;
  /** Called when `app.disablePlugin(name)` is invoked. */
  onDisable?(app: SupermouseInstance): void;
}

/**
 * Declarative config for a **visual** plugin.
 *
 * Visual plugins render DOM elements and read `state.smooth`.
 * `definePlugin` handles mounting and show/hide for you.
 * Use `css()` from `@supermousejs/utils` inside `update()` for all style writes.
 *
 * @typeParam E - The specific HTMLElement subtype returned by `create`.
 *
 * @example
 * ```ts
 * const Dot = (options: Partial<DotOptions> = {}) =>
 *   definePlugin(
 *     {
 *       name: "dot",
 *       create: () => document.createElement("div"),
 *       update(app, el, dt) {
 *         const size = getSize(app.state);
 *         css(el, {
 *           width: `${size}px`,
 *           height: `${size}px`,
 *           backgroundColor: getColor(app.state),
 *         });
 *         const { x, y } = app.state.smooth;
 *         setTransform(el, x, y);
 *       },
 *     },
 *     options
 *   );
 * ```
 */
export interface VisualConfig<E extends HTMLElement = HTMLElement> extends CoreConfig {
  /**
   * Factory that creates the plugin's root DOM element.
   * Called once during `install()`. The returned element is automatically
   * appended to `app.container`.
   */
  create: (app: SupermouseInstance) => E;

  /**
   * Called every frame while the plugin is enabled.
   * Use `css()` from `@supermousejs/utils` for style writes,
   * and `setTransform()` for positioning.
   */
  update?(app: SupermouseInstance, element: E, deltaTime: number): void;

  /** Called when the plugin is enabled. The element is already visible. */
  onEnable?(app: SupermouseInstance, element: E): void;
  /**
   * Called when the plugin is disabled.
   * The element is still in the DOM when this runs, so you can start
   * CSS transitions. The core hides it immediately after this hook.
   */
  onDisable?(app: SupermouseInstance, element: E): void;

  /**
   * Called during `destroy()`, before the element is removed from the DOM.
   * Use this to tear down external listeners or GSAP timelines.
   */
  cleanup?(app: SupermouseInstance, element: E): void;
  /** General teardown hook, called after cleanup and element removal. */
  destroy?(app: SupermouseInstance): void;

  /**
   * Auto-registers this selector as a hover target on install.
   * Equivalent to `app.registerHoverTarget(selector)` inside `install()`.
   */
  selector?: string;
}

// ─── Type guard ───

function isVisual<E extends HTMLElement>(
  config: LogicConfig | VisualConfig<E>
): config is VisualConfig<E> {
  return typeof (config as VisualConfig).create === "function";
}

// ─── Overloads ───

/**
 * Creates a visual plugin with automatic DOM mounting and lifecycle management.
 *
 * @param config        Visual plugin definition.
 * @param userOptions   Optional overrides for `name` and `isEnabled`.
 * @returns A `SupermousePlugin` whose `element` property is typed as `E`.
 */
export function definePlugin<E extends HTMLElement>(
  config: VisualConfig<E>,
  userOptions?: BasePluginOptions
): SupermousePlugin & { element?: E };

/**
 * Creates a logic plugin that is passed through directly.
 *
 * @param config        Logic plugin definition.
 * @param userOptions   Optional overrides for `name` and `isEnabled`.
 * @returns A `SupermousePlugin`.
 */
export function definePlugin(
  config: LogicConfig,
  userOptions?: BasePluginOptions
): SupermousePlugin;

// ─── Implementation ───

/**
 * Creates a Supermouse plugin from a declarative configuration.
 *
 * **Visual plugins** receive automatic DOM mounting and enable/disable
 * lifecycle management. The core appends the element returned by `create()`
 * to `app.container`, then shows/hides it via `display` when enabled.
 *
 * Style writes are your responsibility inside `update()`. Use `css()` from
 * `@supermousejs/utils` — it batches writes and skips unchanged values.
 *
 * **Logic plugins** are passed through with minimal wrapping — only
 * `name` and `isEnabled` are resolved from `userOptions`.
 *
 * @see {@link VisualConfig}
 * @see {@link LogicConfig}
 */
export function definePlugin(
  config: LogicConfig | VisualConfig,
  userOptions: BasePluginOptions = {}
): SupermousePlugin {
  const resolvedName = userOptions.name ?? config.name;
  const resolvedEnabled = userOptions.isEnabled ?? true;

  // ── Logic path ──
  if (!isVisual(config)) {
    return {
      ...config,
      name: resolvedName,
      isEnabled: resolvedEnabled
    };
  }

  // ── Visual path ──
  let root: HTMLElement | null = null;
  let isMounted = false;

  return {
    name: resolvedName,
    isEnabled: resolvedEnabled,
    priority: config.priority,

    install(app) {
      root = config.create(app);

      if (!(root instanceof HTMLElement)) {
        console.warn(
          `[supermouse] Plugin "${resolvedName}" create() did not return an HTMLElement.`
        );
        return;
      }

      app.container.appendChild(root);
      this.element = root;
      isMounted = true;

      if (config.selector) {
        app.registerHoverTarget(config.selector);
      }

      if (!resolvedEnabled) {
        root.style.display = "none";
      }

      config.install?.(app);
    },

    update(app, dt) {
      if (!root || !isMounted) return;
      config.update?.(app, root, dt);
    },

    onEnable(app) {
      if (!root) return;
      root.style.display = "";
      config.onEnable?.(app, root);
    },

    onDisable(app) {
      if (!root) return;
      config.onDisable?.(app, root);
    },

    destroy(app) {
      if (root) {
        config.cleanup?.(app, root);
        root.remove();
        root = null;
        isMounted = false;
      }
      config.destroy?.(app);
    }
  };
}
