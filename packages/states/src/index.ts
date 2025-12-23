import { definePlugin } from '@supermousejs/utils';

export interface StatesOptions {
  name?: string;
  isEnabled?: boolean;
  /** The default state (active when nothing else is hovered). */
  default: string[];
  /** Map of state names to lists of plugin names to enable. */
  states: Record<string, string[]>;
  /** CSS selector attribute to trigger state change. Default 'data-supermouse-state'. */
  attribute?: string;
}

export const States = (options: StatesOptions) => {
  const attr = options.attribute || 'data-supermouse-state';
  
  // Cache the relationships for fast lookups
  const allManagedPlugins = new Set<string>(); // All plugins mentioned in 'states'
  const defaultPlugins = new Set(options.default);
  
  // Populate the set of managed plugins (excluding defaults for now)
  Object.values(options.states).forEach(list => {
    list.forEach(p => allManagedPlugins.add(p));
  });

  let currentState = 'default';
  let hasInitialized = false;

  return definePlugin({
    name: 'states',
    // High priority: Run BEFORE visual plugins so they know if they are enabled/disabled this frame
    priority: -999, 
    
    install(app) {
      // Register the trigger attribute
      app.registerHoverTarget(`[${attr}]`);
    },

    update(app) {
      // --- INITIALIZATION STEP ---
      // We do this in the first update tick to ensure all other plugins 
      // have been registered via .use(), regardless of order.
      if (!hasInitialized) {
        // 1. Disable all "Special State" plugins initially
        allManagedPlugins.forEach(name => {
          if (!defaultPlugins.has(name)) {
            app.disablePlugin(name);
          }
        });

        // 2. Ensure default plugins are enabled
        defaultPlugins.forEach(name => {
          app.enablePlugin(name);
        });

        hasInitialized = true;
      }

      // --- STANDARD LOGIC ---
      const target = app.state.hoverTarget;
      let nextState = 'default';

      // 1. Determine Desired State
      if (target && target.hasAttribute(attr)) {
        const val = target.getAttribute(attr);
        if (val && options.states[val]) {
          nextState = val;
        }
      }

      // 2. Switch State (Only if changed)
      if (nextState !== currentState) {
        
        // A. Determine which plugins should be active
        const activePlugins = nextState === 'default' 
          ? options.default 
          : options.states[nextState];

        // B. Apply changes
        // Note: We combine default + managed to ensure we cover everyone involved
        const involved = new Set([...defaultPlugins, ...allManagedPlugins]);
        
        involved.forEach(pluginName => {
          const shouldBeActive = activePlugins.includes(pluginName);
          
          if (shouldBeActive) {
            app.enablePlugin(pluginName);
          } else {
            app.disablePlugin(pluginName);
          }
        });

        currentState = nextState;
      }
    }
  }, options);
};