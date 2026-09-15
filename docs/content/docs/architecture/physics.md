---
title: Physics Loop
description: Frame-rate independent exponential damping, how smoothness maps to lambda, and what velocity actually measures.
section: Architecture
order: 2
---

Supermouse has one physics primitive: exponential damping, an approach popularised
by Freya Holmér. It replaces the naive `a += (b - a) * 0.1` pattern, which
silently changes speed with frame rate.

```typescript
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}
```

- **`a`** — current value (`state.smooth.x`)
- **`b`** — destination (`state.target.x`)
- **`lambda`** — response rate; larger converges faster
- **`dt`** — elapsed time in **seconds**

Because the interpolation factor is derived from `dt`, the trajectory is a
continuous exponential curve sampled at whatever rate the display runs. A 60Hz
and a 144Hz monitor follow the same path.

## How `smoothness` becomes `lambda`

`smoothness` is the ergonomics-facing knob, not the math value. The core converts
it once per frame:

```typescript
const lambda = state.reducedMotion ? 1000 : (1 / smoothness) * 2;
```

So `smoothness` is **inverse response**: smaller means snappier, larger means
more lag.

| `smoothness` | `lambda` | Feel |
| :--- | :--- | :--- |
| `0.05` | 40 | Near-instant, barely perceptible smoothing |
| `0.10` | 20 | Tight |
| `0.15` | 13.3 | **Default** — visible, controlled trail |
| `0.25` | 8 | Floaty |
| `0.50` | 4 | Very loose, heavy drift |

> **Watch the sign.** The JSDoc on `SupermouseOptions.smoothness` historically
> described lower values as "smoother/slower". The implementation is the
> opposite: `lambda = 2 / smoothness`, so lower values produce *less* lag. Trust
> the table above.

The default `0.15` exists to be visible without being sluggish. If a design calls
for a lagging follower, raise it — do not add a second smoothing layer inside the
plugin.

## The delta-time clamp

`dt` is clamped to 100ms:

```typescript
const dt = Math.min(dtMs / 1000, 0.1);
```

A backgrounded tab stops receiving frames, so the first frame after returning has
a huge raw delta. Unclamped, that would make the cursor teleport across the page.
The clamp keeps the motion continuous, and the loop resets `lastTime` on
visibility change so the next frame starts clean.

## `velocity` is real speed — `displacement` is the error

These two fields are easy to confuse, and older docs got it wrong:

| Field | Definition | Units | Use it for |
| :--- | :--- | :--- | :--- |
| `velocity` | `(smooth - previousSmooth) / dt` | px per second | True speed. Stretch, blur, arrow rotation. |
| `displacement` | `target - smooth` | px | Remaining distance. Trailing indicators, overshoot detection. |

```typescript
// True speed — safe for squash and stretch
const speed = Math.hypot(app.state.velocity.x, app.state.velocity.y);

// Distance still to travel
const remaining = Math.hypot(app.state.displacement.x, app.state.displacement.y);
```

`velocity` is derived from the **smoothed** position, so it reflects how fast the
rendered cursor is moving, not how fast the physical mouse is moving. That is
usually what you want for motion effects; when it is not, `state.pointer` is the
raw input.

`angle` follows from velocity and is only updated while the cursor is actually
moving — the core leaves it untouched below `0.1` px/s per axis so a resting
cursor does not jitter between arbitrary headings:

```typescript
if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
  state.angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);
}
```

## Squash and stretch

`getVelocityDistortion()` packages the common case — rotate along the direction of
travel and stretch proportionally to speed, with a deadzone below `0.1` px/s:

```typescript
import { getVelocityDistortion } from "@supermousejs/utils";

update(app, dtMs) {
  const { x: vx, y: vy } = app.state.velocity;
  const { rotation, scaleX, scaleY } = getVelocityDistortion(vx, vy, 0.004, 0.5);

  dom.setTransform(el, app.state.smooth.x, app.state.smooth.y, rotation, scaleX, scaleY);
}
```

The defaults cap the stretch at 50% and shrink the perpendicular axis by half
that amount, which reads as volume-preserving.

## Reduced motion

When `prefers-reduced-motion: reduce` is active, `lambda` is pinned to `1000`,
which is effectively instantaneous — the cursor tracks the pointer with no
perceptible trailing. The engine still runs the full pipeline, so plugins keep
receiving updates and nothing is disposed; decorative motion is simply yours to
skip:

```typescript
update(app, dtMs) {
  if (app.state.reducedMotion) {
    dom.setTransform(el, app.state.smooth.x, app.state.smooth.y);
    return;
  }
  // …decorative path
}
```

## Frame-rate independence checklist

- Use `damp(a, b, lambda, dtSeconds)` — never a fixed per-frame factor.
- Divide the plugin `dtMs` by 1000 before handing it to a math helper.
- Do not add your own smoothing on top of `state.smooth`; tune `smoothness`.
- Read `velocity` for speed and `displacement` for distance — do not conflate
  them.
