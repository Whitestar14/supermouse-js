---
title: Cookbook
description: Working cursor combinations, each with the snippet that produces it.
section: Guide
order: 5
---

The cards below are auto-discovered from the docs' recipe folder, so they always match what the Studio can open. The snippets under each section are the canonical way to build the same thing in your own app.

:::callout{title="Desktop recommended" variant="note"}
Every preview needs a fine pointer, and the recipes are also plain URLs under [/labs](/labs).
:::

:cookbook-grid

## Dot plus trailing ring

`Dot` renders at `state.target`, `Ring` at `state.smooth`. Pairing them is the classic effect: an instant dot with a lagging outline. Hover into the preview and open **Controls** to reshape it live.

:cursor-demo{demo="dot-ring" title="Dot + Ring"}

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({ smoothness: 0.15, cursor: "custom" });

app.use(Ring({ size: 24, borderWidth: 2, color: "#ffffff" })).use(Dot({ size: 8 }));
```

Order in that chain does not matter: `use()` sorts by priority and both sit at `0`.

## Magnetic buttons

`Magnetic` is a logic plugin (`priority: -10`). On a hovered element carrying `data-supermouse-magnetic` it writes a pulled position into `state.target`, and a numeric attribute value overrides the configured attraction.

:cursor-demo{demo="magnetic" title="Magnetic pull"}

```typescript
import { Magnetic } from "@supermousejs/magnetic";

app.use(Magnetic({ attraction: 0.35, distance: 120 }));
```

```html
<button data-supermouse-magnetic>Default pull</button>
<button data-supermouse-magnetic="0.8">Strong pull</button>
```

The preview pairs it with `Dot`, and that pairing is the point: `target` is a per-frame channel read by plugins that run after the logic plugin, and `Dot` is the only official plugin that reads it. A ring-only cursor will not move. See [the three channels](/docs/architecture/authoring#the-three-channels).

## Morphing onto the hovered element

`Stick` is the other logic plugin. It measures the hovered element once, publishes its box as [`state.shape`](/docs/reference/state#shape), and moves `state.target` to its centre. `SmartRing` consumes the shape and morphs to it, and `Dot` hides itself while a shape is active because `hideOnShape` defaults to `true`.

:cursor-demo{demo="stick" title="Shape morphing"}

```typescript
import { Stick } from "@supermousejs/stick";
import { SmartRing } from "@supermousejs/labs";
import { Dot } from "@supermousejs/dot";

app.use(Stick({ padding: 10 }));
app.use(SmartRing({ size: 20, hoverSize: 44, fill: "transparent", borderWidth: 2 }));
app.use(Dot({ size: 6, hideOnShape: true }));
```

```html
<a href="/pricing" data-supermouse-stick>Pricing</a>
```

`Stick` caches the measured box and the element's computed `border-radius`, so nothing is measured again while the pointer stays put.

## State-driven plugin sets

`States` enables and disables whole plugins based on the element under the pointer. It is a controller at `priority: -999`, so it runs before the plugins it manages — and it must be **registered after** them, since it resolves them by name when it installs.

```typescript
import { States } from "@supermousejs/states";

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

Use `attribute` to drive it from your own attribute instead of `data-supermouse-state`. `destroy()` restores the `default` set, so you are never left with a half-disabled cursor.

## Trails and particles

```typescript
import { Trail } from "@supermousejs/trail";
import { Sparkles } from "@supermousejs/labs";

app.use(Trail({ length: 12, size: 6, color: "#6366f1" }));
app.use(Sparkles({ count: 24, decay: 2.5, frequency: 10, scatter: 5 }));
```

:cursor-demo{demo="trail" title="Trail"}

Both allocate a fixed pool in `create()` and only move numbers afterwards. `Trail` walks its pool through a history buffer; `Sparkles` spawns a particle every `frequency` pixels of travel. Neither reads layout in `update()`.

## Content-replacing cursors

`Text`, `Image` and `Icon` swap the cursor for content while hovering an element that declares it. All three position from `state.smooth`, so they inherit the trailing feel of a ring.

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

Style the tooltip yourself — the plugin creates the element and manages visibility, nothing else:

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

:cursor-demo{demo="text" title="Text cursor"}

## Directional pointer

`Pointer` rotates an SVG to face the direction of travel and eases back to a resting angle when you stop. It reads `state.velocity`, so the arrow only turns while the pointer is genuinely moving.

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

:cursor-demo{demo="pointer" title="Directional pointer"}

## Layering a branded state machine

`SmartIcon` is the batteries-included option: one DOM node, several SVG states, and automatic switching driven by semantic tags and interaction data.

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

Toggle plugins rather than writing conditionals inside `update()`:

```typescript
app.disablePlugin("trail"); // while a heavy panel is open
app.enablePlugin("trail");
```

When the plugin needs an exit animation, put it in `beforeDisable` — `SmartRing` fades and shrinks for 150ms, and the core does not hide the element until that promise resolves.

## Respecting user preferences

```typescript
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  app.disablePlugin("sparkles");
}
```

The engine already collapses its own smoothing when [`state.reducedMotion`](/docs/reference/state#reducedmotion) is true. This is about your decorative motion.

## Two cursors on one page

A page cursor plus a region that behaves differently is a [scope](/docs/guide/scopes), not a second instance: one animation loop, one `state`, automatic hand-off.

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Magnetic } from "@supermousejs/magnetic";

const app = new Supermouse({
  smoothness: 0.15,
  plugins: [Dot({ size: 8 })],
  scopes: [
    {
      name: "canvas",
      container: document.getElementById("drawing")!,
      cursor: "custom",
      plugins: [Magnetic({ attraction: 0.6, distance: 80 })]
    }
  ]
});
```

Hovering the canvas stands the page cursor's plugins down and enables the region's own; leaving re-syncs the page cursor at the pointer instead of travelling back from the region. A scope also owns its hover semantics, which is how a preview can describe elements without leaking those descriptions into the rest of the page.
