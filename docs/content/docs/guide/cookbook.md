---
title: Cookbook
description: Copy-paste cursor combinations, each verified against the plugin option surfaces.
section: Guide
order: 4
---

Every card below is generated from the playground recipes, so it always matches
what the Studio can open. The snippets underneath are the canonical way to
achieve each effect in your own app.

:::callout{title="Desktop recommended" variant="note"}
Real-time physics editing needs a precise pointer, but every recipe is also
listed under [/labs](/labs).
:::

:cookbook-grid

## The baseline: trailing ring + precision dot



`Dot` renders at `state.target` (the raw pointer), while `Ring` renders at `state.smooth` (the damped position). Pairing them gives the classic effect: an
instant dot with a lagging outline. Try it — hover into the preview and open
**Controls** to reshape it live.

:cursor-demo{demo="dot-ring" title="Dot + Ring"}

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({ smoothness: 0.15, cursor: "custom" });

app.use(Ring({ size: 24, borderWidth: 2, color: "#ffffff" })).use(Dot({ size: 8 }));
```

Note that the plugin list is ordered visuals-first here. That is only for
readability — `use()` sorts by `priority`, so registration order does not affect
the frame order for plugins that share a priority.

## Magnetic buttons

`Magnetic` is a **logic** plugin (`priority: -10`): it rewrites `state.target`
so the cursor is pulled toward the centre of the hovered element. It activates
on elements carrying `data-supermouse-magnetic`, and a numeric attribute value
overrides the configured attraction.

:cursor-demo{demo="magnetic" title="Magnetic pull"}

```typescript
import { Magnetic } from "@supermousejs/magnetic";

app.use(Magnetic({ attraction: 0.35, distance: 120 }));
```

```html
<button data-supermouse-magnetic>Default pull</button>
<button data-supermouse-magnetic="0.8">Strong pull</button>
```

## Shape morphing onto the hovered element

`Stick` is the other logic plugin: it writes the hovered element's bounding box
into [`state.shape`](/docs/reference/state#shape) and moves `state.target` to its
centre. `SmartRing` consumes that shape and morphs to it. `Dot` hides itself
automatically while a shape is active (`hideOnShape` defaults to `true`).

```typescript
import { Stick } from "@supermousejs/stick";
import { SmartRing } from "@supermousejs/labs";
import { Dot } from "@supermousejs/dot";

app.use(Stick({ padding: 10 }));
app.use(
  SmartRing({ size: 20, hoverSize: 40, fill: "transparent", borderWidth: 2 })
);
app.use(Dot({ size: 6, hideOnShape: true }));
```

```html
<a href="/pricing" data-supermouse-stick>Pricing</a>
```

`Stick` caches the measured box and the computed `border-radius` per element, so
the geometry is read once on hover rather than every frame.

:cursor-demo{demo="stick" title="Shape morphing"}

## State-driven plugin sets

`States` enables and disables whole plugins based on the element under the
pointer. It is a logic plugin with `priority: -999`, so it runs before the
plugins it manages — and it must be **registered after** them.

```typescript
import { States } from "@supermousejs/states";

// Register the plugins this will manage first
app.use(Ring({ size: 24 }));
app.use(Text({ className: "cursor-label" }));

app.use(
  States({
    default: [],
    states: {
      hover: ["ring"],
      labelled: ["ring", "text"]
    }
  })
);
```

```html
<a href="#" data-supermouse-state="hover">Ring appears</a>
<button data-supermouse-state="labelled" data-supermouse-text="Copy">Copy</button>
```

Use the `attribute` option to scope this to your own attribute instead of
`data-supermouse-state`. On `destroy()` the plugin restores the `default` set so
you are never left with a half-disabled cursor.

## Trails and particles

```typescript
import { Trail } from "@supermousejs/trail";
import { Sparkles } from "@supermousejs/labs";

app.use(Trail({ length: 12, size: 6, color: "#6366f1" }));
app.use(Sparkles({ count: 24, decay: 0.9, frequency: 0.35, scatter: 2 }));
```

`Trail` renders a fixed pool of segments at decreasing size and opacity, moving
them through a history buffer — no DOM allocation in `update()`. `Sparkles`
follows the same idea with a particle pool.

:cursor-demo{demo="trail" title="Trail"}

## Content-replacing cursors

`Text`, `Image` and `Icon` swap the cursor for content while hovering an element
that declares it. All three reposition on `state.smooth`, so they inherit the
same trailing feel as `Ring`.

```typescript
import { Text } from "@supermousejs/text";
import { Image } from "@supermousejs/image";

app.use(Text({ className: "cursor-tooltip", offset: [16, 16], duration: 150 }));
app.use(Image({ className: "cursor-preview", offset: [0, 30], smoothness: 0.2 }));
```

```html
<a href="/work" data-supermouse-text="View case study">Case study</a>
<a href="/shot" data-supermouse-img="/thumbnails/shot.jpg">Screenshot</a>
```

Style the tooltip with your own class — the plugin only creates the element and
manages visibility:

```css
.cursor-tooltip {
  font: 600 11px/1.2 var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: #18181b;
  color: #fff;
  padding: 6px 8px;
}
```

## Directional pointer

`Pointer` rotates an SVG to face the direction of travel and eases back to a
resting angle when you stop.

```typescript
import { Pointer } from "@supermousejs/pointer";

app.use(
  Pointer({
    size: 32,
    rotationSmoothing: 0.2,
    restingAngle: -45,
    returnToRest: true,
    restDelay: 250
  })
);
```

It reads `state.velocity` (real px/s) rather than the tracking error, so the
arrow only turns while the pointer is actually moving.

## Layering a branded state machine

`SmartIcon` is the batteries-included option: one DOM node, many SVG states, and
automatic switching based on semantic tags and interaction attributes.

```typescript
import { SmartIcon } from "@supermousejs/labs";

app.use(
  SmartIcon({
    icons: {
      default: "<svg>…</svg>",
      pointer: "<svg>…</svg>",
      text: "<svg>…</svg>",
      grab: "<svg>…</svg>"
    },
    size: 24,
    useSemanticTags: true,
    transitionDuration: 120
  })
);
```

## Keeping the hot path cheap

Prefer toggling plugins over building conditionals inside `update()`:

```typescript
app.disablePlugin("trail"); // while a heavy panel is open
app.enablePlugin("trail");
```

Defer the work to `onBeforeDisable` when the plugin needs an exit animation —
`SmartRing` does exactly this, fading and shrinking for 150ms before the core
hides the element.

## Respecting user preferences

```typescript
import { Supermouse } from "@supermousejs/core";

const app = new Supermouse({ smoothness: 0.15 });

if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  app.disablePlugin("sparkles");
}
```

The engine already collapses its own smoothing when
[`state.reducedMotion`](/docs/reference/state#reducedmotion) is true; this is
about your decorative plugins.
