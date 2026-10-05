---
title: Contributing
description: Monorepo layout, workspace CLI, plugin scaffolding, test suites, and documentation automation.
section: Architecture
order: 3
---

Supermouse is structured as a `pnpm` monorepo containing the engine, shared utilities, official plugins, framework adapters, an interactive playground, and this documentation site.

---

## Repository Layout

| Path                             | Contents                                                                                |
| :------------------------------- | :-------------------------------------------------------------------------------------- |
| `packages/core`                  | Core cursor engine, input listeners, stage sandbox, and state types. Zero dependencies. |
| `packages/utils`                 | Math, DOM, SVG, and plugin authoring helpers. Zero dependencies.                        |
| `packages/*`                     | Standalone plugin packages (`@supermousejs/dot`, `ring`, `magnetic`, `stick`, etc.).    |
| `packages/vue`, `packages/react` | Framework adapters for Vue 3 / Nuxt and React / Next.js.                                |
| `playground/`                    | Standalone sandbox application for live experimentation.                                |
| `docs/`                          | Documentation application built with Nuxt 4 and `@nuxt/content`.                        |
| `scripts/`                       | Non-destructive build and metadata compilation scripts.                                 |

Packages are linked via `workspace:*`. Edits to package source files in `packages/` are immediately live in the documentation site and playground without intermediate compile steps.

---

## Workspace Commands

```bash
pnpm install            # Install workspace dependencies
pnpm dev:docs           # Compile plugin data and launch docs dev server
pnpm dev:play           # Launch the interactive playground
pnpm build:packages     # Build all library packages via Vite
pnpm test               # Run Vitest test suites across all packages
pnpm test:watch         # Run tests in watch mode
pnpm lint               # ESLint check across all files
pnpm format             # Format codebase using Prettier
pnpm generate-docs      # Compile plugin metadata for the docs app
```

---

## Adding a Plugin

Creating a plugin package requires no proprietary CLI or destructive tooling:

1. Create a new folder under `packages/<plugin-name>` (or copy a lightweight baseline such as `packages/dot`).
2. Update `package.json` with your package name (`@supermousejs/<plugin-name>`).
3. Add a `meta.json` file specifying your plugin's options, metadata, and description.
4. Run `pnpm install` — pnpm automatically links your package into the workspace via `pnpm-workspace.yaml`.

---

## Automated Documentation Generation

Plugin pages and documentation metadata are compiled passively:

```bash
pnpm generate-docs
```

This script (`scripts/build-data.js`) parses `packages/*/meta.json` and writes `docs/app/data/generated-plugins.ts` — a module typed against the docs app's own `PluginMeta` — for the docs app to import. It is strictly passive and non-destructive: it **never** overwrites authored package READMEs or alters your source files.

The output is gitignored, so run it after cloning. `pnpm dev:docs` and `pnpm build:docs` both do this for you.

---

## Pull Request Guidelines

1. **Focus**: Keep PRs focused on a single concern.
2. **Deterministic Tests**: Every new feature or bug fix must include tests. Vitest tests should drive frames using `app.step(time)` and `autoStart: false` rather than waiting for real animation frames:
   ```bash
   pnpm --filter @supermousejs/core test
   ```
3. **Changesets**: Include a changeset for any user-facing change:
   ```bash
   pnpm changeset
   ```
4. **Validation**: Ensure `pnpm lint`, `pnpm test`, and `pnpm build:packages` pass cleanly.

---

## Versioning & Releases

Releases are managed using `@changesets/cli`:

```bash
pnpm changeset          # Document changes and select semver bump (patch/minor/major)
pnpm version-packages   # Apply version bumps and update package CHANGELOGs
pnpm release            # Build, publish to npm, and build docs and playground
```
