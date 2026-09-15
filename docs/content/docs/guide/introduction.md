---
title: Introduction
description: Supermouse is a modular cursor engine that separates cursor intent from cursor rendering, so pointer effects never fight your UI framework.
section: Guide
order: 1
---

Supermouse is a small engine that owns exactly one job: turning pointer input
into smooth, observable coordinates that plugins can render. Your framework
keeps building your UI; Supermouse drives the cursor.

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({ smoothness: 0.15 });

app.use(Ring({ size: 24 })).use(Dot({ size: 8 }));
```

That is the whole integration surface: construct once, then register plugins.

## What problem it solves

Cursor libraries usually fail in one of three ways:

**Framework coupling.** Driving a cursor through reactive state (React, Vue)
costs a render pass per frame, so the cursor trails the real pointer by one or
two frames and re-renders your component tree 60+ times a second.

**Layout thrashing.** Reading `getBoundingClientRect()` or computed styles inside
a `requestAnimationFrame` loop forces synchronous layout, which is what actually
causes cursor jank on busy pages.

**Fighting the OS cursor.** Hiding the native pointer with a global
`cursor: none` breaks text inputs, iframes and accessibility, and third-party
CSS regularly overrides it — producing the classic double cursor.

Supermouse addresses each in the engine rather than in userland: it runs its own
`requestAnimationFrame` loop outside any framework render cycle, it scrapes DOM
geometry only when a hover begins, and it manages native-cursor suppression with
a scoped stylesheet it can rebuild deterministically.

## The three-stage model

Every frame is the same three-stage pipeline:

1. **Intent** — the input layer writes the raw pointer position to
   [`state.pointer`](/docs/reference/state#pointer). The frame loop copies it to
   [`state.target`](/docs/reference/state#target).
2. **Logic** — plugins with a negative [`priority`](/docs/reference/plugin-interface#priority)
   run first and may rewrite `state.target` (magnetism, snapping, gravity).
   They never touch the DOM.
3. **Physics & render** — the core damps
   [`state.smooth`](/docs/reference/state#smooth) toward `target`, then visual
   plugins read the result and write CSS transforms.

Because logic and visuals never share a mutable buffer, you can swap a `Ring`
for any other shape plugin without touching the magnetism logic.
[The Render Pipeline](/docs/architecture/pipeline) documents the exact order.

## Core guarantees

| Guarantee | How it holds |
| :--- | :--- |
| **Frame-rate independent** | All motion goes through `damp(a, b, lambda, dt)`, so 60Hz and 144Hz displays feel identical. |
| **No layout thrashing** | DOM geometry is read on hover entry, never inside `update()`. See [Stage & Sandbox](/docs/architecture/sandbox). |
| **No framework re-renders** | The loop runs on its own `requestAnimationFrame` and writes CSS transforms directly. |
| **Crash isolation** | A plugin that throws is disabled, cleaned up and logged; the rest of the pipeline keeps running. |
| **Accessibility first** | `prefers-reduced-motion` collapses smoothing to near-instant, and native controls (`input`, `textarea`, `select`, `contenteditable`) get the OS cursor back automatically. |
| **Tap-friendly** | On coarse pointers the engine hibernates by default instead of drawing a cursor where there is no mouse. |

## Packages

Install only what you use. `core` and `utils` have no runtime dependencies.

| Package | Purpose |
| :--- | :--- |
| [`@supermousejs/core`](/docs/reference/api) | Engine, input layer, stage and state. |
| [`@supermousejs/utils`](/docs/reference/utilities) | Math, DOM, SVG and authoring helpers. |
| [`@supermousejs/dot`](/docs/plugins/dot) · [`ring`](/docs/plugins/ring) · [`trail`](/docs/plugins/trail) | Baseline cursor shapes. |
| [`@supermousejs/magnetic`](/docs/plugins/magnetic) · [`stick`](/docs/plugins/stick) · [`states`](/docs/plugins/states) | Interaction and behaviour controllers. |
| [`@supermousejs/text`](/docs/plugins/text) · [`icon`](/docs/plugins/icon) · [`image`](/docs/plugins/image) · [`pointer`](/docs/plugins/pointer) | Content-replacing cursor states. |
| [`@supermousejs/labs`](/docs/plugins/smart-icon) | `SmartIcon`, `SmartRing`, `Sparkles`, `TextRing` — richer, more opinionated effects. |
| [`@supermousejs/vue`](/docs/integrations/vue) · [`@supermousejs/react`](/docs/integrations/react) | Lifecycle adapters that own `destroy()` for you. |

## Where to go next

- [Installation](/docs/guide/installation) — install and mount your first cursor.
- [Basic Usage](/docs/guide/usage) — options, interaction rules and lifecycle.
- [Plugin Authoring](/docs/architecture/authoring) — write your own plugin.
- [Cookbook](/docs/guide/cookbook) — copy-paste patterns for common effects.
