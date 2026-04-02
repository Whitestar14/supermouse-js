# Supermouse CLI - Professional Plugin Management

## Overview

The Supermouse CLI provides a unified, professional interface for managing plugins and configurations in the supermouse-js monorepo.

## Installation

The CLI is built-in and requires no additional installation. All commands are available through `pnpm` scripts or direct `node scripts/cli.js` execution.

## Usage

### Basic Usage

```bash
pnpm <command> [options]
```

### Available Commands

#### `create`

Create a new plugin with proper scaffolding and configuration.

```bash
pnpm create:plugin my-plugin       # Interactive
pnpm create:plugin my-plugin -y    # Skip confirmations
pnpm create:plugin my-plugin --dry-run  # Preview only
```

**What it does:**

- ✓ Validates plugin name (kebab-case)
- ✓ Creates directory structure
- ✓ Generates `package.json` with proper metadata
- ✓ Creates `tsconfig.json` extending `tsconfig.plugin.json` (NEW - fixes tsconfig mismatch!)
- ✓ Scaffolds `src/index.ts` with plugin template
- ✓ Auto-syncs configurations

#### `remove`

Remove a plugin from the monorepo.

```bash
pnpm remove:plugin my-plugin       # Interactive
pnpm remove:plugin my-plugin -y    # Skip confirmations
```

#### `sync`

Synchronize configuration files across all packages.

```bash
pnpm sync              # Interactive
pnpm sync -y           # Auto-confirm all changes
pnpm sync --verbose    # Show detailed changes
pnpm sync --dry-run    # Preview changes
```

#### `generate`

Generate documentation data from plugins.

```bash
pnpm generate-docs
```

#### `check`

Check bundle sizes of all packages.

```bash
pnpm check:size
```

#### `manage`

Interactive plugin manager (menu-driven).

```bash
pnpm manage
```

### Global Options

All commands support these global options:

- `--help` - Show help for a command
- `--verbose` / `-v` - Enable verbose output with debug information
- `--dry-run` - Show what would be done without making changes
- `--yes` / `-y` - Skip all confirmations

### Examples

```bash
# Create a new plugin interactively
pnpm create:plugin

# Create plugin with specific name, skip confirmations
pnpm create:plugin cool-effect -y

# Preview configuration sync without making changes
pnpm sync --dry-run

# Get help for a specific command
node scripts/cli.js create --help

# Enable verbose output
pnpm sync --verbose
```
