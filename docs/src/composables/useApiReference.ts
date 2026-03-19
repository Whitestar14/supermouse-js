export interface TOCSection {
  id: string;
  label: string;
}

export const API_SECTIONS: TOCSection[] = [
  { id: "core-class", label: "Core Class" },
  { id: "options", label: "Options" },
  { id: "state", label: "MouseState" },
  { id: "methods", label: "Methods" },
  { id: "plugin-interface", label: "Plugin Interface" },
  { id: "utilities", label: "Utilities" }
];

export const coreClassDef = `class Supermouse {
  // Static
  static readonly version: string;

  // Instance Properties
  readonly version: string;
  state: MouseState;
  options: SupermouseOptions;
  get container(): HTMLDivElement;
  get isEnabled(): boolean;

  constructor(options?: SupermouseOptions);

  // Plugin Management
  use(plugin: SupermousePlugin): this;
  getPlugin(name: string): SupermousePlugin | undefined;
  enablePlugin(name: string): void;
  disablePlugin(name: string): void;
  togglePlugin(name: string): void;

  // Runtime Control
  enable(): void;
  disable(): void;
  destroy(): void;
  step(time: number): void;

  // Interaction & Visibility
  setCursor(type: 'auto' | 'none' | null): void;
  registerHoverTarget(selector: string): void;
}`;

export const optionsData = [
  {
    name: "smoothness",
    type: "number",
    default: "0.15",
    desc: "Physics damping factor (0-1). Lower is floatier, higher is snappier."
  },
  {
    name: "hideCursor",
    type: "boolean",
    default: "true",
    desc: "Injects CSS to hide the native cursor on the body and interactive elements."
  },
  {
    name: "enableTouch",
    type: "boolean",
    default: "false",
    desc: "If true, the cursor system runs on touch devices (not recommended)."
  },
  {
    name: "ignoreOnNative",
    type: "boolean | 'auto' | 'tag' | 'css'",
    default: "'auto'",
    desc: "Strategy for unhiding native cursor. 'tag' is fastest (HTML only). 'css' checks computed style."
  },
  {
    name: "autoDisableOnMobile",
    type: "boolean",
    default: "true",
    desc: "Disables the system entirely if (pointer: coarse) is detected."
  },
  {
    name: "rules",
    type: "Record<string, object>",
    default: "{}",
    desc: "Map of CSS selectors to interaction state objects."
  },
  {
    name: "container",
    type: "HTMLElement",
    default: "document.body",
    desc: "The root element to append cursor elements to."
  }
];

export const stateData = [
  {
    name: "pointer",
    type: "{ x: number, y: number }",
    desc: "Raw input coordinates from the event listener."
  },
  {
    name: "smooth",
    type: "{ x: number, y: number }",
    desc: "Interpolated coordinates used for rendering."
  },
  {
    name: "target",
    type: "{ x: number, y: number }",
    desc: "The goal position. Mutable by logic plugins (e.g. Magnetic)."
  },
  {
    name: "velocity",
    type: "{ x: number, y: number }",
    desc: "Current speed vector calculated from smooth movement."
  },
  {
    name: "interaction",
    type: "Record<string, any>",
    desc: "Metadata scraped from the currently hovered element."
  },
  {
    name: "hoverTarget",
    type: "HTMLElement | null",
    desc: "The specific DOM element triggering the hover state."
  },
  { name: "isDown", type: "boolean", desc: "True if mouse button is pressed." },
  {
    name: "isHover",
    type: "boolean",
    desc: "True if hovering a registered selector."
  },
  {
    name: "forcedCursor",
    type: "'auto' | 'none' | null",
    desc: "Override for native cursor visibility. Managed via setCursor()."
  }
];

export const methodsData = [
  {
    name: "use",
    params: "plugin",
    return: "this",
    desc: "Registers a plugin. Chainable."
  },
  {
    name: "enable",
    params: "-",
    return: "void",
    desc: "Starts the loop and input listeners."
  },
  {
    name: "disable",
    params: "-",
    return: "void",
    desc: "Stops the loop and restores native cursor."
  },
  { name: "destroy", params: "-", return: "void", desc: "Full cleanup." },
  {
    name: "setCursor",
    params: "type: 'auto' | 'none' | null",
    return: "void",
    desc: "Force native cursor visibility."
  },
  {
    name: "getPlugin",
    params: "name: string",
    return: "Plugin | undefined",
    desc: "Get a plugin instance."
  },
  {
    name: "enablePlugin",
    params: "name: string",
    return: "void",
    desc: "Enable a specific plugin."
  },
  {
    name: "disablePlugin",
    params: "name: string",
    return: "void",
    desc: "Disable a specific plugin."
  },
  {
    name: "togglePlugin",
    params: "name: string",
    return: "void",
    desc: "Toggle plugin state."
  },
  {
    name: "registerHoverTarget",
    params: "selector: string",
    return: "void",
    desc: "Add selector to hover detection."
  },
  {
    name: "step",
    params: "time: number",
    return: "void",
    desc: "Manual frame tick."
  }
];

export const pluginHooks = [
  {
    name: "install(app)",
    desc: "Called once when registered. Create DOM elements here."
  },
  {
    name: "update(app, dt)",
    desc: "Called every frame. Update transforms here."
  },
  {
    name: "destroy(app)",
    desc: "Called when the app is destroyed. Remove DOM elements here."
  },
  {
    name: "onEnable(app)",
    desc: "Called when plugin is re-enabled. Restore visibility."
  },
  {
    name: "onDisable(app)",
    desc: "Called when plugin is disabled. Hide visibility (opacity: 0)."
  }
];

export const mathUtilities = [
  {
    name: "lerp",
    signature: "lerp(start, end, factor)",
    params: "start: number, end: number, factor: 0-1",
    return: "number",
    desc: "Linear interpolation between two values. Factor 0 = start, 1 = end."
  },
  {
    name: "damp",
    signature: "damp(a, b, lambda, dt)",
    params: "a: number, b: number, lambda: 1-20, dt: seconds",
    return: "number",
    desc: "Frame-rate independent damping. Ensures smooth animation at any refresh rate. Higher lambda = faster convergence."
  },
  {
    name: "lerpAngle",
    signature: "lerpAngle(start, end, factor)",
    params: "start: degrees, end: degrees, factor: 0-1",
    return: "number",
    desc: "Angle interpolation taking the shortest path (handles 360° wrap-around)."
  },
  {
    name: "dist",
    signature: "dist(x1, y1, x2, y2)",
    params: "x1, y1, x2, y2: numbers (x2, y2 optional, default 0)",
    return: "number",
    desc: "Distance between two points (or magnitude of vector if x2/y2 omitted)."
  },
  {
    name: "angle",
    signature: "angle(x, y)",
    params: "x: number, y: number",
    return: "number",
    desc: "Angle in degrees from origin to point (or vector direction)."
  },
  {
    name: "clamp",
    signature: "clamp(value, min, max)",
    params: "value, min, max: numbers",
    return: "number",
    desc: "Constrains value between min and max boundaries."
  },
  {
    name: "random",
    signature: "random(min, max)",
    params: "min: number, max: number",
    return: "number",
    desc: "Random number between min and max (inclusive)."
  }
];

export const domUtilities = [
  {
    name: "createActor",
    signature: "createActor(tag)",
    params: "tag: string (optional, default 'div')",
    return: "HTMLElement",
    desc: "Create a fixed-position element optimized for cursor rendering."
  },
  {
    name: "createCircle",
    signature: "createCircle(size, color)",
    params: "size: number, color: string",
    return: "HTMLElement",
    desc: "Create a pre-styled circular div (border-radius 50%, perfect for dots/rings)."
  },
  {
    name: "setTransform",
    signature: "setTransform(el, x, y, rotation, scaleX, scaleY, skewX, skewY)",
    params:
      "el: HTMLElement, x: px, y: px, rotation: deg (0), scaleX: 1, scaleY: 1, skewX: deg (0), skewY: deg (0)",
    return: "void",
    desc: "Update element transform. Handles center positioning (translate -50%, -50%) automatically."
  },
  {
    name: "setStyle",
    signature: "setStyle(el, property, value)",
    params: "el: HTMLElement, property: string, value: string|number",
    return: "void",
    desc: "Smart style writer. Only writes to DOM if value changed (prevents unnecessary reflows)."
  },
  {
    name: "applyStyles",
    signature: "applyStyles(el, styles)",
    params: "el: HTMLElement, styles: Partial<CSSStyleDeclaration>",
    return: "void",
    desc: "Bulk apply multiple styles at once (good for initialization)."
  },
  {
    name: "projectRect",
    signature: "projectRect(element, container)",
    params: "element: HTMLElement, container: HTMLElement (default document.body)",
    return: "DOMRect",
    desc: "Get element bounding rect relative to container (useful when cursor is confined to div)."
  }
];

export const effectsUtilities = [
  {
    name: "getVelocityDistortion",
    signature: "getVelocityDistortion(vx, vy, intensity, maxStretch)",
    params: "vx: number, vy: number, intensity: 0.004 (default), maxStretch: 0.5 (default)",
    return: "{ rotation: number, scaleX: number, scaleY: number }",
    desc: "Calculate squash & stretch based on velocity. Great for shapeshifting cursors that follow movement."
  }
];

export const constantUtilities = [
  {
    name: "Layers.OVERLAY",
    value: "400",
    desc: "Top-most layer. Use for text, tooltips, critical UI."
  },
  {
    name: "Layers.CURSOR",
    value: "300",
    desc: "Main cursor layer. Use for primary Dot/Pointer."
  },
  {
    name: "Layers.FOLLOWER",
    value: "200",
    desc: "Secondary layer. Use for Rings, brackets, followers."
  },
  {
    name: "Layers.TRACE",
    value: "100",
    desc: "Background layer. Use for trails, sparkles, particles."
  },
  {
    name: "Easings.EASE_OUT_EXPO",
    value: "'cubic-bezier(0.16, 1, 0.3, 1)'",
    desc: "Fast entrance that slows down. Good for bouncy animations."
  },
  {
    name: "Easings.ELASTIC_OUT",
    value: "'cubic-bezier(0.34, 1.56, 0.64, 1)'",
    desc: "Bouncy/elastic effect. Great for playful UI."
  },
  {
    name: "Easings.SMOOTH",
    value: "'ease-out'",
    desc: "Standard smooth easing."
  }
];

export const otherUtilities = [
  {
    name: "normalize",
    signature: "normalize(option, defaultValue)",
    params: "option: value | function | undefined, defaultValue: T",
    return: "(state: MouseState) => T",
    desc: "Convert static values, functions, or undefined into a getter function. Eliminates type-checking in loops."
  },
  {
    name: "definePlugin",
    signature: "definePlugin(config, userOptions)",
    params: "config: VisualConfig | LogicConfig, userOptions: object",
    return: "SupermousePlugin",
    desc: "Helper to create type-safe plugins with automatic lifecycle management and style binding."
  },
  {
    name: "doctor",
    signature: "doctor()",
    params: "none",
    return: "void",
    desc: "Debug utility. Detects common cursor conflicts, missing initialization, layout issues. Run in console."
  }
];
