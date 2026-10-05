---
title: Usage
description: Construct the engine, register plugins, describe hover interactions, and control the lifecycle.
section: Guide
order: 3
---

Getting the engine onto the page takes a single constructor, and every option has a sensible default — so you can start with nothing and reach for settings only when your layout asks for them. This page walks through the whole surface, from registering plugins to controlling the lifecycle.

```typescript
import { Supermouse } from "@supermousejs/core";

const app = new Supermouse({
  smoothness: 0.15, // Response factor (lower is snappier)
  cursor: "auto", // Pointer policy
  dataPrefix: "supermouse" // Prefix for data-* interaction attributes
});
```

Instances expose read-only properties (`state`, `stage`, `container`, `isEnabled`, `isRunning`) alongside chainable instance methods and lifecycle controls.

---

## Plugin Registration

Plugins are authored as **factory functions** to guarantee per-instance state isolation.

Register plugins via the chainable `.use()` or through the constructor `plugins` array:

```typescript
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

// via .use()
app.use(Ring({ size: 24 })).use(Dot({ size: 8 }));

// via constructor array
const app = new Supermouse({
  plugins: [Ring({ size: 24 }), Dot({ size: 8 })]
});
```

::callout
Plugins auto-sort by [`priority`](/docs/reference/api#priority-ranges) on registration. If a plugin with an existing `name` is registered, the engine logs a warning and skips installation for that plugin.
::

---

## Defining Interactions

Some plugins usually allow for distinct cursor behavior over specific elements, like the official Dot plugin changing color on hover, via data-attributes
Supermouse avoids attaching imperative event listeners to individual interactive elements. Instead, it parses hover metadata directly into [`state.interaction`](/docs/reference/api#scopes--interaction) on hover entry, preventing per-frame DOM layout thrashing.

Interaction metadata is gathered from two sources:

### 1. Semantic Rules

Map CSS selectors to static state objects or resolver functions receiving the target element:

```typescript
const app = new Supermouse({
  rules: {
    ".btn-magnetic": { magnetic: 0.5 },
    "a[target='_blank']": (el) => ({ text: el.textContent?.trim() })
  }
});
```

### 2. Data Attributes

Declare interaction metadata directly in markup:

```html
<button class="btn-magnetic" data-supermouse-magnetic="0.8" data-supermouse-text="Copy">
  Copy link
</button>
```

Plugins read the parsed payload directly from state:

```typescript
app.state.interaction.magnetic; // 0.8 (HTML dataset overrides rule default)
app.state.interaction.text; // "Copy"
```

### Interaction Precedence & Rules

- **Precedence:** `data-*` attributes override selector `rules`.
- **Normalization:** Attribute names convert to camelCase following the prefix (e.g., `data-supermouse-mix-blend` maps to `interaction.mixBlend`).
- **Booleans:** Valueless attributes (`data-supermouse-magnetic`) resolve to `true`.
- **Inheritance:** By default, attributes and rules cascade up the DOM ancestor tree to the hovered target. Disable this via `inheritDataAttributes: false`.

---

## Hover Targets

`state.isHover` tracks whether the pointer is over an interactive element.

- **Default Selectors:** `a, button, input, textarea, [data-hover], [data-cursor]`
- **Override:** Pass `hoverSelectors` at construction to replace defaults.
- **Runtime Extension:** Call `addHoverSelectors()` with a comma-separated list to add selectors dynamically:

```typescript
app.addHoverSelectors(".cmd-palette-item, .dropdown-trigger");
```

---

## Opting Out (`data-supermouse-ignore`)

To preserve the native OS cursor over specific subtrees (e.g., canvas elements, code editors, or native widgets), apply `data-supermouse-ignore`:

```html
<div data-supermouse-ignore class="embedded-editor">
  <textarea placeholder="Native system cursor active here"></textarea>
</div>
```

When entering an ignored container, the engine clears `state.hoverTarget` and `state.interaction`, sets `state.isNative = true`, and hides the custom cursor stage.

---

## Cursor Modes

Set the suppression policy at construction via `cursor`, or at runtime using `setCursor()`:

| Mode       | Custom Stage                                        | Native Pointer                                               |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------ |
| `"auto"`   | Hidden over native form controls; visible otherwise | Hidden except over native form controls and ignored elements |
| `"custom"` | Always visible when input is active                 | Always hidden (`cursor: none !important`)                    |
| `"native"` | Never visible                                       | Always visible                                               |
| `"both"`   | Always visible when input is active                 | Always visible (coexists without suppression)                |

```typescript
// Temporarily yield to native cursor (e.g., active text editing or native popups)
app.setCursor("native");

// Restore standard automatic heuristics
app.setCursor("auto");
```

In `"auto"` mode, native pointers restore automatically over `<input>`, `<textarea>`, `<select>`, `[contenteditable]`, or elements with non-standard computed CSS cursors.

---

## Scoping to Containers

Scope pointer tracking, coordinate calculations, and element mounting to a specific DOM node:

```typescript
const modal = document.getElementById("checkout")!;

const app = new Supermouse({
  container: modal,
  cursor: "custom"
});
```

Setting a `container`:

1. Appends the stage using `position: absolute` instead of `fixed`.
2. Automatically assigns `position: relative` to static containers.
3. Transforms `state.pointer`, `state.target`, and `state.smooth` into container-relative coordinates.

> For interfaces with multiple independent cursor zones (e.g., artboards or sidebars), see the **[Scopes Guide](/docs/guide/scopes)**.

---

## Dynamic Plugin Management

Inspect, toggle, or control plugin lifecycles at runtime:

```typescript
const ring = app.getPlugin("ring"); // Returns SupermousePlugin | undefined

app.disablePlugin("ring"); // Halts update() and hides stage elements
app.enablePlugin("ring"); // Resumes update() and restores stage visibility
app.togglePlugin("ring");
```

If a plugin defines an asynchronous `beforeDisable` (or `onBeforeDisable`) hook, the engine awaits its returned Promise before hiding the DOM element (ideal for exit animations).

---

## Engine Lifecycle API

| Method           | Behavior                                                                                                                                        | `isEnabled` |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `enable()`       | Resumes event listeners, snaps coordinates to pointer, and reveals stage.                                                                       | `true`      |
| `disable(opts?)` | Halts event listeners, hides stage, and restores native pointer. Preserves physics state. Pass `{ reset: true }` to move coordinates offscreen. | `false`     |
| `reset()`        | Clears hover targets, interaction metadata, and resets coordinates offscreen.                                                                   | Unchanged   |
| `start()`        | Starts the `requestAnimationFrame` loop (called automatically unless `autoStart: false`).                                                       | —           |
| `step(time)`     | Advances the engine frame manually by timestamp (useful for headless testing).                                                                  | —           |
| `destroy()`      | Permanently teardowns listeners, stage elements, stylesheets, and plugins.                                                                      | `false`     |

```typescript
// Pause cursor tracking
app.disable();

// Resume tracking; coordinates snap cleanly to prevent offscreen warping
app.enable();
```

---

## Accessibility & Reduced Motion

Supermouse monitors `(prefers-reduced-motion: reduce)` media queries and flags changes in `state.reducedMotion`.

When reduced motion is active:

- Damping collapses (`lambda = 1000`) for instant pointer tracking without lag.
- Plugins should check `app.state.reducedMotion` to bypass heavy decorative transforms:

```typescript
update(app, dt) {
  if (app.state.reducedMotion) {
    dom.setTransform(el, app.state.smooth.x, app.state.smooth.y);
    return;
  }
  // Standard decorative animation logic
}

```

---

## Next Steps

- **[Scopes Guide](/docs/guide/scopes)**: Coordinate multi-region cursor behavior.
- **[Core API Reference](/docs/reference/api)**: Complete options, methods, and state schema.
- **[Writing Plugins](/docs/architecture/authoring)**: Build visual and logic plugins.
