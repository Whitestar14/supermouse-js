import { Supermouse } from '../Supermouse';
import { SupermousePlugin } from '../types';
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

    // PRE-COMPILE STYLE SETTERS
    // Instead of iterating Object.entries() every frame (allocation heavy),
    // we create an array of specific update functions once.
    const styleSetters: ((app: Supermouse, el: HTMLElement) => void)[] = [];
    
    if (config.styles) {
      for (const [optKey, cssProp] of Object.entries(config.styles)) {
        // Normalize once. Now we have a fast getter.
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
        // 3. Run Pre-compiled Style Setters
        // Using a plain for loop is faster than forEach for high-freq code
        for (let i = 0; i < styleSetters.length; i++) {
          styleSetters[i](app, element);
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
    };
  }
}
