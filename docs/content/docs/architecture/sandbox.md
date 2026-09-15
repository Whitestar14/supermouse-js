---
title: Stage & Sandbox
description: The DOM contract — where plugins render, how the native cursor is suppressed, and how geometry is cached.
section: Architecture
order: 3
---

Every instance owns a **Stage**: a single absolutely-positioned element that all
plugin visuals are appended to, plus a matching `<style>` tag that controls
native-cursor suppression. Plugins never touch the document body directly, which
is what keeps cleanup reliable and multiple instances from colliding.

## What the stage creates

```javascript
element.style = {
  position: isBody ? "fixed" : "absolute",
  inset: "0px",
  pointerEvents: "none",
  zIndex: String(options.zIndex), // default 9999
  opacity: "1",
  transition: "opacity 0.15s ease"
};
```

Alongside it, the stage:

- creates `<style id="supermouse-style-N">` in `<head>`,
- adds `supermouse-scope` and `supermouse-scope-N` classes to the container,
- remembers the container's original `position` (forcing `relative` if it was
  `static`) and original inline `cursor`, so `destroy()` can put them back.

The `N` is a module-level instance counter, so two cursors on one page get
separate style tags and scope classes rather than overwriting each other. Visual
plugins receive this element as their mount point through
[`app.stage`](/docs/reference/methods#container--stage).

## Native-cursor suppression

The target is not `cursor: none` on `*`. The stage keeps a focused selector set
of elements that need an explicit override:

```
a, button, input, textarea, select, [role="button"], [tabindex]
```

Every call to [`registerHoverTarget()`](/docs/reference/methods#registerhovertarget)
adds to that set (comma-separated groups are split and registered
individually), and the stylesheet is **rebuilt only when the set changes** — not
per frame, not per hover.

Two consequences worth internalising:

- Registering a hover target also suppresses the OS pointer over it. That is
  usually what you want, but it is why adding a broad selector like `div` to
  `hoverSelectors` will hide the native cursor across your whole page.
- Because suppression is scoped to the container's scope class, a cursor in a
  modal does not suppress pointers elsewhere in the document.

The stage only writes its cursor state when it actually changes
(`setNativeCursor` short-circuits on repeated values), which keeps the style
attribute from being touched 60 times a second.

## The DOM firewall

Reading layout inside an animation frame is the single biggest cause of cursor
jank, so the engine forbids itself from doing it. Geometry is read **when a hover
begins**, then cached.

```javascript
// once per hover entry, not per frame
const rect = element.getBoundingClientRect();
const style = getComputedStyle(element);
```

`parseDOMInteraction(element)` is the entry point. It runs on hover entry and
again each frame for the element currently under the pointer, but:

- **Selector matching is cached per element.** The list of matching `rules`
  selectors is only recomputed when the pointer moves to a different element.
- **Values are refreshed every frame.** Function-valued rules and `data-*`
  attributes are re-read on every pass, so `state.interaction` can drive
  animation, not just enter/exit states.

The merge order is: `rules` first, then the element's `data-*` attributes. That
makes attributes the override channel:

```html
<button class="btn-magnetic" data-supermouse-magnetic="0.8">Stronger</button>
```

Attribute names are read from `element.dataset`, filtered by the configured
`dataPrefix` (lower-cased for comparison), then camel-cased — so
`data-supermouse-mix-blend` becomes `interaction.mixBlend`. An empty value
resolves to `true`, which is how `data-supermouse-magnetic` works as a flag.

`state.interaction` is reassigned as a fresh object each pass, so compare fields
rather than object identity if you cache anything.

## Hover detection and `closest()`

All hover selectors are joined into a single string and passed to
`element.closest(...)`. The hover root is `document` when the container is the
body, and the container element otherwise.

```javascript
const hoverable = target.closest(hoverSelectorString);
if (hoverable) {
  state.isHover = true;
  state.hoverTarget = hoverable;
}
```

Because `closest()` returns the nearest ancestor **or self** matching *any* of
the selectors, compound selectors behave in a way that surprises people:

```html
<!-- registered: '[data-hover] a' -->
<div data-hover><a href="#">matched — the <a> matches and an ancestor matches</a></div>

<!-- registered: 'a [data-hover]' -->
<a href="#"><span data-hover>NOT the <span> — closest() returns the <a></span></a>
```

Prefer simple selectors, or register each part separately.

Rule evaluation uses a fast path for the same reason: a selector with no
whitespace goes straight to `element.matches()`, while descendant selectors fall
back to "matches the last compound **and** has a matching ancestor". That covers
the common `[data-hover] a` shape without a full selector engine.

## Container scoping and coordinates

When you pass a `container`, three things change:

1. The stage is `absolute` inside the container instead of `fixed` on the
   viewport, and the container is forced to `position: relative` if needed.
2. **Pointer coordinates are translated into container space**, by subtracting
   the container's bounding rect from every `pointermove`:

   ```javascript
   if (container !== document.body && containerRect) {
     x -= containerRect.left;
     y -= containerRect.top;
   }
   ```

3. Events outside the container are ignored, so a scoped cursor does not react
   to the rest of the page.

The container rect is tracked with `resize` and `scroll` listeners plus a
`ResizeObserver`, so a scrolling or resizing container does not drift the cursor.

The practical rule: **never mix coordinate spaces.** Plugin code should always
position from `state.smooth` / `state.target`, and when it needs the box of a DOM
element it should use `dom.projectRect(element, app.container)` — which is exactly
what `Magnetic` and `Stick` do.

## Teardown

`destroy()` on the stage removes the element and the style tag, drops the scope
classes, and restores the container's original `position` and inline `cursor`.
Since plugin elements are children of the stage, they disappear with it — but
[`app.destroy()`](/docs/reference/methods#destroy) still runs each plugin's
`destroy()` first so external listeners and timelines are disposed properly.

## Related

- [Plugin Authoring](/docs/architecture/authoring) — writing against this contract.
- [Troubleshooting](/docs/guide/troubleshooting) — offset cursors and layering.
