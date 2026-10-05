---
title: Cookbook
description: Working cursor combinations, each with the snippet that produces it.
section: Guide
order: 5
---

Every cursor people actually ask for is a combination of a few small plugins. This page collects the ones that come up again and again — each with a live preview you can move your pointer through, plus the snippet that produces it.

Pick a card to open the plugin it belongs to, or read straight down for the recipes.

:::callout{title="Desktop recommended" variant="note"}
The previews need a fine pointer. On a touch device the effect still renders, but the engine stays out of your way.
:::

:cookbook-grid

---

## A dot with a trailing ring

The classic. `Dot` renders straight at `state.target` — glued to your pointer — while `Ring` eases toward it at `state.smooth`. The gap between the two is the entire illusion of weight.

:cursor-demo{demo="dot-ring" title="Dot + Ring"}

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({ smoothness: 0.15, cursor: "custom" });

app.use(Ring({ size: 24, borderWidth: 2, color: "#ffffff" })).use(Dot({ size: 8 }));
```

Order in that chain doesn't matter: `use()` sorts by priority and both sit at `0`. Reach for `smoothness` when the ring feels either glued or sluggish.

## Magnetic buttons

`Magnetic` is a logic plugin (`priority: -10`). When the pointer nears an element marked `data-supermouse-magnetic`, it pulls `state.target` toward the element's centre — and a numeric attribute value overrides the configured attraction per button.

:cursor-demo{demo="magnetic" title="Magnetic pull"}

```typescript
import { Magnetic } from "@supermousejs/magnetic";

app.use(Magnetic({ attraction: 0.35, distance: 120 }));
```

```html
<button data-supermouse-magnetic>Default pull</button>
<button data-supermouse-magnetic="0.8">Strong pull</button>
```

The preview pairs it with `Dot`, which reads `target` directly. Anything positioned from `smooth` (like `Ring`) will still trail behind — see [Damping Physics](/docs/architecture/pipeline#exponential-damping-physics) for why.

## Morphing onto the hovered element

`Stick` is the other logic plugin: it measures the hovered element once, publishes its box as [`state.shape`](/docs/reference/api#scopes--interaction), and moves `state.target` to the element's centre. `SmartRing` morphs to that shape, and `Dot` politely hides itself while a shape is active because `hideOnShape` defaults to `true`.

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

Because `Stick` caches the measured box and the element's computed `border-radius`, nothing is re-measured while the pointer stays put.

## Swapping whole plugins on state

`States` turns plugins on and off based on the element under the pointer. It's a controller at `priority: -999`, so it runs before the plugins it manages — and it must be **registered after** them, because it resolves them by name at install time.

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

Pass `attribute` to drive it from your own attribute instead of `data-supermouse-state`. On `destroy()` the `default` set is restored, so you're never left with a half-disabled cursor.

## Trails and particles

Two ways to leave a mark behind the pointer — a fading history, and a scatter of particles. Both allocate a fixed pool up front and only move numbers afterwards, so neither touches layout inside `update()`.

:cursor-demo{demo="trail" title="Trail"}

```typescript
import { Trail } from "@supermousejs/trail";
import { Sparkles } from "@supermousejs/labs";

app.use(Trail({ length: 12, size: 6, color: "#6366f1" }));
app.use(Sparkles({ count: 24, decay: 2.5, frequency: 10, scatter: 5 }));
```

`Trail` walks its pool through a history buffer; `Sparkles` spawns a particle every `frequency` pixels of travel.

## Replacing the cursor with content

`Text`, `Image` and `Icon` swap the cursor for real content while hovering an element that asks for it. All three position from `state.smooth`, so they inherit the trailing feel of a ring.

:cursor-demo{demo="text" title="Text cursor"}

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

Styling is entirely yours — the plugin creates the element and toggles its visibility, nothing else:

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

## An arrow that knows where it's going

`Pointer` rotates an SVG to face the direction of travel and eases back to a resting angle when you stop. It reads `state.velocity`, so the arrow only turns while the pointer is genuinely moving.

:cursor-demo{demo="pointer" title="Directional pointer"}

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

## A branded icon set

`SmartIcon` is the batteries-included option: one DOM node, several SVG states, and automatic switching driven by semantic tags and interaction data. Reach for it when you want a coherent icon language without wiring each state by hand.

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

---

## Housekeeping

Two habits keep a cursor feeling expensive instead of heavy.

**Toggle plugins rather than branching inside `update()`.** A disabled plugin costs nothing per frame:

```typescript
app.disablePlugin("trail"); // e.g. while a heavy panel is open
app.enablePlugin("trail");
```

When a plugin needs an exit animation, put it in `beforeDisable` — `SmartRing` fades and shrinks for 150 ms, and the core waits for that promise before hiding the element.

**Respect the user's motion preference.** The engine already collapses its own smoothing when [`state.reducedMotion`](/docs/reference/api#pointer--environment-flags) is true, but decorative motion is still up to you:

```typescript
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  app.disablePlugin("sparkles");
}
```

## Two cursors on one page

A page cursor plus a region that behaves differently is a [scope](/docs/guide/scopes), not a second instance — one animation loop, one `state`, automatic hand-off:

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

Hovering the canvas stands the page cursor's plugins down and enables the region's own; leaving re-syncs the page cursor at the pointer instead of travelling back from the region. A scope owns its hover semantics too, which is how a preview can describe elements without leaking those descriptions into the rest of the page.
