# Supermouse.js

Supermouse v2 is a modular, TypeScript-first cursor-effects system for the web. The project was rebuilt as a pnpm monorepo centered on a small, focused `core` package that exposes a simple plugin API and a runtime stage/input system. Individual visual effects (dot, ring, sparkles, image, text, magnetic, etc.) are split into closed-off packages so they can be developed, tested, and published independently.

This README documents the repository layout, the runtime and plugin architecture, the dev toolchain, and the custom CLI helpers used to scaffold and remove plugins. It also lists the current gaps and recommended improvements for v2.

---

Table of contents
- TL;DR / Quick start
- Project layout
- Goals & design principles
- Architecture (Core, Systems, Plugins)
- Plugin authoring (patterns, APIs & data attributes)
- Toolchain & workspace conventions
- Custom CLI tools (create/remove plugin)
- Where this repo needs ironing out / roadmap
- Development & publishing notes
- Contributing & license

---

TL;DR / Quick start

- Install dependencies: `pnpm install`
- Run the demo playground (Vue + Tailwind): `pnpm dev` (runs `supermouse-playground`)
- Build all packages: `pnpm -r build`
- Create a plugin scaffold: `pnpm run create:plugin <name>`
- Remove a plugin: `pnpm run remove:plugin <name>`

Example usage (runtime):

```ts
import { Supermouse } from '@supermousejs/core';
import { Dot } from '@supermousejs/dot';
import { Ring } from '@supermousejs/ring';

const app = new Supermouse({ smoothness: 0.12 });
app.use(Dot({ size: 8, color: '#f0f' }));
app.use(Ring({ size: 20, enableSkew: true }));
```

Hover-targets and behavior are data-attribute driven. Example:

```html
<button data-supermouse-stick>Stick me</button>
<div data-supermouse-color="#00ff00">Color override</div>
<a data-supermouse-img="/path/to/img.jpg">Show image on hover</a>
```

---

Project layout

Top-level structure (important files/directories):

- `packages/`
  - `core/` — the runtime: `Supermouse` class, `systems` (Input, Stage), `utils` and types. This is the only package that implements the runtime loop and plugin lifecycle.
  - `dot/`, `ring/`, `sparkles/`, `image/`, `text/`, `magnetic/`, … — effect plugins; each is an independent package usually named `@supermousejs/<name>`.
  - `legacy-wrapper/` — compatibility wrapper for v1 users (exports the old class-based API).
  - `react/`, `vue/` — framework bindings (currently placeholders).
- `playground/` — Vite + Vue dev app used to demo and iterate on plugins (pulls packages via `workspace:*`).
- `scripts/` — local CLI helpers: `create-plugin.js`, `remove-plugin.js`.
- `pnpm-workspace.yaml` — workspace config; the monorepo is managed with pnpm.
- `tsconfig.base.json` — base TypeScript settings for packages.
- `CHANGELOG.md`, `package.json` (root), and Changesets tooling in devDependencies for versioning.

Repository tree (ASCII)

```text
.
+-- .changeset/
|   +-- README.md
|   \-- config.json
+-- .git/
+-- .gitignore
+-- CHANGELOG.md
+-- package.json
+-- pnpm-lock.yaml
+-- pnpm-workspace.yaml
+-- README.md
+-- tsconfig.base.json
+-- scripts/
|   +-- create-plugin.js
|   \-- remove-plugin.js
+-- packages/
|   +-- core/
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   +-- vite.config.ts
|   |   \-- src/
|   |       +-- index.ts
|   |       +-- Supermouse.ts
|   |       +-- types.ts
|   |       +-- systems/
|   |       |   +-- index.ts
|   |       |   +-- Input.ts
|   |       |   \-- Stage.ts
|   |       \-- utils/
|   |           +-- index.ts
|   |           +-- dom.ts
|   |           +-- math.ts
|   |           +-- effects.ts
|   |           +-- css.ts
|   |           +-- layers.ts
|   |           \-- options.ts
|   +-- dot/
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   +-- vite.config.ts
|   |   \-- src/
|   |       \-- index.ts
|   +-- ring/
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   +-- vite.config.ts
|   |   \-- src/
|   |       \-- index.ts
|   +-- sparkles/
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   \-- src/
|   |       \-- index.ts
|   +-- image/
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   +-- vite.config.ts
|   |   \-- src/
|   |       \-- index.ts
|   +-- text/
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   \-- src/
|   |       \-- index.ts
|   +-- magnetic/
|   |   +-- package.json
|   |   +-- tsconfig.json
|   |   +-- vite.config.ts
|   |   \-- src/
|   |       \-- index.ts
|   +-- legacy-wrapper/
|   |   +-- package.json
|   |   \-- index.js
|   +-- react/ (placeholder)
|   \-- vue/ (placeholder)
+-- playground/
|   +-- package.json
|   +-- index.html
|   +-- vite.config.ts
|   +-- tsconfig.json
|   +-- postcss.config.ts
|   +-- tailwind.config.ts
|   \-- src/
|       +-- main.ts
|       +-- App.vue
|       \-- index.css
\-- node_modules/ (omitted)
```

---

Goals & design principles

- Minimal core: the `core` package is intentionally small and focused on input normalization, cursor hiding/visibility, a single DOM stage, and the plugin lifecycle.
- Plugin-first: visual/interaction features live in separate packages and should be able to be built and published independently.
- Data-driven integration: plugins integrate with DOM elements via semantic `data-supermouse-*` attributes to provide flexible, declarative behavior.
- Framework-agnostic runtime: core uses vanilla DOM operations. Framework bindings (React/Vue) can be provided as thin adapters.
- Respect preferences & accessibility: supports `prefers-reduced-motion` and auto-disables on touch/narrow-pointer environments by default.

---

Architecture overview

Core runtime (in `packages/core`)
- `Supermouse` (core runtime) — located at `packages/core/src/Supermouse.ts`.
  - Maintains `state` (`pointer`, `target`, `smooth`, `velocity`, `isHover`, `isNative`, ...).
  - Hosts an update loop based on `requestAnimationFrame` (tick accepts `deltaTime`).
  - Manages `plugins` (a `Map<string, SupermousePlugin>`).
  - Responsible for plugin lifecycle: `install`, `update` (called every frame if enabled), `onEnable` / `onDisable`, `destroy`.
  - Exposes plugin-management helpers: `use(plugin)`, `enablePlugin(name)`, `disablePlugin(name)`, `togglePlugin(name)` and `registerHoverTarget(selector)`.

- Systems
  - `Input` (`packages/core/src/systems/Input.ts`) — listens for `mousemove`, `touch*` (optional), `mousedown`/`mouseup` and manages `isNative`/`isHover`/`pointer` state. It also auto-disables on mobile (media query `pointer: fine`) when configured to do so and watches `prefers-reduced-motion`.
  - `Stage` (`packages/core/src/systems/Stage.ts`) — single DOM container inserted on the page (fixed full viewport, `pointer-events: none`, `z-index: 9999`) where plugins append their DOM. Also responsible for hiding native cursor across a configurable selector list (injecting a `<style>` block to set `cursor: none !important;`).

- Utils & Types — `packages/core/src/utils` and `types.ts`: helpful building blocks for plugin authors: DOM helpers, math/lerp/dist/angle helpers, `Easings`, `Layers` (z-indices), and `resolve` for dynamic option values.

Plugin model & conventions
- Interface: a `SupermousePlugin` is a plain object with at minimum a `name` string and optional lifecycle methods:
  - `install(app)` — called once on `use` to create DOM and register selectors.
  - `update(app, deltaTime)` — called every tick when the plugin is enabled.
  - `destroy(app)` — cleanup.
  - `onEnable(app)` / `onDisable(app)` — optional toggles.
  - `isEnabled?: boolean` — if `false`, `update` will not be called.

- Behavior conventions:
  - Plugins append child elements to `app.container` (the `Stage` element).
  - Plugins should call `app.registerHoverTarget(selector)` for any selectors they rely on so the stage knows to hide the native cursor on those elements.
  - Plugins may read and, in some cases, set `app.state.target` (e.g., the `magnetic` plugin adjusts the target position).

How Supermouse orchestrates plugins
- Each animation frame Supermouse:
  1. Updates visibility & native cursor status based on `Input` and state.
  2. Copies the pointer position into `state.target` when `input.isEnabled`.
  3. Runs `plugin.update(app, deltaTime)` for each plugin where `isEnabled !== false`.
  4. Smoothes motion (`smooth` vs `target`) and computes `velocity`.

This means plugins are run in a simple deterministic sequence. Plugins can influence subsequent behavior by modifying `app.state` (e.g., `Magnetic` influences `target`) and by registering hover selectors.

---

Plugin authoring guide (practical)

1. Scaffold a package:
   - `pnpm run create:plugin my-plugin` (this creates `packages/my-plugin` with `package.json`, `tsconfig.json`, `vite.config.ts` and a starter `src/index.ts`)
2. Implement a plugin (example):

```ts
import type { SupermousePlugin } from '@supermousejs/core';
import { dom, Layers, resolve } from '@supermousejs/core';

export const MyPlugin = (opts = {}): SupermousePlugin => {
  let el: HTMLDivElement;
  return {
    name: 'my-plugin',
    install(app) {
      el = dom.createDiv();
      el.style.zIndex = Layers.CURSOR;
      app.container.appendChild(el);
      app.registerHoverTarget('[data-my-attr]');
    },
    update(app) {
      const { x, y } = app.state.smooth;
      dom.setTransform(el, x, y);
    },
    destroy() { el.remove(); }
  };
};
```

3. Build & test locally:
   - `pnpm -w -F @supermousejs/my-plugin build` (or `pnpm -r build` to build everything)
   - Add the plugin to the `playground` (the scaffolders do this automatically when created) and test the behavior.

Data attributes used by built-in plugins
- `data-supermouse-color` — color override for `Dot`/`Ring`.
- `data-supermouse-stick` — allow `Ring` to "stick" to an element's geometry.
- `data-supermouse-img` — `Image` plugin: show an image on hover.
- `data-supermouse-text` — `Text` plugin: show text on hover.
- `data-supermouse-magnetic` — `Magnetic` plugin: attract pointer toward element center.
- `data-supermouse-ignore` — VETO: force native cursor / ignore supermouse.

(Plugins may register additional selectors using `app.registerHoverTarget`.)

---

Toolchain & monorepo setup

- Package manager: `pnpm` workspace (`pnpm-workspace.yaml`). All internal packages reference the `core` package using `workspace:*` so workspaces are linked locally.
- Language: TypeScript (root `tsconfig.base.json`), `strict` mode.
- Bundler: `vite` configured to build libraries (`lib` mode). Each build typically emits an ESM (`index.mjs`) and a UMD (`index.umd.js`) file.
- Types: `vite-plugin-dts` is used in library builds to generate `.d.ts` files.
- Versioning: `@changesets/cli` is present in `devDependencies` to manage multi-package releases.
- Testing: `vitest` is in root `devDependencies` (tests need to be added per-package / standardized).
- Playground: `playground/` is a Vite Vue application (uses Tailwind + PostCSS) and lists internal packages as workspace dependencies. The `create-plugin` script adds a Vite alias to the playground for faster iteration.

Packaging & dependency isolation
- Plugins depend on `@supermousejs/core` via `workspace:*` during local development.
- Vite configs for plugins mark `@supermousejs/core` as `external` so core is not bundled into plugin distributions; the plugin's UMD/ESM will expect a single shared core at runtime. This avoids duplicated runtime and allows plugin builds to remain small.
- Framework bindings (React/Vue) should use `peerDependencies` to avoid multiple copies of framework libs across packages.

---

Custom CLI tooling (scaffolding)

- `scripts/create-plugin.js` — scaffolds a new package at `packages/<name>` with a `package.json` (including `workspace:*` core dep), `tsconfig.json`, `vite.config.ts`, and a starter `src/index.ts`. It automatically adds the plugin as a dependency in `playground/package.json` and adds a Vite alias in the playground's `vite.config.ts` for local editing.

- `scripts/remove-plugin.js` — safely unlinks and removes a plugin from `playground` and deletes `packages/<name>`.

Use:
- `pnpm run create:plugin <name>`
- `pnpm run remove:plugin <name>`

These scripts are intentionally simple and interactive; they do not currently update documentation or run linting.

---

Where this repo needs ironing out / roadmap & recommendations

(Observed gaps and suggested priorities for v2 stabilization)

1. Standardize package configs
   - Several packages are missing `vite.config.ts` or consistent `package.json` scripts (e.g. `test`, `build`). Ensure all packages follow the same template (the `create-plugin.js` template is a good baseline).
2. Tests & CI
   - Add a `test` script to each package and add unit tests (using `vitest`) for `core` systems and plugin behavior. Add CI (GitHub Actions) to run tests, builds, and type checks on PRs.
3. Linting & formatting
   - Add `eslint` + `prettier` for consistent style across packages.
4. Publish workflow
   - Document publishing steps; ensure `changesets` is configured and a `publish` workflow is added to automate releases.
5. Finish framework bindings or remove placeholders
   - `react/` and `vue/` directories exist but are empty. Add thin, well-typed adapters with `peerDependencies` on React/Vue.
6. Improve `create-plugin.js`
   - Add optional flags for author, initial tests, README, LICENSE, CHANGELOG, and CI configuration.
7. Documentation & examples
   - Add a `docs/` section or Storybook to demonstrate each plugin's options and attribute-driven usage.
8. Performance & accessibility audits
   - Add performance budgets and ARIA/accessibility checks for keyboard-only & assistive-tech scenarios.

---

Development notes

- Run the demo playground: `pnpm dev`
- Build all packages: `pnpm -r build` (runs each packages' `build` script)
- Create/remove plugin: `pnpm run create:plugin <name>` / `pnpm run remove:plugin <name>`
- Root tooling: `changesets` is available for managing multi-package versioning.

Publishing: prefer `changesets` to prepare releases and then `pnpm -r publish` (or a CI-driven publish action).

---

Appendix — files of interest

- `packages/core/src/Supermouse.ts` — core runtime and update loop
- `packages/core/src/systems/Input.ts` — input event normalization and accessibility checks
- `packages/core/src/systems/Stage.ts` — DOM stage and native-cursor hiding
- `packages/*/src/index.ts` — plugin entry points (see `dot`, `ring`, `sparkles`, `image`, `text`, `magnetic`)
- `packages/legacy-wrapper/index.js` — compatibility wrapper for v1 API
- `scripts/create-plugin.js` and `scripts/remove-plugin.js` — scaffolding helpers

---

Contributing

Contributions are welcome. Please open issues/PRs and follow the standard steps:
- Fork, branch, code, add tests, ensure the playground demonstrates your changes, open a PR with a clear description.

License

MIT