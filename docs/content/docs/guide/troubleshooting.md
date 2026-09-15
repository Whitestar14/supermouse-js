---
title: Troubleshooting
description: Diagnose double cursors, missing cursors, jitter and plugins that stop updating.
section: Guide
order: 5
---

Start with the built-in audit when something looks wrong:

```typescript
import { doctor } from "@supermousejs/utils";

doctor(app); // run in the browser console
```

`doctor()` checks plugin priorities, `States` ordering, orphaned stage elements,
multiple live instances, container positioning, cursor mode vs. current state,
and scans the DOM for competing cursor styles. Call it with no argument to run
the DOM scan alone.

## The cursor appears twice

**Cause:** something else is also drawing a cursor. Supermouse only suppresses
the native pointer where it can reason about it — and it deliberately gives the
OS cursor back when an element's computed `cursor` is *not* one of
`default`, `auto`, `pointer`, `none`, `inherit`, `grab`, `grabbing`.

So a stylesheet like this is the usual culprit:

```css
.card {
  cursor: url("custom.png") 0 0, pointer;
}
```

The engine sees a non-standard cursor value, treats the element as native, and
un-hides the OS pointer while your custom stage is still visible.

**Fix:** delete the `cursor` declarations and describe the intent instead. Either
mark the element with `data-supermouse-ignore` to hand it fully back to the OS,
or use [`rules`](/docs/guide/usage#3-describe-interactions) and let a plugin
render the state:

```typescript
new Supermouse({ rules: { ".card": { text: "Open" } } });
```

Also avoid writing `cursor: none` yourself — the stage injects scoped
`cursor: none !important` rules for hover targets, and manual declarations fight
that injection.

## The cursor never shows up

Work down this list in order:

1. **No input yet.** The stage stays hidden until the first pointer move sets
   `state.hasReceivedInput`. The pointer starts parked at `(-100, -100)` on
   purpose, so the cursor does not fly in from a corner.
2. **Wrong cursor mode.** `cursor: "native"` hides the custom stage entirely.
3. **The instance is disabled or suspended.** Check `app.isEnabled`.
4. **Coarse pointer.** With `autoDisableOnMobile: true` (the default) a device
   reporting `(pointer: fine) === false` hibernates. Pass `enableTouch: true` if
   you really want a cursor on touch.
5. **`autoStart: false`.** You must call `app.start()` yourself.

## The cursor disappears behind a modal

The stage's stacking order comes from the [`zIndex`](/docs/reference/options)
option, which defaults to `9999`:

```typescript
new Supermouse({ zIndex: 100000 });
```

If the modal lives *inside* your cursor stage (rare), use the shared
[`Layers`](/docs/reference/utilities#css-constants) constants instead of literal
numbers so plugins stay consistent: `TRACE` 100, `FOLLOWER` 200, `CURSOR` 300,
`OVERLAY` 400 — all relative to the stage.

## The cursor freezes at an iframe or embed

Browsers stop dispatching pointer events to the parent document once the pointer
crosses into a cross-origin frame, so the engine simply stops receiving input.
Yield deliberately instead of fighting it:

```typescript
iframe.addEventListener("pointerenter", () => app.suspend());
iframe.addEventListener("pointerleave", () => app.resume());
```

`resume()` runs one plugin pass before the stage becomes visible again, so
nothing flashes at a stale coordinate.

## Two cursors in development (React / HMR)

React 18 Strict Mode mounts effects twice, and hot module replacement re-runs
module code. If you constructed an instance without cleaning it up, both are
still alive.

```typescript
useEffect(() => {
  const app = new Supermouse();
  return () => app.destroy();
}, []);
```

Or use the [React](/docs/integrations/react) / [Vue](/docs/integrations/vue)
adapter, which manages this for you.

## Movement stutters on a high-refresh display

Almost always this:

```typescript
// ❌ dt is in MILLISECONDS — damp() expects SECONDS
update(app, dt) {
  x = damp(x, target, 12, dt);
}

// ✅
update(app, dtMs) {
  const dt = dtMs / 1000;
  x = damp(x, target.x, 12, dt);
}
```

The engine passes `deltaTime` to plugins in **milliseconds** because that is what
you want for timers and one-shot effects, while the math helpers use seconds.
`damp()` needs the seconds form, and never hard-code per-frame increments like
`x += (target - x) * 0.1` — that is frame-rate dependent by definition.

## A plugin stops updating

If `update()` throws, the engine logs the error, sets the plugin to disabled,
and removes it after calling `onDisable` and `destroy`. One broken plugin will
not take down the pipeline, but it will go quiet. Check the console for:

```
[Supermouse] Plugin 'x' crashed and has been disabled.
```

During development, `doctor()` also flags logic plugins using a non-negative
priority, which is the most common cause of visual tearing rather than crashing.

## The cursor is offset inside a container

When a `container` is set, `state.pointer` and `state.smooth` are **relative to
that container**, not the viewport. Mixing the two coordinate spaces is the usual
cause of an offset cursor:

```typescript
// ✅ plugin update
dom.setTransform(el, app.state.smooth.x, app.state.smooth.y);

// ❌ viewport coordinates inside a scoped container
dom.setTransform(el, pointerEvent.clientX, pointerEvent.clientY);
```

If you need the bounds of a DOM element in the engine's coordinate space, use
`dom.projectRect(element, app.container)`.

## A console warning about the container

```
[Supermouse] container is not attached to the document
```

The container must be in the document before you construct the instance,
otherwise its size and position are measured as zero. Await your mount/nextTick
before creating the engine.

## It feels heavy

- Never read `getBoundingClientRect()`, `offsetWidth`, or `getComputedStyle()`
  inside `update()`. Use [`state.interaction`](/docs/reference/state#interaction)
  and [`state.shape`](/docs/reference/state#shape), which the engine caches for
  you.
- Prefer `transform` and `opacity` over layout properties.
- Reuse elements instead of creating them per frame — see how `Trail` and
  `Sparkles` pool their nodes.
- Turn plugins off rather than branching inside the loop:
  `app.disablePlugin("trail")`.
