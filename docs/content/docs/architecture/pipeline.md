---
title: Core Concepts
description: The execution pipeline, exponential damping physics, stage sandbox, and DOM layout firewall.
section: Architecture
order: 2
---

Supermouse is built on a simple architecture: a single, deterministic `requestAnimationFrame` loop that isolates input tracking, scope coordination, and physics damping from application rendering.

---

## The Execution Pipeline

Every animation frame executes in an exact, deterministic order:

```javascript
function update(time) {
  // 1. Compute delta time, clamped to 100ms
  const dtMs = time - lastTime;
  const dt = Math.min(dtMs / 1000, 0.1);
  lastTime = time;

  // 2. Hover interaction evaluation (cached selectors, refreshed values)
  const target = input.getCurrentTarget();
  if (target && !target.isConnected) {
    input.clearHover();
  } else if (target) {
    input.parseDOMInteraction(target);
  }

  // 3. Initialize target goal from raw pointer coordinates
  if (input.isEnabled && state.hasReceivedInput) {
    state.target.x = state.pointer.x;
    state.target.y = state.pointer.y;
  }

  // 4. Active scope plugin execution
  const activeScope = this._activeScope;
  if (activeScope) {
    activeScope.stage.setVisibility(this.resolveStageVisibility());
    if (this.input.isEnabled) {
      activeScope.stage.setNativeCursor(this.resolveCursorState());
    }

    // Logic plugins (priority < 0) run first and can modify state.target
    // Visual plugins (priority >= 0) run next
    for (let i = 0; i < activeScope.plugins.length; i++) {
      this.runPluginSafe(activeScope.plugins[i], dtMs);
    }
  }

  this.cleanupCrashedPlugins();

  // 5. Physics step (exponential damping toward state.target)
  if (this.input.isEnabled) {
    const lambda = state.reducedMotion ? 1000 : (1 / smoothness) * 2;
    const px = state.smooth.x;
    const py = state.smooth.y;

    state.smooth.x = damp(state.smooth.x, state.target.x, lambda, dt);
    state.smooth.y = damp(state.smooth.y, state.target.y, lambda, dt);

    state.displacement.x = state.target.x - state.smooth.x;
    state.displacement.y = state.target.y - state.smooth.y;

    state.velocity.x = (state.smooth.x - px) / dt;
    state.velocity.y = (state.smooth.y - py) / dt;

    if (Math.abs(state.velocity.x) > 0.1 || Math.abs(state.velocity.y) > 0.1) {
      state.angle = Math.atan2(state.velocity.y, state.velocity.x) * (180 / Math.PI);
    }
  }
}
```

---

## Exponential Damping Physics

Supermouse replaces naive `x += (target - x) * factor` linear lerping with framerate-independent exponential damping:

```typescript
function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}
```

- **`current`**: Current coordinate (`state.smooth.x`)
- **`target`**: Destination goal (`state.target.x`)
- **`lambda`**: Exponential decay rate ($\lambda = \frac{1}{\text{smoothness}} \times 2$)
- **`dt`**: Delta time in **seconds**

Because the interpolation factor uses `Math.exp(-lambda * dt)`, the cursor follows the identical geometric curve regardless of display refresh rate (e.g. 60Hz, 120Hz, or 240Hz).

### Kinematics: Velocity vs. Displacement

- **`state.velocity`**: Calculated as $(\vec{smooth} - \vec{smooth}_{\text{prev}}) / dt$ in **pixels per second**. Reflects actual rendered speed. Use this for directional rotation, stretch-and-squash, or particle emission.
- **`state.displacement`**: Calculated as $\vec{target} - \vec{smooth}$ in **pixels**. Represents remaining distance to target. Use this for overshoot compensation or trailing indicators.
- **`state.angle`**: Derived from velocity using $\operatorname{atan2}$. Ignores speeds below $0.1\text{ px/s}$ to eliminate heading jitter when at rest.

### Delta Time Clamping

Raw delta time is clamped to a maximum of `0.1s` (100ms). When a user switches tabs or un-minimizes the browser, the elapsed time can be several seconds. Without clamping, exponential damping would cause the cursor to snap jarringly across the screen.

---

## Stage Sandbox & Engine Stylesheet

Plugins never append elements directly to `document.body`. Every scope manages an isolated `Stage` element:

- **Viewport Positioning**: When scoped to `document.body`, `app.stage` is `position: fixed; inset: 0px`. For element containers, it is `position: absolute; inset: 0px`.
- **CSS Isolation**: All scopes share an engine stylesheet with scoped cursor rules. An automatic reset cuts cursor inheritance between nested scopes:

```css
:where(.supermouse-scope .supermouse-scope) {
  cursor: auto;
}
```

This prevents an outer scope's `cursor: none !important` from leaking into an inner scope container.

---

## The DOM Layout Firewall

Reading layout geometry (such as `getBoundingClientRect()` or `getComputedStyle()`) during animation frames forces synchronous browser layout calculation, causing frame drops. Supermouse enforces a layout firewall:

1. **Zero Layout Reads in Frame Loop**: The frame loop never queries element geometry.
2. **On-Demand Hover Measurement**: Bounding boxes for sticky/magnetic elements are read **once on hover entry** and cached.
3. **Ancestor Attribute Cascade**: Interaction attributes (`data-supermouse-*`) are parsed into `state.interaction` on hover transitions and refreshed per frame without DOM querying.

---

## Fault Isolation

Plugin updates are wrapped in an isolated `try/catch` boundary. If an author's plugin throws an unhandled exception:

1. It is disabled immediately so it cannot stall the frame loop.
2. After the current frame completes, its `onDisable` and `destroy` hooks are executed safely.
3. Its DOM element is removed from the stage.
4. Other plugins and the core engine continue running normally.
