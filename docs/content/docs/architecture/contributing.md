---
title: Contributing
description: What belongs in this repo, how to test a change, and how the docs maintain themselves.
section: Architecture
order: 5
---

Supermouse is a small core with an intentionally small official plugin surface. The ecosystem is meant to be userland, and a large first-party catalogue is a maintenance liability, so the bar for adding to this repo is higher than the bar for publishing your own plugin.

## What belongs here

Core fixes, performance work, bug fixes in existing plugins, documentation, and reference-quality plugins that demonstrate a pattern nothing else covers.

Not: niche visual effects, framework wrappers beyond the maintained Vue and React adapters, stylistic variants of what exists, or opinionated behaviour. Those belong in [your own package](/docs/architecture/authoring#publishing). When you are unsure, open a discussion before writing code.

## Setup

```bash
pnpm install
pnpm dev:docs      # docs site (regenerates plugin data first)
pnpm dev:play      # playground
pnpm test          # every package suite
```

Use pnpm. Internal packages are linked with `workspace:*`, so an edit in `packages/` is live in the docs site and playground with no rebuild.

## Making a change

1. Branch from `main`.
2. One concern per PR.
3. Add or update tests. This is a rendering engine with real ordering hazards, so "it looked right in the browser" does not count.
4. `pnpm changeset` if published behaviour changed.
5. `pnpm lint`, `pnpm test`, and `pnpm build:docs`.

### Tests

Vitest runs in every package, with `jsdom`. The core suite is the model to follow: it drives frames with `app.step(time)` and `autoStart: false` instead of waiting on real animation frames.

```bash
pnpm test
pnpm --filter @supermousejs/core test
```

Assert on the public contract — `state`, the DOM, the lifecycle hooks. A plugin test should prove the plugin enables, disables, cleans up and does not leak its element.

## Code conventions

- No DOM reads inside `update()`. See [the DOM firewall](/docs/architecture/sandbox#the-dom-firewall).
- Logic plugins that publish `state.target` declare a negative priority, so consumers running later in the same frame see the value. `doctor()` reports the ones that do not.
- Options are read through `normalize()` / `normalizeAll()` so the hot path never branches on `typeof`.
- Prettier and ESLint own formatting: `pnpm format`, `pnpm lint`.
- No new abstraction without a performance or ergonomics reason. The core is small on purpose.

## The documentation contract

Docs are data. `docs/app/config/content-nav.ts` walks `docs/content/**/*.md` at build time and derives the sidebar, the prev/next pager, the prerender list and the search index from three frontmatter keys:

| Key | Drives |
| :--- | :--- |
| `title` | Page `<h1>`, sidebar label, search label |
| `section` | Sidebar group (`Guide`, `Architecture`, `Integrations`, `Reference`; anything else is appended alphabetically) |
| `order` | Position within the group, and therefore prev/next |
| `description` | Meta description and social previews |

"Last updated" comes from the file's last git commit, and every page gets an **Edit this page on GitHub** link from its own path. Adding a page means adding one markdown file — there is no route list, sitemap or navigation config to edit.

Two rules for content:

- Do not repeat the title as an `# H1`. It comes from frontmatter, and an inline one renders a second `<h1>`.
- Verify against `packages/`. Option names, defaults and method behaviour in these pages are read from source, not from memory.

Plugin pages are generated, never written: each package's `meta.json` is validated against its exported `*Options` interface by `pnpm generate-docs`, which also rewrites the package READMEs and `docs/app/data/generated-plugins.json`.

## Versioning

`@changesets/cli` drives bumps and changelogs.

```bash
pnpm changeset          # describe the change, pick a bump
pnpm version-packages   # apply versions and changelogs
pnpm release            # build + publish packages, then rebuild docs and playground
```

## Philosophy

Predictable behaviour over clever behaviour. Explicit data flow: input, then logic, then physics, then render, one direction, every frame. Minimal magic. A small core and a userland ecosystem.
