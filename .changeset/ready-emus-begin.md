---
"@supermousejs/core": minor
---

Architecture rewrite for v2.5. This is a beta, therefore expect API surface churn before the stable release.

**Scopes.** A single instance can now own multiple scopes. Pass them at construction or add them at runtime:
```ts
    const mouse = new Supermouse({
      scopes: [{ name: "sidebar", container: sidebarEl, cursor: "native" }]
    });

    const handle = mouse.addScope({ container: modalEl, cursor: "custom" });
    handle.setCursor("auto");
    handle.remove();
```

The innermost scope whose container contains the pointer is the active one. Plugin installation, cursor mode, hover selectors, and native-cursor state are all managed per scope.

**Cursor policy.** `NATIVE_TAGS` and the old `Stage.selectors` are unified into a single `CursorPolicy`. Pass a custom policy via `cursorPolicy` at the top level or per scope. `DEFAULT_CURSOR_POLICY` is exported for spreading.

**Ancestor-chain interaction.** `data-supermouse-*` attributes and `rules` now cascade from ancestors to the hovered element, ensuring the closest ancestor wins. This fixes the tag-inside-a-tag class of bugs. Disable with `inheritDataAttributes: false`.

**Lifecycle.** `onBeforeDisable` (and its `definePlugin` equivalent, `beforeDisable`) is now scope-aware: when a scope deactivates, each of its plugins runs `onBeforeDisable`, and the core waits for any returned Promise before hiding the element and calling `onDisable`.

**Changed.**

- `disable()` no longer resets physics. Call `disable({ reset: true })` for the old behavior.
- `suspend()` and `resume()` are removed. Use scopes.
- `registerHoverTarget` now mutates the active scope's selector set. It's still available for raw-object plugins, but `definePlugin`'s `selector` option is preferred.
- Stage no longer owns an individual `<style>` tag. All scopes share a single engine-level stylesheet.

**Removed.**

- `NATIVE_TAGS`, `SUPERMOUSE_CURSORS` internal constants (moved into policy).
- `Stage.addSelector` / `Stage.addSelectors` no-ops.
