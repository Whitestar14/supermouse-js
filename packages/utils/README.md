# @supermousejs/utils

The `@supermousejs/utils` package provides a collection of tree-shakable helper functions for building Supermouse plugins and integrations. All utilities are framework-agnostic and optimized for performance in animation loops.

---

## Installation

```bash
pnpm add @supermousejs/utils
```

```bash
npm install @supermousejs/utils
```

```bash
yarn add @supermousejs/utils
```

---

## Importing

All utilities are available as named exports for optimal tree‑shaking:

```ts
import { css, setTransform, damp, clamp, definePlugin } from "@supermousejs/utils";
```

Legacy namespace imports are still supported for backward compatibility, though they may reduce tree‑shaking effectiveness:

```ts
import { math, dom, svg } from "@supermousejs/utils";

math.lerp(0, 1, 0.5);
dom.css(el, { opacity: 1 });
svg.circle({ cx: 10, cy: 10, r: 5 });
```

> **Note:** For the smallest bundle size, always prefer named imports.

---

## Math Utilities

Mathematical helpers for smooth, frame‑rate independent animations.

### `lerp(start, end, factor)`

Linear interpolation between two numbers.

```ts
import { lerp } from "@supermousejs/utils";

const value = lerp(0, 100, 0.25); // 25
```

**Parameters**

| Name     | Type     | Description                |
| -------- | -------- | -------------------------- |
| `start`  | `number` | Starting value             |
| `end`    | `number` | Target value               |
| `factor` | `number` | Interpolation amount (0–1) |

**Returns:** `number`

---

### `damp(current, target, lambda, dt)`

Frame‑rate independent exponential smoothing. Ideal for cursor physics and smooth follow effects.

```ts
import { damp } from "@supermousejs/utils";

let pos = 0;
function update(dt: number) {
  pos = damp(pos, target, 12, dt);
}
```

**Parameters**

| Name      | Type     | Description                     |
| --------- | -------- | ------------------------------- |
| `current` | `number` | Current value                   |
| `target`  | `number` | Desired value                   |
| `lambda`  | `number` | Response rate (higher = faster) |
| `dt`      | `number` | Delta time in **seconds**       |

**Returns:** `number`

---

### `lerpAngle(start, end, factor)`

Interpolates between two angles in degrees, taking the shortest path. Handles 360° wrap‑around.

```ts
import { lerpAngle } from "@supermousejs/utils";

let rotation = 0;
rotation = lerpAngle(rotation, targetAngle, 0.15);
```

**Parameters**

| Name     | Type     | Description              |
| -------- | -------- | ------------------------ |
| `start`  | `number` | Starting angle (degrees) |
| `end`    | `number` | Target angle (degrees)   |
| `factor` | `number` | Interpolation amount     |

**Returns:** `number`

---

### `clamp(value, min, max)`

Constrains a number between a minimum and maximum.

```ts
import { clamp } from "@supermousejs/utils";

const alpha = clamp(raw, 0, 1);
```

**Returns:** `number`

---

### `dist(x1, y1, x2?, y2?)`

Calculates the distance between two points, or the magnitude of a vector if the second point is omitted.

```ts
import { dist } from "@supermousejs/utils";

const speed = dist(vx, vy); // magnitude
const gap = dist(x1, y1, x2, y2); // distance
```

**Returns:** `number`

---

### `angle(x, y)`

Calculates the angle in degrees from the origin to a point (or vector direction).

```ts
import { angle } from "@supermousejs/utils";

const direction = angle(vx, vy);
```

**Returns:** `number` (degrees)

---

### `random(min, max)`

Returns a random floating‑point number between `min` and `max`.

```ts
import { random } from "@supermousejs/utils";

const jitter = random(-4, 4);
```

**Returns:** `number`

---

## DOM Utilities

Utilities for safe, performant DOM manipulation inside animation loops.

### `css(el, styles)`

Applies an object of CSS properties to an element. Only writes to the DOM when a value has changed, preventing layout thrashing.

```ts
import { css } from "@supermousejs/utils";

css(el, {
  width: `${size}px`,
  height: `${size}px`,
  opacity: state.isHover ? 1 : 0,
  backgroundColor: state.interaction.color || "#000"
});
```

**Parameters**

| Name     | Type                               | Description               |
| -------- | ---------------------------------- | ------------------------- |
| `el`     | `HTMLElement \| SVGElement`        | Target element            |
| `styles` | `Record<string, string \| number>` | CSS properties and values |

---

### `setTransform(el, x, y, rotation?, scaleX?, scaleY?, skewX?, skewY?)`

Applies a CSS transform with automatic centering (`translate(-50%, -50%)`). This is the recommended way to position cursor elements.

```ts
import { setTransform } from "@supermousejs/utils";

setTransform(el, x, y, rotation, scaleX, scaleY);
```

**Parameters**

| Name       | Type                        | Default | Description              |
| ---------- | --------------------------- | ------- | ------------------------ |
| `el`       | `HTMLElement \| SVGElement` |         | Target element           |
| `x`        | `number`                    |         | Horizontal position (px) |
| `y`        | `number`                    |         | Vertical position (px)   |
| `rotation` | `number`                    | `0`     | Rotation in degrees      |
| `scaleX`   | `number`                    | `1`     | Horizontal scale         |
| `scaleY`   | `number`                    | `1`     | Vertical scale           |
| `skewX`    | `number`                    | `0`     | Horizontal skew (deg)    |
| `skewY`    | `number`                    | `0`     | Vertical skew (deg)      |

---

### `injectStyles(id, css)`

Injects a global `<style>` tag into the document head. Safe for SPA routing and HMR.

```ts
import { injectStyles } from "@supermousejs/utils";

injectStyles("my-plugin-style", `.my-plugin { cursor: none; }`);
```

---

### `projectRect(element, container?)`

Calculates the bounding rectangle of an element relative to a container.

```ts
import { projectRect } from "@supermousejs/utils";

const rect = projectRect(target, app.container);
```

**Parameters**

| Name        | Type                           | Default         | Description        |
| ----------- | ------------------------------ | --------------- | ------------------ |
| `element`   | `HTMLElement \| SVGSVGElement` |                 | Element to measure |
| `container` | `HTMLElement \| SVGSVGElement` | `document.body` | Relative container |

**Returns:** `DOMRect`

---

### `createActor(tagName?)`

Creates a standard Supermouse actor element with absolute positioning, `pointer-events: none`, and `will-change: transform`.

```ts
import { createActor } from "@supermousejs/utils";

const layer = createActor("div");
```

**Returns:** `HTMLElement | SVGSVGElement`

---

### `createCircle(size, color)`

Creates a circular HTML element.

```ts
import { createCircle } from "@supermousejs/utils";

const dot = createCircle(8, "#f59e0b");
```

**Returns:** `HTMLDivElement`

---

### `createDiv()`

Legacy alias for `createActor("div")`.

```ts
import { createDiv } from "@supermousejs/utils";

const el = createDiv();
```

**Deprecated:** Use `createActor("div")` instead.

---

### `setStyle(el, prop, value)` _(deprecated)_

Legacy single‑style writer. Use `css()` instead.

```ts
import { setStyle } from "@supermousejs/utils";

setStyle(el, "opacity", 0);
```

### `applyStyles(el, styles)` _(deprecated)_

Legacy bulk style writer. Use `css()` instead.

```ts
import { applyStyles } from "@supermousejs/utils";

applyStyles(el, { opacity: 0, color: "red" });
```

---

## Effects

### `getVelocityDistortion(vx, vy, intensity?, maxStretch?)`

Calculates rotation and squash/stretch values based on velocity. Ideal for motion‑reactive cursor effects.

```ts
import { getVelocityDistortion } from "@supermousejs/utils";
import { setTransform } from "@supermousejs/utils";

const { rotation, scaleX, scaleY } = getVelocityDistortion(vx, vy);
setTransform(el, x, y, rotation, scaleX, scaleY);
```

**Parameters**

| Name         | Type     | Default | Description            |
| ------------ | -------- | ------- | ---------------------- |
| `vx`         | `number` |         | Velocity X             |
| `vy`         | `number` |         | Velocity Y             |
| `intensity`  | `number` | `0.004` | Stretch factor         |
| `maxStretch` | `number` | `0.5`   | Maximum stretch amount |

**Returns:** `{ rotation: number; scaleX: number; scaleY: number }`

---

## Options Utilities

### `normalize(option, defaultValue)`

Converts a static value, reactive getter, or `undefined` into a function that always returns the resolved value. This removes `typeof` checks from hot loops.

```ts
import { normalize } from "@supermousejs/utils";

const getSize = normalize(options.size, 20);
const size = getSize(app.state);
```

**Parameters**

| Name           | Type                            | Description          |
| -------------- | ------------------------------- | -------------------- |
| `option`       | `ValueOrGetter<T> \| undefined` | User‑provided option |
| `defaultValue` | `T`                             | Fallback value       |

**Returns:** `(state: MouseState) => T`

---

### `normalizeAll(options, defaults)`

Normalizes multiple options in one call.

```ts
import { normalizeAll } from "@supermousejs/utils";

const cfg = normalizeAll(options, {
  size: 20,
  color: "#fff",
  opacity: 1
});

const size = cfg.size(app.state);
const color = cfg.color(app.state);
```

**Returns:** `{ [K in keyof T]: (state: MouseState) => T[K] }`

---

### `hasFinePointer()`

Returns `true` if the device has a fine pointer (mouse), `false` for coarse pointers (touch).

```ts
import { hasFinePointer } from "@supermousejs/utils";

if (hasFinePointer()) {
  // enable custom cursor
}
```

**Returns:** `boolean`

---

## Plugin Helper

### `definePlugin(config, userOptions?)`

Creates a Supermouse plugin from a declarative configuration.

**Two overloads:**

- **Visual Plugin:** The config includes `create()` and optionally `update`, `selector`, etc. The helper mounts the returned element to the **stage** and toggles visibility automatically.
- **Logic Plugin:** The config omits `create`; all lifecycle hooks are passed through directly.

#### Visual Plugin Example

```ts
import { definePlugin, css, setTransform } from "@supermousejs/utils";

export const Dot = (options = {}) =>
  definePlugin(
    {
      name: "dot",
      create: () => document.createElement("div"),
      update(app, el, dt) {
        const size = getSize(app.state);
        css(el, {
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: getColor(app.state)
        });
        const { x, y } = app.state.smooth;
        setTransform(el, x, y);
      }
    },
    options
  );
```

#### Logic Plugin Example

```ts
import { definePlugin } from "@supermousejs/utils";

const Gravity = definePlugin({
  name: "gravity",
  priority: -10,
  update(app, dt) {
    app.state.target.y += 5;
  }
});
```

**Configuration Interfaces**

- `BasePluginOptions` – Common options for all plugins (`name`, `isEnabled`).
- `LogicConfig` – Lifecycle hooks for logic plugins.
- `VisualConfig<E>` – Factory and lifecycle for visual plugins.

---

## SVG Utilities

A collection of helpers that remove `document.createElementNS` / `setAttribute` boilerplate.

### `svg.create(tag, attrs?)`

Creates any SVG element with attributes.

```ts
import { svg } from "@supermousejs/utils";

const svgEl = svg.create("svg", { width: 100, height: 100 });
```

### Individual named exports

All functions are also available as named exports for better tree‑shaking:

```ts
import { createSVGElement, circle, gaussianBlur } from "@supermousejs/utils";

const el = createSVGElement("svg", { width: 100 });
const c = circle({ cx: 50, cy: 50, r: 5 });
const blur = gaussianBlur(2);
```

**Available functions**

| Function                              | Description               |
| ------------------------------------- | ------------------------- |
| `createSVGElement(tag, attrs?)`       | Base SVG element factory  |
| `setSVGAttrs(el, attrs)`              | Set multiple attributes   |
| `group(attrs?)`                       | Create `<g>`              |
| `circle(attrs?)`                      | Create `<circle>`         |
| `rect(attrs?)`                        | Create `<rect>`           |
| `path(d?, attrs?)`                    | Create `<path>`           |
| `text(attrs?, content?)`              | Create `<text>`           |
| `textPath(href, attrs?)`              | Create `<textPath>`       |
| `filter(id, attrs?, children?)`       | Create `<filter>`         |
| `gaussianBlur(stdDeviation?, attrs?)` | Create `<feGaussianBlur>` |
| `turbulence(baseFrequency?, attrs?)`  | Create `<feTurbulence>`   |
| `mergeNode(inAttr?)`                  | Create `<feMergeNode>`    |
| `merge(nodes?)`                       | Create `<feMerge>`        |

---

## CSS Constants

### `Layers`

Standard z‑index layers for the Supermouse ecosystem.

```ts
import { Layers } from "@supermousejs/utils";

el.style.zIndex = Layers.CURSOR;
```

| Key        | Value   | Description                    |
| ---------- | ------- | ------------------------------ |
| `OVERLAY`  | `"400"` | Topmost layer (text, tooltips) |
| `CURSOR`   | `"300"` | Primary cursor layer           |
| `FOLLOWER` | `"200"` | Secondary followers            |
| `TRACE`    | `"100"` | Background effects             |

### `Easings`

Common cubic‑bezier easing strings for CSS transitions.

```ts
import { Easings } from "@supermousejs/utils";

el.style.transition = `transform 0.4s ${Easings.EASE_OUT_EXPO}`;
```

| Key             | Value                               |
| --------------- | ----------------------------------- |
| `EASE_OUT_EXPO` | `cubic-bezier(0.16, 1, 0.3, 1)`     |
| `ELASTIC_OUT`   | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `SMOOTH`        | `ease-out`                          |

---

## Doctor

### `doctor(app?)`

Diagnostic utility that audits a Supermouse instance or performs a lightweight DOM scan.

```ts
import { doctor } from "@supermousejs/utils";

// Full instance check
doctor(app);

// DOM-only scan
doctor();
```

**Instance checks:**

- Plugin priority ordering (logic vs visual)
- Missing `element` property on visual plugins
- Multiple instance conflicts
- Container positioning mutation
- Cursor mode validation and nested `"both"` warnings

**DOM‑only checks:**

- Supermouse initialization
- Inline cursor styles
- Body cursor leak (only when applicable)

---

## Tree‑Shaking

All functions are exported as named ES modules. When you import only what you need, bundlers (Vite, Webpack, Rollup) can drop unused code.

---

## Deprecated APIs

| Function      | Replacement          |
| ------------- | -------------------- |
| `setStyle`    | `css`                |
| `applyStyles` | `css`                |
| `createDiv`   | `createActor("div")` |

---

## License

MIT
