---
title: Troubleshooting
description: Double cursors, missing cursors, offset cursors, jitter, and plugins that go quiet.
section: Guide
order: 6
---

Start here when something looks wrong:

```typescript
import { doctor } from "@supermousejs/utils";

doctor(app); // run in the browser console
```

It checks plugin priorities, `States` ordering, orphaned stage elements, competing instances, container position, cursor mode against live state, and inline `cursor` styles. Call it with no argument for the DOM scan alone.

## The cursor appears twice

Something else is drawing a cursor. Supermouse only suppresses the OS pointer where it can reason about it, and it deliberately hands the pointer back when an element's computed `cursor` is not one of `default`, `auto`, `pointer`, `none`, `inherit`, `grab`, `grabbing`.

So this is the usual culprit:

```css
.card {
  cursor: url("custom.png") 0 0, pointer;
}
```

The engine sees a non-standard value, treats the element as native, and un-hides the OS pointer while your stage is still visible.

**Fix:** delete the declaration and describe the intent instead. Mark the element `data-supermouse-ignore` to hand it fully back to the OS, or use [`rules`](/docs/guide/usage#_3-describe-interactions) and let a plugin render the state:

```typescript
new Supermouse({ rules: { ".card": { text: "Open" } } });
```

Never write `cursor: none` yourself either — the stage injects scoped `cursor: none !important` rules, and a manual declaration fights that injection.

## The cursor never shows up

Work down this list:

1. **No input yet.** The stage stays hidden until the first pointer move sets `state.hasReceivedInput`. The pointer starts at `(-100, -100)` on purpose, so it does not fly in from a corner.
2. **Wrong cursor mode.** `cursor: "native"` hides the stage entirely.
3. **The instance is disabled.** Check `app.isEnabled`.
4. **Coarse pointer.** With `autoDisableOnMobile: true` (the default) a device reporting `(pointer: fine) === false` hibernates.
5. **`autoStart: false`.** You have to call `app.start()`.

## The cursor disappears behind a modal

Stacking comes from [`zIndex`](/docs/reference/options#zindex), which defaults to `9999`:

```typescript
new Supermouse({ zIndex: 100000 });
```

If the modal lives *inside* your cursor stage — rare — use the shared [`Layers`](/docs/reference/utilities#css-constants) constants instead of literal numbers, so plugins stay consistent with each other.

## The cursor freezes over an iframe or embed

Once the pointer crosses into a cross-origin frame, browsers stop dispatching events to the parent document, so the engine simply stops hearing about it. Yield deliberately:

```typescript
iframe.addEventListener("pointerenter", () => app.disable({ reset: true }));
iframe.addEventListener("pointerleave", () => app.enable());
```

`reset` clears the parked position, `shape` and `interaction`, so the cursor does not reappear at a stale coordinate.

## Two cursors in development (React, HMR)

React 18 Strict Mode mounts effects twice and HMR re-runs module code. An instance you constructed without cleaning up is still alive.

```typescript
useEffect(() => {
  const app = new Supermouse();
  return () => app.destroy();
}, []);
```

Or use the [React](/docs/integrations/react) / [Vue](/docs/integrations/vue) adapter, which does it for you.

## Movement stutters on a high-refresh display

Almost always this:

```typescript
// ❌ dt is in MILLISECONDS, damp() takes SECONDS
update(app, dt) {
  x = damp(x, target, 12, dt);
}

// ✅
update(app, dtMs) {
  x = damp(x, target.x, 12, dtMs / 1000);
}
```

The engine hands plugins `deltaTime` in milliseconds because that is the useful unit for timers and one-shot effects, while the math helpers use seconds. And never write `x += (target - x) * 0.1` — that is frame-rate dependent by definition.

## A plugin stops updating

If `update()` throws, the engine logs it, disables the plugin, and removes it on the next frame after `onDisable` and `destroy`. One broken plugin will not take down the pipeline, but it will go quiet:

```
[Supermouse] Plugin 'x' crashed and has been disabled.
```

`doctor()` also flags logic plugins sitting at a non-negative priority, which is the common cause of visual tearing rather than a crash.

## The cursor is offset inside a container

With a `container` set, `state.pointer` and `state.smooth` are **relative to that container**, not the viewport. Mixing the two spaces is the usual cause:

```typescript
// ✅ inside a plugin
dom.setTransform(el, app.state.smooth.x, app.state.smooth.y);

// ❌ viewport coordinates in a scoped container
dom.setTransform(el, pointerEvent.clientX, pointerEvent.clientY);
```

For an element's bounds in the engine's space, use `dom.projectRect(element, app.container)`.

## A console warning about the container

```
[Supermouse] container is not attached to the document
```

The container has to be in the document before the instance is constructed, or its size and position measure as zero. Await mount — `nextTick()` in Vue, an effect in React — before creating the engine.

## Non-mouse input moves the cursor

`autoDisableOnMobile: false` also removes the per-event touch filter, so a finger drag on a hybrid device drives the cursor. Add `enableTouch: false` if you want the engine running on that device but only for the mouse. See [enableTouch and autoDisableOnMobile](/docs/reference/options#enabletouch-and-autodisableonmobile).

## It feels heavy

- Never call `getBoundingClientRect()`, `offsetWidth` or `getComputedStyle()` inside `update()`. Use [`state.interaction`](/docs/reference/state#interaction) and [`state.shape`](/docs/reference/state#shape), which the engine caches for you.
- Prefer `transform` and `opacity` over layout properties.
- Reuse elements instead of creating them per frame — `Trail` and `Sparkles` pool their nodes.
- Turn plugins off instead of branching inside the loop: `app.disablePlugin("trail")`.
