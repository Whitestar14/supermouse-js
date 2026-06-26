import type { ApiItem } from "./types";

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
    desc: "A reactive dictionary containing metadata scraped from the currently hovered element using rules or data-supermouse-* attributes. To prevent 'Layout Thrashing' (violating the DOM Firewall), plugins must NEVER query the DOM directly (e.g. using getAttribute, getBoundingClientRect, or getComputedStyle) during the high-frequency update loop. Instead, the input layer scrapes this data once on pointer hover and populates `state.interaction` for plugins to read safely at 60-240fps.",
    usage: `// 1. Define interactive rules at initialization:
const app = new Supermouse({
  rules: {
    '.btn-magnetic': { magnetic: { strength: 0.5 } }
  }
});

// 2. Or define them in HTML directly:
// <button data-supermouse-magnetic data-supermouse-strength="0.8">Hover</button>

// 3. Inside a plugin's update() hook, read from state.interaction:
update(app) {
  const { magnetic, strength } = app.state.interaction;
  if (magnetic) {
    const pull = strength ?? 0.5;
    // Apply pull offset to app.state.target...
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
  },
  {
    id: "shape",
    name: "shape",
    type: "ShapeState | null",
    desc: "Defines a specific geometric shape the cursor should morph or conform to (e.g. snapping/sticking to a button container). Storing geometry on the state allows logic plugins (e.g. Stick) to communicate shapes to visual plugins (e.g. Ring) without coupling them.",
    usage: `// 1. In a logic plugin, write target shape coordinates:
app.state.shape = {
  width: hoveredRect.width,
  height: hoveredRect.height,
  borderRadius: 4
};

// 2. In a visual plugin, read and apply the shape:
const shape = app.state.shape;
if (shape) {
  dom.setStyle(el, 'width', \`\${shape.width}px\`);
  dom.setStyle(el, 'height', \`\${shape.height}px\`);
  dom.setStyle(el, 'borderRadius', \`\${shape.borderRadius}px\`);
}`
  },
  {
    id: "reducedmotion",
    name: "reducedMotion",
    type: "boolean",
    desc: "True if the user's OS has preferred reduced motion enabled. Plugins should inspect this flag and disable elaborate transitions, large movements, or particle trails to adhere to accessibility guidelines.",
    usage: `update(app, el) {
  if (app.state.reducedMotion) {
    // Disable floaty spring dynamics, snap instantly
    dom.setTransform(el, app.state.target.x, app.state.target.y);
    return;
  }
  // Standard floaty update...
}`
  }
];
