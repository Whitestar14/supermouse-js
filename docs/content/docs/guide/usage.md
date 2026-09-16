---
title: Basic Usage
description: Construct the engine, register plugins, describe hover interactions, and control the lifecycle.
section: Guide
order: 3
---

## 1. Construction

You can have one instance per page. All options are optional, Supermouse's defaults already work for 90% of your use cases, so tweak only as needed:

```typescript
import { Supermouse } from "@supermousejs/core";

const app = new Supermouse({
  smoothness: 0.15, // higher values for more lag
  cursor: "auto", // default pointer policy
  dataPrefix: "supermouse" // namespace for data-* interaction attributes
});
```

Check out [Options](/docs/reference/options) for the full list. The instance exposes
`state`, `stage`, `container`, `isEnabled` and `version`; everything else is a
method ([Methods](/docs/reference/methods)).

## 2. Registering Plugins

Supermouse's plugins are **factory functions** to keep each instance's state isolated.

```typescript
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

app.use(Ring({ size: 24 })).use(Dot({ size: 8 }));
```

`use()` is chainable and returns the instance. Plugins are re-sorted by
[`priority`](/docs/reference/plugin-interface#priority) on every registration,
and registering the same `name` twice logs a warning instead of installing it a
second time. Plugins that crash on registration are logged and are never added to the runtime loop.

You can also pass them up front, which is identical to calling `use()` in a loop:

```typescript
const app = new Supermouse({
  plugins: [Ring({ size: 24 }), Dot({ size: 8 })]
});
```

:::callout{title="Install managed plugins first" variant="warning"}
Behaviour plugins such as [`States()`](/docs/plugins/states) look plugins up by
name at runtime, so the plugins they toggle must already be registered when they
run.
:::

## 3. Describe interactions

Instead of imperative hover handlers, you describe what a hovered element
_means_. The engine resolves that description into
[`state.interaction`](/docs/reference/state#interaction) on hover entry, so
plugins can read it without touching the DOM.

Two sources feed the same object:

```typescript
// a) selector rules, evaluated when the pointer enters a matching element
const app = new Supermouse({
  rules: {
    ".btn-magnetic": { magnetic: 0.5 },
    "a[target='_blank']": (el) => ({ text: el.textContent?.trim() })
  }
});
```

```html
<!-- b) data attributes on the element itself -->
<button class="btn-magnetic" data-supermouse-magnetic="0.8" data-supermouse-text="Copy">
  Copy link
</button>
```

Then any plugin (or your own code) can read it:

```typescript
app.state.interaction.magnetic; // 0.8 — the attribute won, it has higher priority
app.state.interaction.text; // "Copy"
```

Rules of the road:

- **Data attributes win over `rules`**, which makes `rules` a good place for
  global defaults and attributes a good place for per-element overrides.
- Attribute names are camel-cased after the prefix: `data-supermouse-mix-blend`
  becomes `interaction.mixBlend`. Set `dataPrefix` to change the namespace.
- A valueless attribute (`data-supermouse-magnetic`) resolves to `true`.
- Use [`data-supermouse-ignore`](/docs/guide/usage#5-opt-out) to hand a subtree
  back to the operating system.

Selector matching uses `element.matches()` for simple selectors. Descendant
selectors such as `[data-hover] a` are matched as "element matches the last
compound **and** has a matching ancestor", which is cheap but worth knowing:

```html
<div data-hover><a href="#">matched by `[data-hover] a`</a></div>
```

## 4. Hover targets

`state.isHover` is driven by `hoverSelectors`, which defaults to
`a`, `button`, `input`, `textarea`, `[data-hover]`, `[data-cursor]`.

Passing `hoverSelectors` **replaces** that default list. To extend it while
keeping the defaults, register selectors at runtime instead:

```typescript
app.registerHoverTarget(".cmd-palette-item");
```

Registering a hover target also adds it to the stage's suppression stylesheet,
so the OS pointer is hidden over those elements too. The stage always suppresses
the native cursor on `a`, `button`, `input`, `textarea`, `select`,
`[role="button"]` and `[tabindex]`.

## 5. Opt out

Mark any subtree to keep the real cursor:

```html
<textarea data-supermouse-ignore placeholder="Native cursor here"></textarea>
```

While the pointer is over an ignored element the engine clears
`state.hoverTarget` and `state.interaction`, sets `state.isNative = true`, and
hides the custom stage. This is the supported way to handle inputs, embedded
editors and drag handles — never write `cursor: none` yourself.

## 6. Cursor modes

`setCursor()` — or the `cursor` option — picks the native-pointer policy:

| Mode       | Custom stage                                 | Native pointer                     |
| :--------- | :------------------------------------------- | :--------------------------------- |
| `"auto"`   | hidden over native controls, otherwise shown | hidden except over native controls |
| `"custom"` | always shown                                 | always hidden                      |
| `"native"` | never shown                                  | always shown                       |
| `"both"`   | always shown                                 | always shown                       |

```typescript
app.setCursor("native"); // e.g. while a native <select> popup is open
app.setCursor("auto"); // restore the heuristics
```

In `"auto"` the engine treats an element as native when it is an
`input`/`textarea`/`select`, is `contenteditable`, **or** its computed `cursor`
is something other than `default`/`auto`/`pointer`/`none`/`inherit`/`grab`/`grabbing`.
That last rule is why a third-party date picker with `cursor: text` keeps the OS
cursor without any configuration.

## 7. Scope to a container

Pass a `container` to restrict rendering, hover detection and coordinates to one
element — useful for modals, canvases and embedded widgets:

```typescript
const modal = document.getElementById("checkout")!;

const app = new Supermouse({
  container: modal,
  cursor: "custom"
});
```

The stage is appended to the container, positioned `absolute` instead of `fixed`,
and the container gets `position: relative` if it was `static`. **Pointer
coordinates become container-relative**, so always position plugins with
`state.smooth` / `state.target` rather than `clientX`.

## 8. Control plugins at runtime

```typescript
app.getPlugin("ring"); // SupermousePlugin | undefined
app.disablePlugin("ring"); // hides the element, skips update(), calls onDisable()
app.enablePlugin("ring"); // restores display and calls onEnable()
app.togglePlugin("ring");
```

`disablePlugin` awaits `onBeforeDisable` if it returns a promise, which is how
plugins run exit animations before their element is hidden.

## 9. Lifecycle

| Call         | Effect                                                                                  | `isEnabled` |
| :----------- | :-------------------------------------------------------------------------------------- | :---------- |
| `enable()`   | Resumes input, snaps physics to the last pointer position, re-applies cursor state.     | `true`      |
| `disable()`  | Stops input, hides the stage, restores the native cursor and resets physics.            | `false`     |
| `suspend()`  | Yields control without unmounting the stage; clears hover state.                        | `false`     |
| `resume()`   | Re-enables input, re-syncs physics, then updates plugins once before showing the stage. | `true`      |
| `start()`    | Starts the `requestAnimationFrame` loop (automatic unless `autoStart: false`).          | —           |
| `step(time)` | Advances a single frame manually.                                                       | —           |
| `destroy()`  | Tears everything down permanently.                                                      | —           |

```typescript
// Yield while an embedded iframe or canvas owns the pointer
canvas.addEventListener("pointerenter", () => app.suspend());
canvas.addEventListener("pointerleave", () => app.resume());

// Pause when the tab is hidden happens automatically; this is for UI toggles
if (reducedEffects) app.disable();
else app.enable();
```

Note that `enable()` and `resume()` deliberately snap `smooth` to the pointer so
the cursor never animates in from `(-100, -100)` when it comes back.

## 10. Reduced motion

`state.reducedMotion` mirrors `prefers-reduced-motion: reduce`. When it is
`true`, the engine raises the damping rate so the cursor tracks the pointer
almost exactly, and your plugins should skip decorative scaling and rotation:

```typescript
update(app, dt) {
  const scale = app.state.reducedMotion ? 1 : 1 + speed / 2000;
}
```

## Next steps

- [Cookbook](/docs/guide/cookbook) — ready-made combinations.
- [State reference](/docs/reference/state) — every field and who writes it.
- [Plugin Authoring](/docs/architecture/authoring) — build your own.
