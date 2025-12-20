import { Supermouse } from '../Supermouse';
import { SupermousePlugin, MouseState, ValueOrGetter } from '../types';
import { resolve } from './options';
import { setStyle } from './dom';

// --- SHARED OPTIONS ---
export interface BasePluginOptions {
  name?: string;
  isEnabled?: boolean;
}

// --- MODE A: LOGIC PLUGIN CONFIG ---
interface LogicConfig {
  name: string;
  priority?: number;
  install?: (app: Supermouse) => void;
  update?: (app: Supermouse, deltaTime: number) => void;
  destroy?: (app: Supermouse) => void;
  onEnable?: (app: Supermouse) => void;
  onDisable?: (app: Supermouse) => void;
  // Explicitly disallow 'create' here to ensure type separation
  create?: never;
}

// --- MODE B: VISUAL PLUGIN CONFIG ---
interface VisualConfig<E extends HTMLElement, O extends object> {
  name: string;
  /** Automatically register this attribute selector */
  selector?: string;
  /** Create and return the DOM Element */
  create: (app: Supermouse) => E;
  /** Map option keys to CSS properties */
  styles?: Partial<Record<keyof O, keyof CSSStyleDeclaration>>;
  /** Update loop with access to the element */
  update?: (app: Supermouse, element: E, deltaTime: number) => void;
  onEnable?: (app: Supermouse, element: E) => void;
  onDisable?: (app: Supermouse, element: E) => void;
  cleanup?: (element: E) => void;
  destroy?: never; // Visual plugins use cleanup(), not destroy()
}

// --- THE OVERLOADS ---

// Overload 1: Visual Plugin (Infer Element E and Options O)
export function definePlugin<E extends HTMLElement, O extends BasePluginOptions>(
  config: VisualConfig<E, O>,
  userOptions?: O
): SupermousePlugin;

// Overload 2: Logic Plugin
export function definePlugin(
  config: LogicConfig,
  userOptions?: BasePluginOptions
): SupermousePlugin;

// --- THE IMPLEMENTATION ---

export function definePlugin(config: any, userOptions: any = {}): SupermousePlugin {
  const name = userOptions.name || config.name;
  const initialEnabled = userOptions.isEnabled ?? true;

  // MODE A: VISUAL (Has 'create' method)
  if (typeof config.create === 'function') {
    let element: HTMLElement;

    return {
      name,
      isEnabled: initialEnabled,

      install(app) {
        // 1. Create & Append
        element = config.create(app);
        if (config.selector) app.registerHoverTarget(config.selector);
        
        // 2. Handle Initial State
        if (this.isEnabled === false) {
          element.style.opacity = '0';
        }
        app.container.appendChild(element);
      },

      update(app, dt) {
        // 3. Auto-apply Styles (Dirty Checked)
        if (config.styles) {
          for (const [optKey, cssProp] of Object.entries(config.styles)) {
            const val = resolve(userOptions[optKey], app.state, undefined);
            if (val !== undefined) {
              setStyle(element, cssProp as any, val);
            }
          }
        }
        // 4. Run Custom Update
        config.update?.(app, element, dt);
      },

      onDisable(app) {
        element.style.opacity = '0';
        config.onDisable?.(app, element);
      },

      onEnable(app) {
        element.style.opacity = '1';
        config.onEnable?.(app, element);
      },

      destroy() {
        config.cleanup?.(element);
        element.remove();
      }
    };
  } 
  
  // MODE B: LOGIC (Standard Pass-through)
  else {
    return {
      ...config, // Spread priority, install, etc.
      name,
      isEnabled: initialEnabled,
      // Wrap hooks to ensure we handle the overrides properly if needed
      // (though simple spreading usually works for logic plugins)
    };
  }
}