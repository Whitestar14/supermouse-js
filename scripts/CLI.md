# Supermouse CLI - Professional Plugin Management

## Overview

The Supermouse CLI is the repo’s shared plugin-development control plane. It is intentionally designed to be small, canonical, and easy to extract into a standalone package later, such as `@supermouse/cli`.

The runtime now uses a single command registry module at [scripts/core/command-registry.js](scripts/core/command-registry.js), a shared scaffold helper at [scripts/core/plugin-scaffold.js](scripts/core/plugin-scaffold.js), and a canonical package policy module at [scripts/core/package-policy.js](scripts/core/package-policy.js) so command metadata, plugin bootstrapping, and package manifest normalization all flow through one repo-wide policy layer.

## Installation

The CLI is built-in to the monorepo and is available through either:

```bash
pnpm <command> [options]
```

or:

```bash
node scripts/cli.js <command> [options]
```

## Command Surface

### `create`

Scaffold a new plugin package using the shared plugin template helper.

```bash
pnpm create:plugin my-plugin
pnpm create:plugin my-plugin -y
pnpm create:plugin my-plugin --dry-run
```

What it now does:

- validates package naming
- creates the package directory structure
- writes the canonical plugin `package.json`
- writes the canonical `tsconfig.json`
- writes the default `src/index.ts` scaffold when missing
- reuses the same scaffold path from the interactive manager

### `remove`

Remove a plugin from the workspace.

```bash
pnpm remove:plugin my-plugin
pnpm remove:plugin my-plugin -y
```

### `sync`

Synchronize repo-level package configuration across all plugin packages using the shared package policy module.

```bash
pnpm sync
pnpm sync -y
pnpm sync --verbose
pnpm sync --dry-run
```

What it now does:

- enforces the canonical Vite build entry points
- creates the standard `exports` map when missing
- normalizes `publishConfig.access`
- ensures dependency sections exist in a consistent shape
- reuses the same policy in the interactive manager

### `generate`

Generate package README content and the docs JSON dataset from plugin metadata.

```bash
pnpm generate-docs
```

### `check`

Check the published bundle size of packages.

```bash
pnpm check:size
```

### `manage`

Run the interactive menu-driven plugin manager.

```bash
pnpm manage
```

## Runtime Architecture

The CLI is intentionally split into reusable, extractable building blocks:

- [scripts/cli.js](scripts/cli.js) — command dispatch and global option parsing
- [scripts/core/command-registry.js](scripts/core/command-registry.js) — canonical command metadata source
- [scripts/core/plugin-scaffold.js](scripts/core/plugin-scaffold.js) — shared plugin bootstrapping logic
- [scripts/core/package-policy.js](scripts/core/package-policy.js) — repo-wide package manifest normalization policy
- [scripts/commands/](scripts/commands/) — command implementations

This makes the CLI much easier to later promote into a package such as `@supermouse/cli` without rewriting the command contract.

## Global Options

All commands support the following options:

- `--help` — show help for the command
- `--verbose` / `-v` — enable verbose/debug output
- `--dry-run` — preview changes without writing files
- `--yes` / `-y` — auto-confirm non-destructive workflows

## Examples

```bash
# Create a new plugin interactively
pnpm create:plugin

# Create a plugin with a specific name
pnpm create:plugin cool-effect -y

# Preview configuration sync without writing files
pnpm sync --dry-run

# Get help for a specific command
node scripts/cli.js create --help

# Enable verbose output
pnpm sync --verbose
```
