---
title: The Pipeline
description: The exact order of operations inside a single frame, from pointer input to plugin render.
section: Architecture
order: 1
---

Supermouse runs one `requestAnimationFrame` loop per instance. Everything —
input, logic, physics, rendering — happens inside a single deterministic pass
with a fixed order. Knowing that order is what lets you predict whether a plugin
should read `target` or `smooth`, and why a logic plugin needs a negative
priority.

## One frame, in order

```javascript
function update(time) {
  // 1. Delta time, clamped so a background tab cannot teleport the cursor
  const dtMs = time - lastTime;
  const dt = Math.min(dtMs / 1000, 0.1);
  lastTime = time;

  // 2. Hover bookkeeping (cached selector matches, fresh values)
  const target = input.getCurrentTarget();
  if (target && !target.isConnected) input.clearHover();
  else if (target) input.parseDOMInteraction(target);

  // 3. Stage visibility + native-cursor suppression for this frame
  stage.setVisibility(resolveStageVisibility());
  if (input.isEnabled) stage.setNativeCursor(resolveCursorState());

  // 4. Intent: the raw pointer becomes the default destination
  if (input.isEnabled && state.hasReceivedInput) {
    state.target.x = state.pointer.x;
    state.target.y = state.pointer.y;
  }

  // 5. Plugins, sorted by priority — logic (< 0) before visuals (>= 0)
  for (const plugin of plugins) plugin.update(app, dtMs); // note: milliseconds

  // 6. Physics — after plugins, so logic edits land this frame
  if (input.isEnabled) {
    const lambda = state.reducedMotion ? 1000 : (1 / smoothness) * 2;

    const px = state.smooth.x;
    const py = state.smooth.y;

    state.smooth.x = damp(state.smooth.x, state.target.x, lambda, dt);
    state.smooth.y = damp(state.smooth.y, state.target.y, lambda, dt);

    state.displacement.x = state.target.x - state.smooth.x;
    state.displacement.y = state.target.y - state.smooth.y;

    state.velocity.x = (state.smooth.x - px) / dt; // px per second
    state.velocity.y = (state.smooth.y - py) / dt;

    if (Math.abs(state.velocity.x) > 0.1 || Math.abs(state.velocity.y) > 0.1) {
      state.angle = Math.atan2(state.velocity.y, state.velocity.x) * (180 / Math.PI);
    }
  }
}
```

## What this means in practice

**`state.target` is fresh; `state.smooth` is one frame behind.** `target` is
rewritten from `pointer` at step 4, so anything reading it gets this frame's
input. `smooth` is only advanced at step 6 — *after* plugins run — so a visual
plugin reading `smooth` sees the value produced at the end of the previous frame.
This is exactly why `Dot` renders at `target` (crisp, pinned to the real pointer)
while `Ring` renders at `smooth` (trailing).

**Logic runs before physics, because both live in step 5.** A plugin with
`priority: -10` rewrites `state.target`, and step 6 damps toward that rewritten
value in the *same* frame. A plugin with `priority: -999` — like `States` — runs
before even those, which is how it can toggle the plugins that would otherwise
have already run this frame.

**Plugins always run; only physics is gated.** Steps 4 and 6 are skipped when
input is disabled (`disable()`, `suspend()`, or a coarse pointer), but step 5
still executes. That keeps plugins able to animate out during a suspension, and
it is why `resume()` triggers one extra plugin pass before showing the stage.

**Delta time arrives in milliseconds.** The core uses seconds internally for
`damp()`, but hands plugins `dtMs`, because that is the useful unit for timers
and one-shot effects. Divide by 1000 before calling any math helper.

## The loop itself

- The loop starts automatically unless [`autoStart: false`](/docs/reference/options),
  and can be driven manually with `start()` and `step(time)`.
- It pauses while `document.hidden` is true and resumes on visibility change,
  resetting `lastTime` so the first frame back has a sane delta.
- `dt` is clamped to 100ms. Without that clamp, a backgrounded tab would hand the
  smoothing function a huge delta and the cursor would jump on return.

## Failure isolation

Each plugin runs inside a guarded call:

```javascript
try {
  plugin.update?.(app, dtMs);
} catch (error) {
  plugin.isEnabled = false;
  crashedPlugins.push(plugin);
}
```

After the plugin loop, crashed plugins are removed from the list and their
`onDisable` / `destroy` hooks run, their stage elements are discarded, and the
error is logged. A single bad plugin cannot stall or blank the cursor.

## Native-cursor resolution

Two small functions decide whether the OS pointer is visible and whether the
custom stage is:

| `cursor` mode | Platform cursor | Stage visible when |
| :--- | :--- | :--- |
| `"auto"` | `none` unless the hovered element is native | input enabled, not native, and input has been received |
| `"custom"` | always `none` | input enabled and input has been received |
| `"native"` | always `auto` | never |
| `"both"` | always `auto` | input enabled and input has been received |

"Native element" means an `input`, `textarea` or `select`, a `contenteditable`
element, an element inside `[data-supermouse-ignore]`, or an element whose
computed `cursor` is a value the author clearly chose.

## Related

- [Physics Loop](/docs/architecture/physics) — the damping function itself.
- [Stage & Sandbox](/docs/architecture/sandbox) — the DOM contract.
- [State reference](/docs/reference/state) — every field and who writes it.
