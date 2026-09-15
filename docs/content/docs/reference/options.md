---
title: Options
description: Every field of SupermouseOptions, with defaults and exact semantics.
section: Reference
order: 2
---

All fields are optional. The typed interface lives in `@supermousejs/core`.

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";

const app = new Supermouse({
  smoothness: 0.15,
  cursor: "auto",
  plugins: [Dot({ size: 8 })]
});
```

## Reference

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `smoothness` | `number` | `0.15` | Inverse response rate: `lambda = 2 / smoothness`. Lower is snappier, higher is laggier. |
| `hoverSelectors` | `string[]` | see below | Selectors that raise `state.isHover`. **Replaces** the defaults. |
| `cursor` | `"auto" \| "custom" \| "native" \| "both"` | `"auto"` | Native-pointer policy. |
| `plugins` | `SupermousePlugin[]` | `[]` | Registered during construction, in array order. |
| `enableTouch` | `boolean` | `false` | Allow the cursor on touch input. |
| `autoDisableOnMobile` | `boolean` | `true` | Hibernate when `(pointer: fine)` is false. |
| `hideOnLeave` | `boolean` | `true` | Park the cursor off-screen when the pointer leaves the viewport. |
| `container` | `HTMLElement` | `document.body` | Scope for rendering, hover detection and coordinates. |
| `autoStart` | `boolean` | `true` | Start the animation loop immediately. |
| `rules` | `Record<string, RuleDefinition>` | `{}` | Selector → interaction state. |
| `dataPrefix` | `string` | `"supermouse"` | Prefix for interaction data attributes. |
| `zIndex` | `number` | `9999` | `z-index` of the cursor stage. |

## `smoothness`

The response rate of the cursor, expressed as a divisor. The engine computes
`lambda = (1 / smoothness) * 2` and feeds it to exponential damping, so the
number is **inverse** to responsiveness:

| Value | `lambda` | Feel |
| :--- | :--- | :--- |
| `0.05` | 40 | Effectively instant |
| `0.10` | 20 | Tight |
| `0.15` | 13.3 | Default |
| `0.25` | 8 | Floaty |
| `0.50` | 4 | Heavy drift |

```typescript
new Supermouse({ smoothness: 0.08 }); // snappy, almost no trail
```

See [Physics Loop](/docs/architecture/physics) for the formula and the
100ms delta clamp.

## `hoverSelectors`

```typescript
// The default set, which this option replaces:
["a", "button", "input", "textarea", "[data-hover]", "[data-cursor]"]
```

When the pointer enters a matching element (or a descendant of one), the engine
sets `state.isHover` and `state.hoverTarget`. Passing this option replaces the
list; to extend it, register at runtime instead so you keep the defaults:

```typescript
app.registerHoverTarget(".cmd-palette-item");
```

Registering a hover target also adds it to the stage's native-cursor suppression
stylesheet.

## `cursor`

| Mode | Platform pointer | Stage visible |
| :--- | :--- | :--- |
| `"auto"` | `none` except over native elements | when input is enabled, input has been received, and the element is not native |
| `"custom"` | always `none` | when input is enabled and has been received |
| `"native"` | always visible | never |
| `"both"` | always visible | when input is enabled and has been received |

In `"auto"`, an element is considered native when it is an
`input`/`textarea`/`select`, is `contenteditable`, is inside
`[data-supermouse-ignore]`, or its computed `cursor` is something other than
`default`, `auto`, `pointer`, `none`, `inherit`, `grab` or `grabbing`.

Switch at runtime with [`setCursor()`](/docs/reference/methods#setcursor).

## `plugins`

Equivalent to calling [`use()`](/docs/reference/methods#use) for each entry —
the list is re-sorted by priority after each registration.

```typescript
new Supermouse({
  plugins: [Ring({ size: 24 }), Magnetic({ attraction: 0.4 })]
});
```

## `enableTouch` and `autoDisableOnMobile`

`autoDisableOnMobile` listens to `matchMedia("(pointer: fine)")` and hibernates
the engine when it is false, which is the correct default for phones and tablets.
If you genuinely want a cursor on a touch device, opt in explicitly:

```typescript
new Supermouse({ autoDisableOnMobile: false, enableTouch: true });
```

## `hideOnLeave`

When the pointer leaves the window, the engine sets
`state.hasReceivedInput = false` and parks the pointer at `(-100, -100)`. Plugins
should stop sourcing new particles and let existing ones finish — see
[when the pointer leaves](/docs/architecture/authoring#when-the-pointer-leaves).

Set it to `false` if you would rather the cursor stay where it was.

## `container`

Scopes the cursor to one element. The stage becomes `absolute` inside the
container, the container is forced to `position: relative` if it was `static`,
hover detection is limited to its subtree, **and pointer coordinates become
container-relative**.

```typescript
const modal = document.getElementById("checkout")!;
const app = new Supermouse({ container: modal });
```

The container must already be attached to the document, otherwise its measured
size is zero and the engine warns.

## `autoStart`

Set to `false` to control the loop yourself — useful for tests and for driving
frames from an external renderer:

```typescript
const app = new Supermouse({ autoStart: false });
app.step(0);
app.step(16.67);
```

## `rules`

Maps a CSS selector to interaction state, evaluated when the pointer enters a
matching element and refreshed every frame. Values may be static or a function
receiving the element:

```typescript
new Supermouse({
  rules: {
    ".btn-magnetic": { magnetic: 0.5 },
    "[data-tooltip]": (el) => ({ text: el.dataset.tooltip }),
    "a[target='_blank']": { text: "Opens in a new tab" }
  }
});
```

Resolution order is `rules` first, then the element's `data-*` attributes — so
attributes always win.

## `dataPrefix`

Changes the attribute namespace. With `dataPrefix: "cursor"` you write
`data-cursor-color`, `data-cursor-text`, and opt out with `data-cursor-ignore`:

```html
<button data-cursor-magnetic="0.6" data-cursor-text="Copy">Copy</button>
```

Keys are camel-cased after the prefix (`data-supermouse-mix-blend` becomes
`interaction.mixBlend`), and a valueless attribute resolves to `true`.

## `zIndex`

Applied inline to the stage element. Raise it above modal layers if the cursor
disappears behind them, and prefer the shared
[`Layers`](/docs/reference/utilities#css-constants) constants for ordering
*within* the stage.

```typescript
new Supermouse({ zIndex: 100000 });
```
