import type { SupermouseInstance, SupermousePlugin } from "@supermousejs/core";

/** Options that can be passed to any plugin factory. */
export interface BasePluginOptions {
  /** Overrides the plugin's internal name. */
  name?: string;
  /** Whether the plugin starts enabled. Defaults to `true`. */
  isEnabled?: boolean;
}

interface CoreConfig {
  /** Unique identifier. Used by `getPlugin()`, `enablePlugin()`, etc. */
  name: string;
  /** Execution order in the frame loop. Lower values are executed earlier */
  priority?: number;
  /** Whether the plugin starts enabled. Defaults to `true`. */
  isEnabled?: boolean;
  /** Called once when the plugin is registered via `app.use()`. */
  install?(app: SupermouseInstance): void;
}

/**
 * Declarative config for a logic plugin.
 *
 * Logic plugins modify cursor intent (e.g. magnetism, snapping, gravity).
 */
export interface LogicConfig extends CoreConfig {
  /**
   * Called every frame while the plugin is enabled.
   * @param app       The Supermouse instance.
   * @param deltaTime Elapsed time since last frame, in milliseconds.
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
 * Declarative config for a visual plugin.
 *
 * @typeParam E - The specific element subtype returned by `create`.
 *   Can be an `HTMLElement` (e.g. `HTMLDivElement`) or an `SVGElement`
 *   (e.g. `SVGSVGElement`).
 *
 */
export interface VisualConfig<
  E extends HTMLElement | SVGElement = HTMLElement | SVGElement
> extends CoreConfig {
  /**
   * Factory that creates the plugin's root DOM element.
   * Called once during `install()`. The returned element is automatically
   * appended to the **stage** (not `app.container`).
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

function isVisual<E extends HTMLElement | SVGElement>(
  config: LogicConfig | VisualConfig<E>
): config is VisualConfig<E> {
  return typeof (config as VisualConfig).create === "function";
}

/**
 * Creates a visual plugin with automatic DOM mounting and lifecycle management.
 *
 * @param config        Visual plugin definition.
 * @param userOptions   Optional overrides for `name` and `isEnabled`.
 * @returns A `SupermousePlugin` whose `element` property is typed as `E`.
 */
export function definePlugin<E extends HTMLElement | SVGElement>(
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

export function definePlugin(
  config: LogicConfig | VisualConfig,
  userOptions: BasePluginOptions = {}
): SupermousePlugin {
  const resolvedName = userOptions.name ?? config.name;
  const resolvedEnabled = userOptions.isEnabled ?? true;

  if (!isVisual(config)) {
    return {
      ...config,
      name: resolvedName,
      isEnabled: resolvedEnabled
    };
  }

  let root: HTMLElement | SVGElement | null = null;
  let isMounted = false;

  return {
    name: resolvedName,
    isEnabled: resolvedEnabled,
    priority: config.priority,

    install(app) {
      root = config.create(app);

      if (!(root instanceof HTMLElement) && !(root instanceof SVGElement)) {
        console.warn(
          `[supermouse] Plugin "${resolvedName}" create() did not return an HTMLElement or SVGElement.`
        );
        return;
      }

      this.element = app.stage.appendChild(root);
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
