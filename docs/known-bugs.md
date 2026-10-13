# Known bugs

## 1. Exit animations run in the incoming scope's coordinate frame

**Status:** open, covered by a skipped test
**Where:** `packages/core/src/internal/Input.ts`, `setActiveScope`
**Test:** `packages/core/src/__tests__/scope-exit-frame.spec.ts` (`it.skip`)

### Symptom

When leaving a scope, plugins with an exit transition (via `onBeforeDisable` or
`onDisable`) start from the wrong position and jump as they leave.

### Why it happens

`setActiveScope` does its work in this order:

1. set `this.activeScope`
2. re-translate the pointer into the new scope's frame and snap
   `state.smooth` to it
3. fire `onActiveScopeChange(scope)` — which deactivates the outgoing scope's
   plugins

Step 3 is what deactivates the outgoing plugins, so by the time their
`onBeforeDisable` runs, `state.smooth` has already been re-expressed in the
incoming frame. Anything reading `state.smooth` in an exit transition reads
coordinates offset by the container delta — the container in the test sits at
`(300, 600)`, so the plugin sees `(50, 50)` where it was drawn at `(200, 200)`.

---

## 2. In-scope pointer coordinates go stale when the page scrolls

**Status:** open, reproduced in the browser against the docs site
**Where:** `packages/core/src/internal/Input.ts`, `applyPointerToState`
**Affects:** any scope whose container is not the viewport (i.e. every nested scope)

### Symptom

Hover the `/docs/plugins/image` preview, then wheel-scroll without moving the
pointer. The image peek (and any plugin positioned from `state.pointer`) stays
where it was while the container slides up under the pointer, until the next
`pointermove`. Scrolling back re-aligns it, one move later.

### Why it happens

`state.pointer` is viewport coordinates translated into the active scope's frame
by subtracting the container's bounding rect, and that translation runs **only
inside `handleMove`**. `update()` re-syncs `state.target` from `state.pointer`
every frame, so it happily keeps re-applying a stale origin. The viewport scope
is unaffected because its rect is `(0, 0)` permanently — the drift only exists
for nested scopes, where it is exactly the scroll delta.

A `resettle()` (or any programmatic scope transition) does not fix it either:
it re-reads the element under the pointer but not the pointer's local frame.

### Where to look next

Re-translate on `scroll` (capture, passive), coalesced into one rAF so a wheel
burst costs a single `getBoundingClientRect`; or diff the container rect in
`update()` when `hasSeenPointer` and the active scope is not the viewport. Worth
checking whether hover state should be resettled at the same time: while the
container moves under a stationary pointer, `elementFromPoint` sees a different
element than `hoverTarget` records, which is the same class of drift.

---

## 3. `isEnabled` never reflects `autoDisableOnMobile`

**Status:** open, by inspection (the docs work around it)
**Where:** `packages/vue/src/index.ts` (`provideSupermouse`), `packages/react/src/index.tsx`

### Symptom

The context's `isEnabled` ref starts `true` and only changes when
`mouse.enable()` / `mouse.disable()` are called. `autoDisableOnMobile` flips the
engine off from `Input`'s `(pointer: fine)` media-query listener, which calls the
engine's internal `onEnableChange` callback — the bindings never hear about it.
So on a phone, `isEnabled` reports `true` while `mouse.isEnabled` is `false`.

### Why it matters

The docs cannot gate the interactive previews on it (they use the same media
query in CSS instead), and any consumer doing `v-if="isEnabled"` to hide cursor
affordances gets it wrong on touch for the same reason.

### Where to look next

Give the core a public subscribe hook (`options.onEnableChange`, or an
`enabledchange` event) and have both bindings carry it into their ref. That also
covers the reverse case: a hybrid device gaining a mouse mid-session.

---

## 4. A negative `deltaTime` diverges the smoothing instead of settling it

**Status:** open, reproduced in the browser by hand-driving `step()`
**Where:** `packages/core/src/Supermouse.ts`, `update()`
**Affects:** any second clock driving `step()`, and fixtures that pass fixed
timestamps

### Symptom

`state.smooth` runs away — on the showcase stage a ring actor was drawn at
`translateX(-2.2e7)`, and the position keeps growing for as long as the negative
frames last. Nothing throws and no warning is logged.

### Why it happens

```ts
const dtMs = time - this.lastTime;
const dt = Math.min(dtMs / 1000, 0.1);
```

The clamp is one-sided. `time < lastTime` yields a **negative** `dt`, and the
smoothing factor is `1 - Math.exp(-lambda * dt)`, whose argument is now
positive: `exp` grows, the factor goes negative and large, and
`lerp(a, b, factor)` pushes `a` past `b` by an ever-growing margin. Each negative
frame multiplies the error rather than damping it.

Two ways to get there in practice:

- Two drivers. The engine's own rAF loop advances `lastTime`; anything else
  calling `step()` with an earlier timestamp — a second loop, a test harness, a
  manual probe — hands it a negative delta. `engine-lab/src/lib/driver.ts`
  exists precisely to drive `step()` from outside the engine, so this is the
  intended integration path, not an exotic one. It is safe today only because
  every lab builds with `autoStart: false`.
- Fixed timestamps in fixtures. `packages/core/src/__tests__/regression.spec.ts`
  calls `app.step(1000)`, and the shared helpers use `performance.now() + dtMs`.
  Mixing the two conventions in one test file goes backwards in wall-clock terms.

### Where to look next

Clamp both ends (`Math.max(0, Math.min(dtMs / 1000, 0.1))`) and decide what a
backwards timestamp should mean — most likely "treat as zero", so the frame is
skipped rather than folded into physics. Worth asserting in a test that a
non-monotonic `step()` leaves `state.smooth` finite, since the failure is silent.

---

## 5. Plugins see `state.velocity` one frame late, and zero on the first

**Status:** open, by inspection; cost a test in `packages/labs`
**Where:** `packages/core/src/Supermouse.ts`, `update()`
**Affects:** every plugin whose shape depends on speed

### Symptom

A plugin that sizes itself from `state.velocity` draws one frame behind the
pointer. On the frame right after input begins it sees exactly `0` and renders
as if the pointer were stationary, and on the very first frame after a scope
activates there is no velocity to speak of at all.

### Why it happens

The plugin loop runs **before** the smoothing block that writes `velocity`:

```ts
for (const plugin of activeScope.plugins) this.runPluginSafe(plugin, dtMs);
// …then target, smooth, displacement and velocity are recomputed
```

So `velocity` is always the previous frame's, and `angle` is derived from it.
Compounding it, the first `pointermove` sets
`target = smooth = pointer` (a snap, intentionally, to avoid a sweep in from
off-screen) — which produces no movement, hence no velocity on the frame after
the first move.

### Where to look next

Either recompute the derived motion values before the plugin loop, or document
that plugins consume last frame's velocity (the labs plugins already guard for
it: see the `started` flags in `MotionBlur` and `Comet`). The current split is
the confusing option, because the _position_ fields are current while the
_velocity_ fields are stale in the same frame.

---

## 6. Visual plugins assume the stage sits at the viewport origin

**Status:** open, by inspection; shared by every visual plugin
**Where:** `packages/utils/src/dom.ts` (`setTransform`), all visual plugins
**Affects:** scopes whose container is not the viewport, and pages that scroll

### Symptom

Actors land offset from the pointer by the container's top-left corner. For a
scope bound to an element at `(300, 600)`, the whole cursor is drawn 300px right
and 600px down and slowly converges or stays put, depending on the plugin.

### Why it happens

Every plugin positions with `setTransform(el, state.smooth.x, state.smooth.y)`.
Those coordinates are the pointer **translated into the active scope's frame**
by subtracting the container rect, but the transform is applied inside the
stage, whose own origin is the container's padding box. The two only agree when
the container's rect is `(0, 0)`. The docs site works because its preview
containers are positioned at the viewport origin or the demos use the primary
scope; nothing enforces the invariant.

This is the same missing translation as bug 2, reached from the other side:
bug 3 is the origin going stale, this is the origin never having been applied.
The utility that would fix both is a plugin-facing "pointer in stage space"
accessor — `dom.projectRect` exists for elements but there is no equivalent for
the pointer.

### Where to look next

Expose a scoped, stage-relative pointer on `MouseState` (or a helper plugins opt
into) rather than making every plugin remember to subtract a rect it has no
access to. Until then, a container that is not at the origin needs its own
plugin-side offset, which no shipped plugin currently does.

---

## 7. Canvas-based plugins cannot be exercised under jsdom

**Status:** open, worked around in `packages/labs/src/__tests__/art.spec.ts`
**Where:** the test environment, not the library (`packages/labs/vitest.config.ts`)

### Symptom

`canvas.getContext("2d")` returns `null` in jsdom unless the native `canvas`
package is installed, and jsdom logs a `Not implemented` error to the virtual
console for every call. Three labs plugins are built on a 2-D context
(`Calligraphy`, `ASCII`, and the `Fluid` work still to come), and each one
degrades to a silent no-op: `createSurface()` returns `null`, `update()` returns
early, and a test that only asserts "mounts without error" passes while proving
nothing at all.

### Why it matters

The most valuable parts of those plugins — the tapered stroke geometry, the
stamp spacing, the fade — are exactly the parts a mount test cannot see. It is
also easy to write a test that _looks_ like it covers them: `getContext` is
mocked, but the assertions only ever touch the element's style.

### Where to look next

The art spec records draw calls through a hand-written fake context, which
covers geometry and call counts but not pixels. The alternatives are the native
`canvas` dependency (a build-time cost, and still not a real rasteriser) or
`packages/browser-tests`, which already drives a real browser for scope
transitions and would be the honest place to assert that ink actually appears.

---

## Gaps noticed

Not code defects, but things worth deciding on:

- **Bug 1 is missing from this file.** Bug 2's notes refer twice to "bug 1's
  priming" and to an ordering constraint between the two, but there is no
  section 1 — the file starts at 2. Either restore it or renumber 2–4.
- **Labs plugins have no recipe to link to.** Every entry in
  `packages/labs/meta.json` may carry a `recipeId`, and the docs plugin page
  renders it as a live demo. The nine optics plugins and the new art plugins
  ship without one, so their pages can list options but cannot show the cursor
  — which is exactly the interactive-docs direction the revamp is heading in.

## Question

What happens when a plugin installed on one scope sets its container element existing
on another scope? Does supermouse warn if this happens?
