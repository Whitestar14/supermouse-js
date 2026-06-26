import type { ApiItem } from "./types";

export const coreClassDef = `class Supermouse {
  static readonly version: string;

  readonly version: string;
  state: MouseState;
  options: SupermouseOptions;
  get container(): HTMLDivElement;
  get isEnabled(): boolean;

  constructor(options?: SupermouseOptions);

  use(plugin: SupermousePlugin): this;
  getPlugin(name: string): SupermousePlugin | undefined;
  enablePlugin(name: string): void;
  disablePlugin(name: string): void;
  togglePlugin(name: string): void;

  enable(): void;
  disable(): void;
  destroy(): void;
  step(time: number): void;

  setNativeCursor(type: 'show' | 'hide' | 'auto'): void;
  registerHoverTarget(selector: string): void;
}`;

export const constructorEntry: ApiItem = {
  id: "constructor",
  name: "constructor(options?)",
  signature: "new Supermouse(options?: SupermouseOptions)",
  returns: "Supermouse",
  desc: "Creates the runtime, applies options, and prepares the plugin pipeline. Does not start the animation loop until enable() is called (or auto-started by framework adapters).",
  usage: `import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse({
  smoothness: 0.15,
  hideCursor: true,
  rules: {
    'a, button': { pointer: true },
    '[data-supermouse-magnetic]': { magnetic: true }
  },
  plugins: [Dot({ size: 8 }), Ring({ size: 32 })]
});

// Equivalent imperative registration
// const app = new Supermouse({ smoothness: 0.15 });
// app.use(Dot({ size: 8 })).use(Ring({ size: 32 }));`,
  usageTitle: "Initialization"
};

export const optionsData: ApiItem[] = [
  {
    id: "smoothness",
    name: "smoothness",
    type: "number",
    defaultValue: "0.15",
    desc: "Physics damping factor between 0 and 1. Lower values feel floatier; higher values snap faster to the target position.",
    usage: `const app = new Supermouse({ smoothness: 0.05 }); // very floaty
const snappy = new Supermouse({ smoothness: 0.35 }); // tight follow`
  },
  {
    id: "hidecursor",
    name: "hideCursor",
    type: "boolean",
    defaultValue: "true",
    desc: "Injects a scoped, high-specificity stylesheet that suppresses the native cursor on the body and registered interactive targets.",
    usage: `const app = new Supermouse({ hideCursor: true });

// Disable if you need the native cursor visible globally
const native = new Supermouse({ hideCursor: false });`
  },
  {
    id: "enabletouch",
    name: "enableTouch",
    type: "boolean",
    defaultValue: "false",
    desc: "Runs the cursor system on touch devices. Not recommended — Supermouse is designed to hibernate on coarse pointers.",
    usage: `// Only enable if you explicitly need touch support
const app = new Supermouse({ enableTouch: true });`
  },
  {
    id: "ignoreonnative",
    name: "ignoreOnNative",
    type: "'auto' | 'tag' | 'css' | null",
    defaultValue: "'auto'",
    desc: "Controls when the native cursor is restored over elements that expect it (inputs, text areas, etc.). 'tag' is fastest; 'css' inspects computed cursor styles.",
    usage: `const app = new Supermouse({
  hideCursor: true,
  ignoreOnNative: 'tag' // restore native cursor on inputs & textareas
});`
  },
  {
    id: "autodisableonmobile",
    name: "autoDisableOnMobile",
    type: "boolean",
    defaultValue: "true",
    desc: "Disables the entire system when (pointer: coarse) is detected — phones, tablets, and touch-first devices.",
    usage: `const app = new Supermouse({ autoDisableOnMobile: true });`
  },
  {
    id: "rules",
    name: "rules",
    type: "Record<string, object>",
    defaultValue: "{}",
    desc: "Maps CSS selectors to interaction state objects. The input layer scrapes matched elements and exposes metadata on state.interaction for plugins to consume.",
    usage: `const app = new Supermouse({
  rules: {
    'a, button, [role="button"]': { pointer: true },
    '.card': { magnetic: { strength: 0.4 } },
    'input, textarea': { text: true }
  }
});`
  },
  {
    id: "data-attributes",
    name: "data-supermouse-*",
    type: "HTML attributes",
    desc: "Per-element overrides that take precedence over rules. Useful for one-off interactions without polluting global configuration.",
    usage: `<!-- Magnetic pull on this card only -->
<div data-supermouse-magnetic data-supermouse-strength="0.6">Hover me</div>

<!-- Force pointer/text affordance -->
<button data-supermouse-pointer>Click</button>
<textarea data-supermouse-text></textarea>`,
    usageTitle: "HTML",
    usageLang: "html"
  },
  {
    id: "container",
    name: "container",
    type: "HTMLElement",
    defaultValue: "document.body",
    desc: "Root element where cursor layers are mounted. Scope the cursor to modals, canvases, or embedded previews.",
    usage: `const wrapper = document.querySelector('#canvas-stage') as HTMLElement;

const app = new Supermouse({
  container: wrapper,
  hideCursor: true
});`
  },
  {
    id: "plugins-option",
    name: "plugins",
    type: "SupermousePlugin[]",
    defaultValue: "[]",
    desc: "A list of plugins to load and initialize automatically when the runtime starts.",
    usage: `const app = new Supermouse({
  plugins: [Dot(), Ring()]
});`
  },
  {
    id: "hoverselectors",
    name: "hoverSelectors",
    type: "string[]",
    defaultValue: "['a', 'button', 'input', 'select', 'textarea', '[role=\"button\"]']",
    desc: "List of selectors that trigger the custom hover visual and register attributes on state.isHover.",
    usage: `const app = new Supermouse({
  hoverSelectors: ['.custom-link', '[data-hoverable]']
});`
  },
  {
    id: "hideonleave",
    name: "hideOnLeave",
    type: "boolean",
    defaultValue: "true",
    desc: "Hides the custom cursor DOM layers when the native pointer leaves the browser viewport.",
    usage: `const app = new Supermouse({ hideOnLeave: false });`
  },
  {
    id: "autostart",
    name: "autoStart",
    type: "boolean",
    defaultValue: "true",
    desc: "Automatically starts the requestAnimationFrame frame loop. If set to false, you must explicitly invoke app.enable() to start.",
    usage: `const app = new Supermouse({ autoStart: false });
// Load assets/do setup...
app.enable();`
  },
  {
    id: "resolveinteraction",
    name: "resolveInteraction",
    type: "(el: HTMLElement) => InteractionState",
    desc: "Custom handler to compute interaction states from a hovered element. Bypasses the default data-attribute scraper entirely.",
    usage: `const app = new Supermouse({
  resolveInteraction: (el) => {
    return {
      magnetic: el.classList.contains('magnetic-btn'),
      color: el.getAttribute('data-btn-color')
    };
  }
});`
  }
];
