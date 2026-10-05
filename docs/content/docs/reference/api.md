---
title: Core API Reference
description: Complete, unified API reference for Supermouse — constructor options, instance methods, scopes, state, and plugin interface.
section: Reference
order: 1
---

Every public surface of `@supermousejs/core`, specified type by type.

```typescript
import { Supermouse, DEFAULT_NATIVE_CURSOR_SELECTORS } from "@supermousejs/core";
import type {
  SupermouseOptions,
  SupermousePlugin,
  MouseState,
  ScopeConfig,
  CursorMode
} from "@supermousejs/core";
```

---

## `SupermouseOptions`

Passed to `new Supermouse(options)`. All options are optional and fall back to sensible defaults.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `smoothness` | `number` | `0.15` | Interpolation factor ($\lambda = 2 / \text{smoothness}$). Lower is snappier, higher is floatier. |
| `cursor` | `CursorMode` | `"auto"` | Platform pointer policy: `"auto" \| "custom" \| "native" \| "both"`. |
| `nativeCursorSelectors` | `string[]` | `DEFAULT_NATIVE_CURSOR_SELECTORS` | Elements that yield to the OS cursor in `"auto"` mode. |
| `scopes` | `ScopeConfig[]` | `[]` | Secondary scopes registered at initialization alongside the primary scope. |
| `inheritDataAttributes` | `boolean` | `true` | Whether `data-*` attributes and `rules` on ancestors cascade to the hovered element. |
| `hoverSelectors` | `string[]` | see below | Selectors triggering `state.isHover`. Passing this replaces the default set. |
| `plugins` | `SupermousePlugin[]` | `[]` | Plugins installed into the primary scope at construction. |
| `container` | `HTMLElement` | `document.body` | Element to append the primary stage to. Becomes `relative` if static. |
| `rules` | `Record<string, RuleDefinition>` | `{}` | Map of CSS selectors to declarative interaction metadata. |
| `dataPrefix` | `string` | `"supermouse"` | Attribute namespace prefix for HTML interaction attributes. |
| `zIndex` | `number` | `9999` | Inline `z-index` applied to the cursor stage. |
| `hideOnLeave` | `boolean` | `true` | Moves coordinates offscreen `(-100, -100)` when pointer leaves the viewport. |
| `autoStart` | `boolean` | `true` | Starts the animation frame loop automatically upon construction. |
| `enableTouch` | `boolean` | `false` | Whether touch input moves the cursor. |
| `autoDisableOnMobile` | `boolean` | `true` | Automatically hibernates when `(pointer: fine)` evaluates to `false`. |

### Detailed Option Semantics

#### `smoothness`
Controls the exponential damping response rate: $\lambda = \frac{1}{\text{smoothness}} \times 2$.
- `0.05` ($\lambda = 40$): Near-instant tracking, negligible lag.
- `0.15` ($\lambda = 13.3$): Balanced default; responsive with a visible trailing outline.
- `0.25` ($\lambda = 8$): Floaty, heavy trailing feel.

#### `cursor`
- `"auto"`: Native OS pointer is restored over form inputs (`input`, `textarea`, `select`), `[contenteditable]`, and `[data-supermouse-ignore]`; custom stage is shown elsewhere.
- `"custom"`: Stage is always visible; native cursor is always hidden (`cursor: none !important`).
- `"native"`: Stage is always hidden; native cursor is always visible.
- `"both"`: Native cursor and custom stage are displayed together without suppression.

#### `nativeCursorSelectors`
Selectors that yield to the OS pointer while `cursor` is `"auto"`. Passing this replaces the default set:

```typescript
import { DEFAULT_NATIVE_CURSOR_SELECTORS } from "@supermousejs/core";

// DEFAULT_NATIVE_CURSOR_SELECTORS === ["input", "textarea", "select", "[contenteditable]"]

new Supermouse({
  nativeCursorSelectors: [...DEFAULT_NATIVE_CURSOR_SELECTORS, "[data-native]"]
});
```

Cursor suppression itself (the `cursor: none !important` the engine writes for the custom cursor) is unconditional and not configurable — only the *native* hand-off is steerable.

---

## `Supermouse` (Instance API)

The instance returned by `new Supermouse(...)`.

### Introspection Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `app.state` | `MouseState` | Live cursor state object, mutated in place every frame. |
| `app.isEnabled` | `boolean` (getter) | `true` if event listeners and input ingestion are active. |
| `app.isRunning` | `boolean` (getter) | `true` if the internal `requestAnimationFrame` loop is actively ticking. |
| `app.container` | `HTMLElement` (getter) | Active scope's container element. |
| `app.stage` | `HTMLDivElement` (getter) | DOM element where plugins of the active scope mount. |
| `app.options` | `ResolvedOptions` | Fully resolved constructor options. |
| `app.version` | `string` | Version of the installed `@supermousejs/core` library. |
| `Supermouse.version` | `string` (static) | Library version accessible directly on the constructor. |

### Plugin Management

```typescript
app.use(plugin: SupermousePlugin): this
```
Installs a plugin into the primary scope, sorting plugins by priority. Chainable.

```typescript
app.getPlugin(name: string): SupermousePlugin | undefined
```
Searches all scopes in registration order and returns the first plugin matching `name`.

```typescript
app.enablePlugin(name: string): void
```
Sets `plugin.isEnabled = true`, un-hides the plugin's root element (`display: ""`), and fires `plugin.onEnable?.(app)`.

```typescript
app.disablePlugin(name: string): void
```
Sets `plugin.isEnabled = false`. If `plugin.onBeforeDisable` returns a `Promise`, the engine awaits it before setting `display: none` and calling `plugin.onDisable?.(app)`.

```typescript
app.togglePlugin(name: string): void
```
Flips the enabled state of the plugin.

### Scope Management

```typescript
app.addScope(config: ScopeConfig): Scope
```
Registers a new scope container at runtime and returns its `Scope` for managing it.

```typescript
app.getScope(name: string): Scope | undefined
```
Looks up a registered scope by its configured `name`.

### Cursor & Hover Methods

```typescript
app.setCursor(mode: CursorMode): void
```
Sets cursor mode on the currently active scope and synchronously updates stage visibility and CSS suppression.

```typescript
app.addHoverSelectors(selectors: string): void
```
Adds a comma-separated list of selectors to the active scope's hover detection set.

### Lifecycle Methods

```typescript
app.enable(): void
```
Resumes event listeners, snaps physics coordinates to the pointer to prevent offscreen flying, and applies cursor visibility.

```typescript
app.disable(opts?: { reset?: boolean }): void
```
Halts input handling, hides the stage, and restores native cursor. Preserves physics coordinates unless `{ reset: true }` is supplied.

```typescript
app.reset(): void
```
Resets coordinates to `(-100, -100)`, resets velocity and displacement to zero, and clears active hover targets and interaction state.

```typescript
app.start(): void
```
Starts the `requestAnimationFrame` loop (called automatically unless `autoStart: false`).

```typescript
app.step(time: number): void
```
Advances the engine by one frame manually using the provided timestamp (useful for headless testing).

```typescript
app.destroy(): void
```
Permanently disposes of all listeners, removes stage DOM elements and engine stylesheets, and calls `destroy()` on all plugins across all scopes.

---

## Scopes API

### `ScopeConfig`

Configuration object passed to `scopes` array or `app.addScope(config)`:

```typescript
export interface ScopeConfig {
  name?: string;
  container: HTMLElement | string; // Live element (eager) or CSS selector (lazy)
  cursor?: CursorMode;             // Inherits from top-level if omitted
  hoverSelectors?: string[];       // Inherits from top-level if omitted
  nativeCursorSelectors?: string[];// Inherits from top-level if omitted
  plugins?: SupermousePlugin[];    // Plugins scoped to this container
  rules?: Record<string, RuleDefinition>;
  inheritDataAttributes?: boolean; // Default true
  zIndex?: number;                 // Inherits from top-level if omitted
}
```

### `Scope`

The runtime object returned by `app.addScope()` and `app.getScope()`. It is not re-exported as a public type — reach for it through those methods:

```typescript
class Scope {
  readonly name: string | undefined;
  readonly container: HTMLElement | null; // null if lazy and not yet resolved
  readonly active: boolean;               // true if eligible for activation
  readonly resolved: boolean;             // true if bound to a live DOM node

  activate(): void;                       // Marks eligible; eager if pointer is inside
  deactivate(): void;                     // Marks ineligible; yields to ancestor scope
  setCursor(mode: CursorMode): void;      // Updates cursor mode for this scope
  use(plugin: SupermousePlugin): Scope;   // Installs plugin to this scope
  removePlugin(name: string): void;       // Runs exit transition and disposes plugin
  getPlugin(name: string): SupermousePlugin | undefined;
  destroy(): void;                        // Permanently tears down scope and stage
}
```

---

## `MouseState`

Accessible via `app.state`. Mutated in place every frame.

### Spatial Coordinates

- **`pointer: MousePosition { x, y }`** *(Read-only)*: Raw pointer coordinates from the latest input event. Container-relative when a scoped container is active.
- **`target: MousePosition { x, y }`** *(Read / Write)*: Destination goal coordinates that physics damps toward. Initialized to `pointer` each frame; modified by logic plugins (`priority < 0`).
- **`smooth: MousePosition { x, y }`** *(Read-only)*: Damped coordinates resulting from exponential physics. Visual plugins position from here.

### Kinematics

- **`velocity: MousePosition { x, y }`**: Rate of cursor movement in **pixels per second**. Derived from `smooth` coordinates.
- **`displacement: MousePosition { x, y }`**: Distance remaining to destination (`target - smooth`).
- **`angle: number`**: Direction of travel in degrees (`0°` = right, `90°` = down). Only updates when speed exceeds `0.1 px/s` to prevent resting jitter.

### Pointer & Environment Flags

- **`isDown: boolean`**: `true` when primary mouse/pointer button is held down.
- **`isHover: boolean`**: `true` when pointer hovers over an element matching `hoverSelectors`.
- **`isNative: boolean`**: `true` when native cursor has been restored over native controls or `[data-supermouse-ignore]`.
- **`cursorMode: CursorMode`**: Active cursor mode (`"auto" \| "custom" \| "native" \| "both"`).
- **`hoverTarget: HTMLElement | null`**: Current hovered element matching hover criteria.
- **`reducedMotion: boolean`**: Reflects `prefers-reduced-motion: reduce`. When active, damping collapses ($\lambda = 1000$) for near-instant tracking.
- **`hasReceivedInput: boolean`**: `false` until the first pointer event arrives. Prevents offscreen pop-in.

### Scopes & Interaction

- **`scope: { name: string | undefined; container: HTMLElement } | null`**: Identity of the currently active scope container.
- **`shape: ShapeState | null`** (`{ width, height, borderRadius }`): Target geometry published by logic plugins (`Stick`) and consumed by morphing plugins (`SmartRing`).
- **`interaction: InteractionState`** (`Record<string, any>`): Metadata parsed from HTML `data-supermouse-*` attributes and `rules`.

---

## `SupermousePlugin`

The plugin object interface executed by the engine:

```typescript
export interface SupermousePlugin {
  name: string;
  priority?: number;
  isEnabled?: boolean;
  element?: HTMLElement | SVGElement;

  install?: (instance: SupermouseInstance) => void;
  update?: (instance: SupermouseInstance, deltaTime: number) => void;
  destroy?: (instance: SupermouseInstance) => void;

  onEnable?: (instance: SupermouseInstance) => void;
  onDisable?: (instance: SupermouseInstance) => void;
  onBeforeDisable?: (instance: SupermouseInstance) => void | Promise<void>;
}
```

### Priority Ranges

- **`< 0` (Logic Plugins)**: Run before physics. May rewrite `state.target` (e.g. `Magnetic` and `Stick` at `-10`).
- **`0` (Visual Plugins)**: Default. Render to the stage using `state.smooth` coordinates.
- **`<= -900` (Controller Plugins)**: Run before logic plugins to toggle other plugins (e.g. `States` at `-999`).

### Lifecycle Hooks

- **`install(app)`**: Executes once, synchronously, inside `app.use()`.
- **`update(app, dtMs)`**: Runs every frame while enabled. `dtMs` is in **milliseconds**.
- **`onEnable(app)`**: Runs when plugin transitions from disabled to enabled.
- **`onDisable(app)`**: Runs when plugin is disabled, after `onBeforeDisable` resolves.
- **`onBeforeDisable(app)`**: Runs immediately upon disabling. Return a `Promise` to delay hiding the DOM element for exit transitions.
- **`destroy(app)`**: Executes on `app.destroy()` or when the plugin is removed.
