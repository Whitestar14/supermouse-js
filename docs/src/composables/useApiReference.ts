export interface TOCSection {
  id: string;
  label: string;
}

export interface ApiItem {
  id: string;
  name: string;
  type?: string;
  defaultValue?: string;
  returns?: string;
  signature?: string;
  desc: string;
  usage?: string;
  usageTitle?: string;
  usageLang?: string;
}

export const API_SECTIONS: TOCSection[] = [
  { id: "core-class", label: "Core Class" },
  { id: "constructor", label: "Constructor" },
  { id: "options", label: "Options" },
  { id: "state", label: "MouseState" },
  { id: "methods", label: "Methods" },
  { id: "plugin-interface", label: "Plugin Interface" },
  { id: "utilities", label: "Utilities" }
];

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
  }
];

export const stateData: ApiItem[] = [
  {
    id: "pointer",
    name: "pointer",
    type: "{ x: number, y: number }",
    desc: "Raw coordinates from the latest pointer event before physics smoothing is applied.",
    usage: `const { x, y } = app.state.pointer;`
  },
  {
    id: "smooth",
    name: "smooth",
    type: "{ x: number, y: number }",
    desc: "Interpolated coordinates used for rendering. Read this in visual plugins when positioning DOM elements.",
    usage: `const { x, y } = app.state.smooth;
dom.setTransform(el, x, y);`
  },
  {
    id: "target",
    name: "target",
    type: "{ x: number, y: number }",
    desc: "Goal position for the cursor. Logic plugins (e.g. Magnetic) may mutate this before physics runs.",
    usage: `// Magnetic plugin writes here during update()
app.state.target.x = snappedX;
app.state.target.y = snappedY;`
  },
  {
    id: "velocity",
    name: "velocity",
    type: "{ x: number, y: number }",
    desc: "Current movement vector derived from smooth position changes. Useful for squash-and-stretch effects.",
    usage: `import { effects } from '@supermousejs/utils';

const { x: vx, y: vy } = app.state.velocity;
const distortion = effects.getVelocityDistortion(vx, vy);`
  },
  {
    id: "interaction",
    name: "interaction",
    type: "Record<string, any>",
    desc: "Metadata scraped from the hovered element via rules or data-supermouse-* attributes. Plugins read this to decide behavior.",
    usage: `update(app) {
  const { magnetic } = app.state.interaction;
  if (magnetic) {
    // apply magnetic offset to app.state.target
  }
}`
  },
  {
    id: "hovertarget",
    name: "hoverTarget",
    type: "HTMLElement | null",
    desc: "The DOM node currently driving the hover interaction, if any.",
    usage: `const el = app.state.hoverTarget;
if (el?.matches('.tooltip-trigger')) {
  // show tooltip plugin
}`
  },
  {
    id: "isdown",
    name: "isDown",
    type: "boolean",
    desc: "True while the primary pointer button is pressed.",
    usage: `if (app.state.isDown) {
  scale = 0.9;
}`
  },
  {
    id: "ishover",
    name: "isHover",
    type: "boolean",
    desc: "True when the pointer is over a registered selector from rules or registerHoverTarget().",
    usage: `const hovering = app.state.isHover;`
  },
  {
    id: "forcedcursor",
    name: "forcedCursor",
    type: "'auto' | 'none' | null",
    desc: "Internal override for native cursor visibility. Usually managed through setNativeCursor().",
    usage: `app.setNativeCursor('show'); // forcedCursor becomes 'auto'
app.setNativeCursor('hide'); // forcedCursor becomes 'none'`
  }
];

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

export const pluginHooks: ApiItem[] = [
  {
    id: "install",
    name: "install(app)",
    signature: "install(app: Supermouse): void",
    desc: "Called once when the plugin is registered. Create and mount DOM elements here.",
    usage: `install(app) {
  const el = dom.createCircle(8, 'white');
  app.container.appendChild(el);
  this.el = el;
}`
  },
  {
    id: "update",
    name: "update(app, dt)",
    signature: "update(app: Supermouse, dt: number): void",
    desc: "Called every frame. Apply transforms and read state here. dt is delta time in seconds.",
    usage: `update(app, dt) {
  const { x, y } = app.state.smooth;
  dom.setTransform(this.el, x, y);
}`
  },
  {
    id: "plugin-destroy",
    name: "destroy(app)",
    signature: "destroy(app: Supermouse): void",
    desc: "Called when the app is destroyed. Remove DOM nodes and release references.",
    usage: `destroy() {
  this.el?.remove();
  this.el = null;
}`
  },
  {
    id: "onenable",
    name: "onEnable(app)",
    signature: "onEnable(app: Supermouse): void",
    desc: "Called when a disabled plugin is re-enabled. Restore visibility and reset state.",
    usage: `onEnable() {
  dom.setStyle(this.el, 'opacity', '1');
}`
  },
  {
    id: "ondisable",
    name: "onDisable(app)",
    signature: "onDisable(app: Supermouse): void",
    desc: "Called when a plugin is disabled. Hide elements but keep them in the DOM for fast re-enable.",
    usage: `onDisable() {
  dom.setStyle(this.el, 'opacity', '0');
}`
  }
];

export const mathUtilities: ApiItem[] = [
  {
    id: "lerp",
    name: "math.lerp",
    signature: "lerp(start, end, factor): number",
    type: "number",
    desc: "Linear interpolation. factor 0 returns start, 1 returns end.",
    usage: `import { math } from '@supermousejs/utils';
const value = math.lerp(0, 100, 0.25); // 25`
  },
  {
    id: "damp",
    name: "math.damp",
    signature: "damp(a, b, lambda, dt): number",
    type: "number",
    desc: "Frame-rate independent damping. Higher lambda converges faster.",
    usage: `let pos = 0;
function update(dt) {
  pos = math.damp(pos, target, 12, dt);
}`
  },
  {
    id: "lerpangle",
    name: "math.lerpAngle",
    signature: "lerpAngle(start, end, factor): number",
    type: "number",
    desc: "Interpolates angles along the shortest path, handling 360° wrap-around.",
    usage: `rotation = math.lerpAngle(rotation, targetAngle, 0.15);`
  },
  {
    id: "dist",
    name: "math.dist",
    signature: "dist(x1, y1, x2?, y2?): number",
    type: "number",
    desc: "Distance between two points, or vector magnitude when x2/y2 are omitted.",
    usage: `const speed = math.dist(vx, vy);`
  },
  {
    id: "angle",
    name: "math.angle",
    signature: "angle(x, y): number",
    type: "number",
    desc: "Angle in degrees from the origin to a point.",
    usage: `const direction = math.angle(vx, vy);`
  },
  {
    id: "clamp",
    name: "math.clamp",
    signature: "clamp(value, min, max): number",
    type: "number",
    desc: "Constrains a value between bounds.",
    usage: `const alpha = math.clamp(raw, 0, 1);`
  },
  {
    id: "random",
    name: "math.random",
    signature: "random(min, max): number",
    type: "number",
    desc: "Random number between min and max (inclusive).",
    usage: `const jitter = math.random(-4, 4);`
  }
];

export const domUtilities: ApiItem[] = [
  {
    id: "createactor",
    name: "dom.createActor",
    signature: "createActor(tag?): HTMLElement",
    returns: "HTMLElement",
    desc: "Creates a fixed-position element optimized for cursor rendering.",
    usage: `const layer = dom.createActor('div');`
  },
  {
    id: "createcircle",
    name: "dom.createCircle",
    signature: "createCircle(size, color): HTMLElement",
    returns: "HTMLElement",
    desc: "Pre-styled circular element — ideal for dots and rings.",
    usage: `const dot = dom.createCircle(8, '#f59e0b');`
  },
  {
    id: "settransform",
    name: "dom.setTransform",
    signature: "setTransform(el, x, y, rotation?, scaleX?, scaleY?, skewX?, skewY?): void",
    returns: "void",
    desc: "Updates transform with automatic center anchoring (translate -50%, -50%).",
    usage: `dom.setTransform(el, x, y, rotation, scaleX, scaleY);`
  },
  {
    id: "setstyle",
    name: "dom.setStyle",
    signature: "setStyle(el, property, value): void",
    returns: "void",
    desc: "Writes a style only when the value changes to avoid layout thrashing.",
    usage: `dom.setStyle(el, 'opacity', isVisible ? 1 : 0);`
  },
  {
    id: "applystyles",
    name: "dom.applyStyles",
    signature: "applyStyles(el, styles): void",
    returns: "void",
    desc: "Bulk-apply multiple styles during initialization.",
    usage: `dom.applyStyles(el, {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: Layers.CURSOR
});`
  },
  {
    id: "projectrect",
    name: "dom.projectRect",
    signature: "projectRect(element, container?): DOMRect",
    returns: "DOMRect",
    desc: "Bounding rect relative to a container — useful for scoped cursors.",
    usage: `const rect = dom.projectRect(target, app.container);`
  }
];

export const effectsUtilities: ApiItem[] = [
  {
    id: "getvelocitydistortion",
    name: "effects.getVelocityDistortion",
    signature: "getVelocityDistortion(vx, vy, intensity?, maxStretch?)",
    returns: "{ rotation, scaleX, scaleY }",
    desc: "Squash-and-stretch values derived from velocity — great for motion-reactive cursors.",
    usage: `const { rotation, scaleX, scaleY } = effects.getVelocityDistortion(vx, vy);
dom.setTransform(el, x, y, rotation, scaleX, scaleY);`
  }
];

export const constantUtilities: ApiItem[] = [
  {
    id: "layers-overlay",
    name: "Layers.OVERLAY",
    type: "400",
    desc: "Top-most layer for text, tooltips, and critical UI.",
    usage: `el.style.zIndex = Layers.OVERLAY;`
  },
  {
    id: "layers-cursor",
    name: "Layers.CURSOR",
    type: "300",
    desc: "Primary cursor layer (dot, pointer).",
    usage: `dot.style.zIndex = Layers.CURSOR;`
  },
  {
    id: "layers-follower",
    name: "Layers.FOLLOWER",
    type: "200",
    desc: "Secondary followers like rings and brackets.",
    usage: `ring.style.zIndex = Layers.FOLLOWER;`
  },
  {
    id: "layers-trace",
    name: "Layers.TRACE",
    type: "100",
    desc: "Background effects — trails, particles, sparkles.",
    usage: `trail.style.zIndex = Layers.TRACE;`
  },
  {
    id: "easings-ease-out-expo",
    name: "Easings.EASE_OUT_EXPO",
    type: "cubic-bezier",
    desc: "Fast entrance easing that settles smoothly.",
    usage: `el.style.transition = \`transform 0.4s \${Easings.EASE_OUT_EXPO}\`;`
  },
  {
    id: "easings-elastic-out",
    name: "Easings.ELASTIC_OUT",
    type: "cubic-bezier",
    desc: "Playful elastic overshoot.",
    usage: `el.style.transition = \`transform 0.6s \${Easings.ELASTIC_OUT}\`;`
  },
  {
    id: "easings-smooth",
    name: "Easings.SMOOTH",
    type: "ease-out",
    desc: "General-purpose smooth easing.",
    usage: `el.style.transition = \`opacity 0.2s \${Easings.SMOOTH}\`;`
  }
];

export const otherUtilities: ApiItem[] = [
  {
    id: "normalize",
    name: "normalize",
    signature: "normalize(option, defaultValue): (state) => T",
    returns: "(state: MouseState) => T",
    desc: "Converts static values, functions, or undefined into a unified getter — removes branching inside update loops.",
    usage: `const getSize = normalize(options.size, 20);
const size = getSize(app.state);`
  },
  {
    id: "defineplugin",
    name: "definePlugin",
    signature: "definePlugin(config, userOptions): SupermousePlugin",
    returns: "SupermousePlugin",
    desc: "Type-safe helper for authoring plugins with automatic lifecycle wiring.",
    usage: `export const MyRing = (options) =>
  definePlugin({
    name: 'my-ring',
    create: () => dom.createCircle(24, 'white'),
    update: (app, el) => dom.setTransform(el, app.state.smooth.x, app.state.smooth.y)
  }, options);`
  },
  {
    id: "doctor",
    name: "doctor",
    signature: "doctor(): void",
    returns: "void",
    desc: "Debug helper that reports common misconfigurations. Run from the browser console.",
    usage: `import { doctor } from '@supermousejs/utils';
doctor();`
  }
];

/** Flat list of all linkable API entries for search indexing. */
export const ALL_API_ENTRIES: ApiItem[] = [
  constructorEntry,
  ...optionsData,
  ...stateData,
  ...methodsData,
  ...pluginHooks,
  ...mathUtilities,
  ...domUtilities,
  ...effectsUtilities,
  ...constantUtilities,
  ...otherUtilities
];
