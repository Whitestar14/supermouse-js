---
title: Toolchain
description: The monorepo layout, its CLI, tests, and how the docs build themselves.
section: Guide
order: 6
---

The project is a pnpm workspace containing the engine, every plugin, a
standalone playground and this documentation site. Almost everything is driven
from two scripts: `scripts/cli.js` at the root, and Nuxt inside `docs/`.

## Layout

| Path | Contents |
| :--- | :--- |
| `packages/core` | Engine, input layer, stage and state types. No dependencies. |
| `packages/utils` | Math, DOM, SVG and authoring helpers. No dependencies. |
| `packages/*` | One published package per plugin. Each depends only on `utils`. |
| `packages/vue`, `packages/react` | Lifecycle adapters. |
| `playground/` | The standalone Labs app. |
| `docs/` | This site — Nuxt 4 + `@nuxt/content`. |
| `scripts/` | The workspace CLI. |

Internal packages are linked with `workspace:*`, so editing a package source is
picked up by consumers immediately. Libraries are built with Vite in library
mode and emit dual ESM/UMD bundles, with `.d.ts` files via `vite-plugin-dts`.

## Commands

```bash
pnpm install            # install the workspace
pnpm dev:docs           # regenerate docs data, then run the docs site
pnpm dev:play           # run the playground
pnpm build:packages     # build every package
pnpm test               # vitest across all packages
pnpm test:watch         # same, watch mode
pnpm lint               # eslint --fix
pnpm format             # prettier
pnpm check:size         # bundle size report
```

## Scaffolding plugins

```bash
pnpm run manage                 # interactive: create, remove, sync
pnpm run create:plugin <name>   # scaffold a package, link it to the playground
pnpm run remove:plugin <name>   # unlink and delete a package
```

`create:plugin` generates the package folder, `package.json`, `tsconfig`, Vite
config, `meta.json` and a typed `src/index.ts`, then links it into the workspace
so you can test it inside the playground right away.

## Tests

Every package has a Vitest suite; `core` covers the interesting parts — the input
layer, cursor-mode resolution, suspend/resume, nested instances and the plugin
lifecycle.

```bash
pnpm test
pnpm --filter @supermousejs/core test
```

Plugins are worth testing through the public contract rather than by reaching
into their internals: drive `app.step(time)` with synthetic frames and assert on
the DOM or on `state`.

## Generating documentation data

Plugin pages are **generated from package metadata**, never hand-written:

```bash
pnpm generate-docs
```

That command:

1. Reads each `packages/*/meta.json` and validates the declared option names
   against the package's exported `*Options` interface, warning on drift in
   either direction.
2. Regenerates each package `README.md` from its metadata.
3. Writes `docs/app/data/generated-plugins.json`, which powers the plugin pages,
   the sidebar's plugin groups and the search index.

Because the option list is validated against the TypeScript interface, an option
that only exists in `meta.json` will be reported rather than silently documented.

## How the docs site builds itself

Written pages need no registration. At build time `docs/app/config/content-nav.ts`
walks `docs/content/**/*.md` and reads each file's frontmatter, which produces:

- the prerender + sitemap route list,
- the sidebar groups and their order,
- the prev/next pager,
- the search index,
- and the per-page **last updated** date, taken from each file's last git commit.

So adding a page means adding one markdown file:

```md
---
title: Web Components
description: Using Supermouse inside a custom element.
section: Integrations
order: 3
---
```

`section` groups it in the sidebar (Guide, Architecture, Integrations, Reference;
anything else is appended alphabetically) and `order` positions it within the
group. Every page also gets an **Edit this page on GitHub** link derived from its
own path, so there is nothing to keep in sync by hand.

Markdown code fences are highlighted by the site's own highlighter rather than
Shiki, so fenced blocks and the `<CodeBlock>` component render identically.

## Versioning

`@changesets/cli` drives semver bumps and changelogs. Any PR that changes
published behaviour should ship a changeset:

```bash
pnpm changeset
pnpm version-packages
pnpm release
```
