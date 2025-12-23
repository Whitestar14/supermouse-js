import type { Supermouse, SupermousePlugin } from '@supermousejs/core';
import { normalize } from './options';
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

// Helper Type Guard to safely distinguish VisualConfig at runtime
function isVisualConfig<E extends HTMLElement, O extends object>(
  config: LogicConfig | VisualConfig<E, O>
): config is VisualConfig<E, O> {
  return 'create' in config && typeof (config as any).create === 'function';
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

export function definePlugin(
  config: LogicConfig | VisualConfig<HTMLElement, any>, 
  userOptions: any = {}
): SupermousePlugin {
  const name = userOptions.name || config.name;
  const initialEnabled = userOptions.isEnabled ?? true;

  // MODE A: VISUAL
  if (isVisualConfig(config)) {
    let element: HTMLElement;

    // PRE-COMPILE STYLE SETTERS
    const styleSetters: ((app: Supermouse, el: HTMLElement) => void)[] = [];
    
    if (config.styles) {
      for (const [optKey, cssProp] of Object.entries(config.styles)) {
        const getter = normalize(userOptions[optKey], undefined);
        const prop = cssProp as any;
        
        styleSetters.push((app, el) => {
          const val = getter(app.state);
          if (val !== undefined) {
            setStyle(el, prop, val);
          }
        });
      }
    }

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
        if (!element) return;

        // 3. Run Pre-compiled Style Setters
        for (let i = 0; i < styleSetters.length; i++) {
          styleSetters[i](app, element);
        }
        
        // 4. Run Custom Update
        config.update?.(app, element, dt);
      },

      onDisable(app) {
        if (!element) return;
        // Use setStyle to ensure cache remains in sync (0)
        setStyle(element, 'opacity', 0);
        config.onDisable?.(app, element);
      },

      onEnable(app) {
        if (!element) return;
        setStyle(element, "opacity", 1)
        config.onEnable?.(app, element);
      },

      destroy() {
        if (!element) return;
        config.cleanup?.(element);
        element.remove();
      }
    };
  } 
  
  // MODE B: LOGIC (Standard Pass-through)
  else {
    return {
      ...config,
      name,
      isEnabled: initialEnabled,
    };
  }
}