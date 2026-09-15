---
title: MouseState
description: Every field of the reactive cursor state, what writes it, and what it means.
section: Reference
order: 3
---

`app.state` is the single object the engine reads from and plugins write to. It
is plain data, mutated in place, updated every frame.

```typescript
const app = new Supermouse();

console.log(app.state.smooth.x, app.state.smooth.y);
```

## Ownership

The engine is strict about who writes what, and the contract is worth knowing
before you mutate anything:

| Field group | Written by |
| :--- | :--- |
| `pointer`, `isDown`, `isHover`, `isNative`, `hoverTarget`, `interaction`, `reducedMotion` | The input layer |
| `target` | The core (copied from `pointer`), then **logic plugins** |
| `smooth`, `velocity`, `displacement`, `angle` | The core physics step |
| `hasReceivedInput`, `cursorMode` | The core (`setCursor()`) |
| `shape` | Logic plugins (`Stick`), reset to `null` by the core |

If you are writing anything in the first column, you are almost certainly working
against the engine.

## Spatial coordinates

### `pointer`

- **Type:** `MousePosition { x: number; y: number }`
- **Mutability:** read-only

The raw position from the latest `pointermove`, before any smoothing. When a
[`container`](/docs/reference/options#container) is configured these values are
**relative to that container**, not the viewport.

### `target`

- **Type:** `MousePosition`
- **Mutability:** read/write — intended for logic plugins

The destination the physics step damps toward. It is reset from `pointer` at the
start of every frame, then logic plugins (`priority < 0`) may rewrite it. This is
how magnetism and snapping work without touching input.

```typescript
// a logic plugin (priority: -10)
app.state.target.x = magnetCenter.x;
app.state.target.y = magnetCenter.y;
```

Because `target` is refreshed every frame, logic plugins must re-apply their
offset each frame — there is no persistence.

### `smooth`

- **Type:** `MousePosition`
- **Mutability:** read-only

The damped position. **Visual plugins should position from here.** It advances
*after* the plugin pass, so a plugin reading `smooth` sees the previous frame's
result — which is precisely what produces trailing effects.

`Dot` deliberately positions from `target` instead, giving the crisp, no-lag
core of the classic dot-plus-ring pairing.

## Kinematics

### `velocity`

- **Type:** `MousePosition`

True speed of the rendered cursor in **pixels per second**:
`(smooth - previousSmooth) / dt`. Use it for squash-and-stretch, motion blur and
arrow rotation.

```typescript
const speed = Math.hypot(app.state.velocity.x, app.state.velocity.y);
```

### `displacement`

- **Type:** `MousePosition`

The remaining distance to the destination: `target - smooth`. Use it for
overshoot detection and trailing indicators — **not** for speed.

### `angle`

- **Type:** `number` (degrees; `0°` = right, `90°` = down)

Heading derived from `velocity` via `atan2`. It is only updated while the cursor
moves faster than `0.1` px/s on either axis, so a resting cursor keeps its last
heading instead of flickering.

## Pointer and device

### `isDown`

`true` while the primary button is pressed — for press feedback such as
`SmartRing`, which scales down to 0.9 while pressed.

### `isHover`

`true` when the pointer is over an element matching `hoverSelectors` (or a
registered hover target).

### `isNative`

`true` when the OS pointer has been restored because the element under the
pointer is native (form control, `contenteditable`, `[data-supermouse-ignore]`,
or a deliberate `cursor` value). Use it to hide custom visuals that would
otherwise fight the system cursor.

### `cursorMode`

The active policy: `"auto" | "custom" | "native" | "both"`. Set it with
[`setCursor()`](/docs/reference/methods#setcursor).

### `hoverTarget`

The nearest element (self or ancestor) matching a hover selector, or `null`.

### `reducedMotion`

Mirrors `prefers-reduced-motion: reduce` and tracks changes while the page is
open. When `true` the engine effectively removes smoothing; plugins should skip
decorative motion too.

### `hasReceivedInput`

`false` until the first pointer move. The stage stays hidden while it is `false`,
which prevents the cursor from animating in from off-screen. It flips back to
`false` when the pointer leaves the window with `hideOnLeave` enabled.

## Interaction state

### `shape`

- **Type:** `ShapeState | null` — `{ width, height, borderRadius }`

Published by logic plugins that measure a target, consumed by visual plugins that
can morph. `Stick` writes it; `SmartRing` reads it; `Dot` hides itself while it
is set (`hideOnShape`).

```typescript
// visual plugin
const shape = app.state.shape;
if (shape) {
  el.style.borderRadius = `${shape.borderRadius}px`;
}
```

### `interaction`

- **Type:** `InteractionState` — a flat `Record<string, unknown>`

Rebuilt every frame from the hovered element's matching `rules` and its `data-*`
attributes (attributes take precedence). It is the supported alternative to
reading the DOM in `update()`.

```typescript
const { magnetic, text, color } = app.state.interaction;
```

Values may be `true` (valueless attribute), a string, or a number. Extend the
type for your own keys with module augmentation:

```typescript
declare module "@supermousejs/core" {
  interface InteractionState {
    magnetic?: boolean | number;
    text?: string;
    color?: string;
  }
}
```

`interaction` is replaced with a fresh object each frame rather than mutated in
place, so cache individual fields rather than the object reference.

## Reading state outside plugins

Everything above is plain data, so it is safe to read from your own code — for
example in a Vue `watch`:

```typescript
watch(
  () => app.state.isHover,
  (hovering) => (document.body.dataset.cursorHover = String(hovering))
);
```
