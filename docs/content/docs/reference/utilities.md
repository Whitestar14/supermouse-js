---
title: Utilities
description: The complete @supermousejs/utils surface — math, DOM, SVG, CSS constants, option helpers and diagnostics.
section: Reference
order: 6
---

`@supermousejs/utils` is the shared toolkit for the core runtime and for plugin
authors. It has **no runtime dependencies**, and every official plugin depends on
nothing else.

```typescript
import { damp, definePlugin, dom, Layers } from "@supermousejs/utils";
```

Modules are also importable as namespaces — `math`, `dom`, `effects` and `svg` —
in addition to flat named exports:

```typescript
import { math, dom } from "@supermousejs/utils";

math.damp(x, target, 12, dt);
dom.setTransform(el, x, y);
```

## Math

| Export | Signature | Description |
| :--- | :--- | :--- |
| `lerp` | `(start, end, factor) => number` | Linear interpolation. |
| `damp` | `(a, b, lambda, dt) => number` | Frame-rate independent exponential damping. |
| `lerpAngle` | `(start, end, factor) => number` | Interpolation across the 360° wrap — use for rotation. |
| `clamp` | `(value, min, max) => number` | Constrains a value to a range. |
| `dist` | `(x1, y1, x2?, y2?) => number` | Distance between two points; the two-argument form measures vector magnitude. |
| `angle` | `(x, y) => number` | Heading of a vector in degrees. |
| `circumference` | `(r) => number` | Circle circumference. |
| `random` | `(min, max) => number` | Random value in range. |

```typescript
import { damp, lerpAngle } from "@supermousejs/utils";

update(app, dtMs) {
  const dt = dtMs / 1000; // damp expects SECONDS
  currentSize = damp(currentSize, targetSize, 20, dt);
  currentRotation = lerpAngle(currentRotation, app.state.angle, 0.15);
}
```

## DOM

| Export | Signature | Description |
| :--- | :--- | :--- |
| `css` | `(el, styles) => void` | Applies styles, skipping properties whose value has not changed. |
| `setTransform` | `(el, x, y, rotation?, scaleX?, scaleY?, skewX?, skewY?) => void` | Writes a `translate3d` transform and auto-centres with `translate(-50%, -50%)`. |
| `createActor` | `(tagName?) => HTMLElement \| SVGSVGElement` | Element base: absolute, `pointer-events: none`, `will-change: transform`. |
| `createCircle` | `(size, color) => HTMLDivElement` | Circular actor. |
| `projectRect` | `(element, container?) => DOMRect` | Bounding rect in the container's coordinate space. |
| `injectStyles` | `(id, css) => void` | Idempotent `<style>` injection, keyed by id. |

```typescript
import { dom } from "@supermousejs/utils";

const el = dom.createCircle(8, "black");
app.stage.appendChild(el);

dom.css(el, { opacity: String(app.state.isHover ? 0.4 : 1) });
dom.setTransform(el, app.state.smooth.x, app.state.smooth.y, app.state.angle);
```

`css()` keeps a per-element cache of the last written value, so setting the same
width every frame costs nothing — which is why official plugins can style
unconditionally inside `update()`.

**Deprecated aliases:** `setStyle` and `applyStyles` (use `css`) and `createDiv`
(use `createActor`). They remain for compatibility and will be removed.

`projectRect` is the correct way to measure a DOM element when a
[`container`](/docs/reference/options#container) is in play:

```typescript
const rect = dom.projectRect(target, app.container);
const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
```

## SVG

`createSVGElement`, `setSVGAttrs`, `group`, `circle`, `rect`, `path`, `text`,
`textPath`, `filter`, `gaussianBlur`, `turbulence`, `merge`, `mergeNode`,
`circlePath`.

## Effects

### `getVelocityDistortion(vx, vy, intensity?, maxStretch?)`

Turns a velocity vector into squash-and-stretch values, with a deadzone below
`0.1` px/s so a resting cursor does not jitter.

```typescript
import { getVelocityDistortion } from "@supermousejs/utils";

const { x: vx, y: vy } = app.state.velocity;
const { rotation, scaleX, scaleY } = getVelocityDistortion(vx, vy, 0.004, 0.5);

dom.setTransform(el, app.state.smooth.x, app.state.smooth.y, rotation, scaleX, scaleY);
```

## Option helpers

### `normalize(option, defaultValue)`

Resolves a [`ValueOrGetter`](/docs/reference/plugin-interface) into a function
that always returns a concrete value, removing `typeof` branching from the hot
path.

```typescript
const getSize = normalize(options.size, 8);
// later: getSize(app.state)
```

### `normalizeAll(options, defaults)`

The same, for every key of a defaults object:

```typescript
const cfg = normalizeAll(options, { size: 20, color: "#ffffff", borderWidth: 2 });
cfg.size(app.state);
```

### `hasFinePointer()`

`() => boolean` — `matchMedia("(pointer: fine)").matches`, guarded for
non-browser environments. Useful when a plugin should opt out entirely on touch.

## CSS constants

`Easings` and `Layers` keep transitions and stacking consistent across plugins.

| Constant | Value |
| :--- | :--- |
| `Easings.EASE_OUT_EXPO` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `Easings.ELASTIC_OUT` | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| `Easings.SMOOTH` | `ease-out` |
| `Layers.TRACE` | `"100"` — trails, sparkles, particles |
| `Layers.FOLLOWER` | `"200"` — rings and followers |
| `Layers.CURSOR` | `"300"` — the primary dot or pointer |
| `Layers.OVERLAY` | `"400"` — text, tooltips, images |

```typescript
import { Easings, Layers } from "@supermousejs/utils";

el.style.zIndex = Layers.OVERLAY;
el.style.transition = `opacity 200ms ${Easings.SMOOTH}`;
```

These are relative to the cursor stage, not the page — the stage itself is
positioned by the [`zIndex`](/docs/reference/options#zindex) option.

## Authoring helper

### `definePlugin(config, userOptions?)`

Creates a plugin with automatic mounting and lifecycle handling. Accepts either a
visual config (has `create`) or a logic config. Full field-by-field reference:
[Plugin Authoring](/docs/architecture/authoring#defineplugin).

## Diagnostics

### `doctor(app?)`

Logs a report to the console: plugin priorities, `States` ordering, orphaned
stage elements, multiple live instances, container positioning, cursor mode vs.
current state, plus a DOM scan for competing cursor styles. Call it with no
argument to run only the DOM scan.

```typescript
import { doctor } from "@supermousejs/utils";

doctor(app);
```

See [Troubleshooting](/docs/guide/troubleshooting) for the failure modes it maps to.
