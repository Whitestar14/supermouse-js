import type { ApiItem } from "./types";

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
