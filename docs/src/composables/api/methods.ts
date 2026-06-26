import type { ApiItem } from "./types";

export const methodsData: ApiItem[] = [
  {
    id: "use",
    name: "use(plugin)",
    signature: "use(plugin: SupermousePlugin): this",
    returns: "this",
    desc: "Registers a plugin instance. Chainable — call multiple times to layer effects.",
    usage: `import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

app.use(Dot({ size: 8 })).use(Ring({ size: 40 }));`
  },
  {
    id: "enable",
    name: "enable()",
    signature: "enable(): void",
    returns: "void",
    desc: "Starts the animation loop and attaches input listeners.",
    usage: `const app = new Supermouse();
app.use(Dot());
app.enable();`
  },
  {
    id: "disable",
    name: "disable()",
    signature: "disable(): void",
    returns: "void",
    desc: "Stops the loop and restores native cursor behavior without destroying plugins.",
    usage: `app.disable(); // pause while keeping configuration`
  },
  {
    id: "destroy",
    name: "destroy()",
    signature: "destroy(): void",
    returns: "void",
    desc: "Full teardown — removes listeners, destroys plugins, and cleans injected styles. Required before re-initializing on the same page (e.g. route changes in SPAs).",
    usage: `onUnmounted(() => {
  app.destroy();
});`
  },
  {
    id: "setnativecursor",
    name: "setNativeCursor(type)",
    signature: "setNativeCursor(type: 'show' | 'hide' | 'auto'): void",
    returns: "void",
    desc: "Force native cursor visibility for edge cases like text selection or drag-and-drop affordances.",
    usage: `textarea.addEventListener('focus', () => app.setNativeCursor('show'));
textarea.addEventListener('blur', () => app.setNativeCursor('auto'));`
  },
  {
    id: "getplugin",
    name: "getPlugin(name)",
    signature: "getPlugin(name: string): SupermousePlugin | undefined",
    returns: "SupermousePlugin | undefined",
    desc: "Retrieves a registered plugin by its name key.",
    usage: `const dot = app.getPlugin('dot');
dot?.setOption?.('size', 12);`
  },
  {
    id: "enableplugin",
    name: "enablePlugin(name)",
    signature: "enablePlugin(name: string): void",
    returns: "void",
    desc: "Re-enables a previously disabled plugin and calls its onEnable hook.",
    usage: `app.enablePlugin('ring');`
  },
  {
    id: "disableplugin",
    name: "disablePlugin(name)",
    signature: "disablePlugin(name: string): void",
    returns: "void",
    desc: "Disables a single plugin without removing it from the pipeline.",
    usage: `app.disablePlugin('trail');`
  },
  {
    id: "toggleplugin",
    name: "togglePlugin(name)",
    signature: "togglePlugin(name: string): void",
    returns: "void",
    desc: "Toggles a plugin between enabled and disabled states.",
    usage: `button.addEventListener('click', () => app.togglePlugin('sparkles'));`
  },
  {
    id: "registerhovertarget",
    name: "registerHoverTarget(selector)",
    signature: "registerHoverTarget(selector: string): void",
    returns: "void",
    desc: "Adds a CSS selector to hover detection at runtime.",
    usage: `app.registerHoverTarget('[data-cursor="card"]');`
  },
  {
    id: "step",
    name: "step(time)",
    signature: "step(time: number): void",
    returns: "void",
    desc: "Manual frame tick when you control the loop yourself instead of the internal requestAnimationFrame driver.",
    usage: `function frame(now: number) {
  app.step(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);`
  }
];
