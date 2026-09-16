---
title: Introduction
description: A headless cursor engine that separates pointer intent from cursor rendering, so effects never fight your UI framework.
section: Guide
order: 1
license: MIT
version: 2.4.1
coreSize: 4.8kb
---

Supermouse.js is a cursor engine built with TypeScript that automatically handles mouse input, movement physics and a [plugin lifecycle](../architecture/sandbox#the-dom-firewall). Custom cursor handling gets complex when effects begin to stack on each other, and Supermouse aims to be a performant solution to this problem. It's written bottom-up from TypeScript, has zero dependencies, and the core is a tiny kernel so you can focus on writing or extending by [installing plugins](), official or community, directly into your framework of your choice, or even in plain HTML.

Check out the [Cookbook]() for the full catalogue of Supermouse.js' official plugins.

Initializing Supermouse in any project is simple, as integrating into your frontend is just to declare the constructor and register plugins, which you can extend later with `app.use(plugin)`.

```typescript
import { Supermouse } from "@supermousejs/core";
import { Dot } from "@supermousejs/dot";
import { Ring } from "@supermousejs/ring";

const app = new Supermouse({
  smoothness: 0.15,
  plugins: [Ring({ size: 24 }), Dot({ size: 8 })]
});
```

---

## Getting Started

- Check out [Installation](/docs/guide/installation) to mount your first cursor.
- See [Basic Usage](/docs/guide/usage) for options, interaction rules, lifecycle.
- See [Plugin Authoring](/docs/architecture/authoring) to learn how to write your own.
- See [Cookbook](/docs/guide/cookbook) for patterns of common effects.

---

## Motivation

I've always been fascinated by cursor effects seen on awwwards sites and every open source option that proposed to make those effects accessible would either ship only a dot with a 4-6kb overhead for styling the color and the click shrink effect, or they would also be coupled with render passes in frameworks and would have issues fighting the OS because setting `cursor: none` would break text inputs, iframes and accessibility. This would also be made worse when third-party CSS overrides it, producing double cursors; users hate losing the native cursor for a reason, and Supermouse supports [handling for native inputs for projects that want it](./api-to-cursor-auto). Some other cursor libraries, such as [Curzr](), the project Supermouse.js derives inspiration from massively, has not been supported for nearly 2 years since a [codepen demo]().

Supermouse solves each of these problems in the engine with a loop outside any framework's render cycle so it runs consistently on any refresh rate, geometry reading only on hover entry and a sophisticated stylesheet scoping mechanism for native cursor suppression that the core can rebuild deterministically. You can read the full technical overview of how it works in [the rendering pipeline](/docs/architecture/pipeline).
