---
title: Introduction
description: A headless cursor engine that separates pointer intent from cursor rendering, so effects never fight your UI framework.
section: Guide
order: 1
license: MIT
version: 2.5.0
coreSize: 5.4kb
---

A cursor is one of the few parts of a page your visitor touches before they read a single word. Get it right and the whole interface feels considered; get it wrong and every scroll, hover and keystroke carries a small friction. **Supermouse.js is a headless, physics-driven cursor engine** that makes the first impression feel effortless.

It tracks the pointer, smooths it with frame-rate-independent physics, and coordinates the hand-off between the custom cursor and the operating system — nothing more. Drawing is left to plugins, so you decide exactly what the cursor should look and feel like. The whole thing is written in TypeScript and the core ships at around 5.4&nbsp;kB.

## Why not just hide the cursor?

Because that is where most cursor libraries quietly break. The moment you reach for `cursor: none`, a chain of small decisions starts working against you:

- **Input smoothing introduces lag.** A cursor that visibly trails your hand feels broken, so the physics has to be tuned properly.
- **Third-party CSS fights back.** A stray `cursor: pointer` in a stylesheet you don't control produces a double cursor, which visitors read as a bug.
- **The OS still matters.** Text inputs, textareas, iframes and accessibility tools all depend on the native cursor; hiding it wholesale breaks them. Supermouse hands the pointer back to the OS precisely where it matters, and you can [tune exactly where](/docs/guide/usage#cursor-modes).
- **Real interfaces have more than one context.** A modal, a canvas, a nested artboard — each may want its own behaviour, and they should not fight over the pointer.

Supermouse solves these problems once, at the engine level, so your plugins can stay small and focused.

## A tiny taste

Getting started is two imports and a constructor. Everything else is opt-in:

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({
  smoothness: 0.15,
  plugins: [Ring({ size: 24 }), Dot({ size: 8 })]
});
```

That's a dot with a trailing ring. You can register more plugins later with `app.use(plugin)`, and pull any of them back out with `app.disablePlugin(name)`.

## Where to go next

- **[Installation](/docs/guide/installation)** — add `@supermousejs/core` and pick your visual plugins.
- **[Basic Usage](/docs/guide/usage)** — constructor options, declarative interaction rules, and the lifecycle.
- **[Scopes](/docs/guide/scopes)** — give different regions of a page their own cursor behaviour.
- **[Cookbook](/docs/guide/cookbook)** — copy-pasteable recipes for the effects people ask for most.
- **[The Pipeline](/docs/architecture/pipeline)** — the deep dive into execution order and frame timing.

> Supermouse was inspired by [Curzr](https://curzr.com), a lovely little project whose demo has gone unmaintained for years. This is an attempt to carry that idea forward on a modern foundation — and, ideally, to be the last cursor library you need to install.
