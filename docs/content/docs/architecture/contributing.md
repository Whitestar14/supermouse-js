---
title: Contributing
description: What belongs in this repo, how to test a change, and the documentation contract.
section: Architecture
order: 5
---

Supermouse is a plugin-first cursor runtime with a deliberately small core. The
project is conservative about what it accepts because a large official plugin
surface is a maintenance liability — the ecosystem is supposed to be userland.

## What belongs here

**Yes:**

- Core runtime fixes and performance work.
- Bug fixes in existing plugins.
- Documentation.
- **Reference-quality** plugins that demonstrate an essential pattern and that
  nothing else already covers.

**No:**

- Niche visual effects.
- Framework-specific wrappers (beyond the maintained Vue/React adapters).
- Stylistic variants of existing plugins.
- Experimental or opinionated behaviour.

Anything in the second list belongs as an [external plugin](/docs/architecture/authoring#publishing).
If you are unsure, open a discussion before writing the code.

## Getting set up

```bash
pnpm install
pnpm dev:docs      # docs site
pnpm dev:play      # playground
pnpm test          # all package suites
```

Use pnpm. Internal packages are linked with `workspace:*`, so source edits are
live in the docs site and playground with no rebuild step.

## Making a change

1. Branch from `master`.
2. Keep the PR to one concern.
3. Add or update tests — this is a rendering engine with real concurrency
   hazards, so "it looked right in the browser" is not enough.
4. Add a changeset if published behaviour changes: `pnpm changeset`.
5. Run `pnpm lint`, `pnpm test`, and `pnpm --filter supermouse-docs build`.

### Tests

Vitest runs in every package. The `core` suite is the model to follow: it drives
frames explicitly with `app.step(time)` and `autoStart: false` rather than
waiting on real animation frames.

```bash
pnpm test
pnpm --filter @supermousejs/core test
```

Cover the public contract instead of internals — `state`, the DOM output, and
lifecycle hooks. A plugin test should prove that the plugin enables, disables,
cleans up and never leaks its element.

## Code conventions

- **No DOM reads inside `update()`.** See [the DOM firewall](/docs/architecture/sandbox#the-dom-firewall).
- **Logic plugins must declare a negative `priority`.** Zero or positive causes
  visual tearing; `doctor()` reports it.
- **Options are read through `normalize()` / `normalizeAll()`**, so the hot path
  never branches on `typeof`.
- Match the surrounding style; the repo is formatted with Prettier and linted
  with ESLint (`pnpm format`, `pnpm lint`).
- Avoid new abstractions without a performance or ergonomics justification — the
  core is small on purpose.

## The documentation contract

Docs are data, not configuration. `docs/app/config/content-nav.ts` walks
`docs/content/**/*.md` at build time and derives everything from frontmatter:

| Frontmatter | Drives |
| :--- | :--- |
| `title` | The page `<h1>`, sidebar label, search label |
| `description` | Meta description and social previews |
| `section` | Sidebar group (`Guide`, `Architecture`, `Integrations`, `Reference`) |
| `order` | Position inside the group, and therefore the prev/next pager |
| `license` (optional) | The metadata strip under the page title |

So authoring a page is: create the markdown file, set the frontmatter, write the
body. You do **not** edit navigation config, the sitemap, or a route list — and
each page automatically gets an **Edit this page on GitHub** link plus a
**last updated** date read from its last git commit.

Two rules for content:

- **Do not repeat the title as an `# H1`.** It comes from frontmatter; an inline
  heading renders a second `<h1>`.
- **Verify claims against `packages/`.** Option names, defaults and method names
  in the docs are checked against the real sources during review.

Plugin pages are generated, not written: each package's `meta.json` is validated
against its exported `*Options` interface by `pnpm generate-docs`, which also
regenerates the package READMEs and the docs' plugin data.

## Versioning and releases

`@changesets/cli` produces semver bumps and changelogs.

```bash
pnpm changeset          # describe the change and pick a bump
pnpm version-packages   # apply versions + changelogs
pnpm release            # build packages, publish, then rebuild docs and playground
```

## Philosophy

- **Predictable behaviour.** No hidden state, no side effects outside the plugin
  container. Input in, output out.
- **Explicit data flow.** Intent → logic → physics → render. One direction, every
  frame.
- **Minimal magic.** Explicit configuration over guessing.
- **Userland extensibility.** The core stays small; the ecosystem does not.
