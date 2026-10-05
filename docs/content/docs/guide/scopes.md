---
title: Scopes
description: Multi-region cursor architecture — coordinate isolated containers, nested contexts, and distinct plugin sets within a single engine.
section: Guide
order: 4
---

Most pages want one cursor. The interesting ones want a few. Think about a screen with a document canvas, a floating toolbar, and an artboard preview side by side:

- The canvas would rather have a crosshair that belongs to its own tools.
- The toolbar is happiest handing control back to the native system cursor.
- The artboard might want magnetic snapping with its own hints.

Before v2.5 you'd have built a `Supermouse` instance for each and hand-coordinated their listeners. **Scopes** fold all of that into a single engine: one animation loop, one `state`, and automatic hand-off as the pointer crosses a boundary.

---

## What is a Scope?

A **Scope** represents an independent cursor boundary bound to a DOM container. Each scope encapsulates:
- A container element (eager `HTMLElement` or lazy CSS selector string)
- Its own stage mount point and coordinate space
- An isolated set of plugins
- A scoped cursor mode (`"auto"`, `"custom"`, `"native"`, or `"both"`)
- Specific hover selectors and semantic interaction rules
- Its own set of [native cursor selectors](/docs/reference/api#nativecursorselectors)

The primary scope is created automatically from top-level constructor options (such as `container`, `cursor`, and `plugins`). Additional scopes can be declared at initialization or created dynamically at runtime.

---

## Declaring Scopes at Construction

Pass an array of `ScopeConfig` objects via the `scopes` option:

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";
import { Magnetic } from "@supermousejs/magnetic";

const app = new Supermouse({
  // Primary scope: page body
  plugins: [Ring({ size: 24 }), Dot({ size: 8 })],

  // Secondary scopes
  scopes: [
    {
      name: "canvas",
      container: "#canvas-viewport",
      cursor: "custom",
      plugins: [CrosshairTool()]
    },
    {
      name: "sidebar",
      container: document.getElementById("sidebar")!,
      cursor: "auto",
      plugins: [Magnetic({ attraction: 0.4 })]
    }
  ]
});
```

---

## Dynamic Scope Registration

Register new scopes at runtime using `app.addScope()`. The method returns a `Scope` for managing that scope:

```typescript
const modal = app.addScope({
  name: "checkout-modal",
  container: document.getElementById("checkout-modal")!,
  cursor: "both",
  plugins: [Dot({ size: 10, color: "#10b981" })]
});

// Configure or destroy later
modal.setCursor("auto");
modal.destroy();
```

To look up an existing scope by name, call `app.getScope(name)`:

```typescript
const canvasScope = app.getScope("canvas");
if (canvasScope) {
  canvasScope.deactivate();
}
```

---

## Eager vs. Lazy Container Binding

The `container` property of a `ScopeConfig` accepts either an element reference or a CSS selector string:

```typescript
// Eager binding (requires live element in DOM)
{
  container: document.getElementById("editor")!
}

// Lazy binding (resolves when matching elements appear and are entered)
{
  container: ".drawing-canvas"
}
```

### Lazy Resolution Semantics

When `container` is provided as a string selector:
1. The scope is initialized in an unresolved state (`scope.resolved === false`).
2. When the pointer enters an element matching the selector, the scope binds to that container and becomes active.
3. If multiple elements match the selector (e.g. multiple card widgets), the scope dynamically rebinds its stage to whichever matching element the pointer enters.

---

## Scope Stacking: Innermost Wins

Scopes stack deterministically. When scopes nest inside one another (for example, a modal nested inside the document body, or an interactive canvas inside a panel), Supermouse walks up the ancestor chain from the hovered DOM node on every `mouseover`.

The first active scope encountered during the ancestor walk becomes the **active scope**:

```
Document Body (Primary Scope)
  └─ Modal (#modal) (Scope A)
       └─ Canvas (#canvas) (Scope B)  <-- Pointer enters here: Scope B wins
```

When the pointer leaves the `#canvas` element, the engine immediately yields authority back to the enclosing Scope A (`#modal`). When the pointer leaves `#modal`, authority returns to the primary scope.

### Stylesheet Isolation

To prevent outer scope `cursor: none` rules from leaking into inner scopes, Supermouse automatically injects a CSS reset rule:

```css
:where(.supermouse-scope .supermouse-scope) {
  cursor: auto;
}
```

This cuts CSS cursor inheritance at scope boundaries without overriding any author-specified cursor rules.

---

## Scope Lifecycle and Transitions

When the active scope changes:

1. **Outgoing Scope Deactivation**:
   - Plugins belonging to the outgoing scope have their `onBeforeDisable` hook called.
   - If an `onBeforeDisable` hook returns a `Promise`, the engine awaits completion for exit transitions.
   - Elements belonging to outgoing plugins are hidden (`display: none`), and `onDisable` is called.
2. **Incoming Scope Activation**:
   - The stage of the incoming scope becomes visible according to its `cursorMode`.
   - Incoming plugins have their elements restored (`display: ""`), and `onEnable` is called.
   - Coordinates (`state.pointer`, `state.smooth`, `state.target`) are transformed into the incoming container's coordinate system.
3. **State Reflection**:
   - `app.state.scope` is updated to `{ name, container }` reflecting the active scope.

User-initiated plugin state (`plugin.isEnabled`) persists across scope switches. For example, if a plugin in a scope was explicitly disabled via `scope.removePlugin()` or `app.disablePlugin()`, it will remain disabled when the scope reactivates.

---

## The `Scope` API

Every scope is a `Scope` instance with the same surface:

| Property / Method | Type | Description |
| :--- | :--- | :--- |
| `name` | `string \| undefined` | Scope identifier. |
| `container` | `HTMLElement \| null` | Bound container element, or `null` if unresolved. |
| `active` | `boolean` | `true` if this scope is eligible for activation. |
| `resolved` | `boolean` | `true` if bound to a live container element. |
| `activate()` | `() => void` | Marks scope eligible for activation. Activates immediately if pointer is inside. |
| `deactivate()` | `() => void` | Marks scope ineligible and yields control to nearest ancestor scope. |
| `setCursor(mode)` | `(mode: CursorMode) => void` | Updates the cursor mode for this scope. |
| `use(plugin)` | `(plugin: SupermousePlugin) => Scope` | Installs a plugin directly into this scope. |
| `removePlugin(name)` | `(name: string) => void` | Removes a plugin from this scope, running exit transitions. |
| `getPlugin(name)` | `(name: string) => SupermousePlugin \| undefined` | Retrieves an installed plugin by name from this scope. |
| `destroy()` | `() => void` | Permanently disposes of the scope and all its plugins. |

### Installing Plugins to a Specific Scope

While `app.use(plugin)` installs into the primary scope, `scope.use(plugin)` targets that specific scope:

```typescript
const sidebar = app.getScope("sidebar");
sidebar?.use(SmartRing({ size: 32 }));
```

---

## Observing Active Scopes

Inspect the currently active scope at any time via `app.state.scope`:

```typescript
const activeScope = app.state.scope;

if (activeScope) {
  console.log(`Active scope: ${activeScope.name}`);
  console.log(`Container:`, activeScope.container);
} else {
  console.log("No active scope.");
}
```
