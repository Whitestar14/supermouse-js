
# Changelog

## Version 2.0.0 (Stable)

**A complete rewrite of the library as a modular, TypeScript-first monorepo.**

### 📦 Architecture & Monorepo
- **Core Separation:** The runtime loop is now isolated in `@supermousejs/core`. It handles input normalization, the `requestAnimationFrame` loop, and the plugin lifecycle. It does not render anything by itself.
- **Package Split:** Visual effects are now independent packages (`@supermousejs/dot`, `@supermousejs/ring`, etc.) to reduce bundle size for consumers.
- **Shared Utilities:** Common math (`lerp`, `damp`) and DOM helpers are moved to `@supermousejs/utils`.

### 🚀 Runtime Features
- **Priority Scheduling:** Plugins now support a `priority` property.
  - Negative priority (e.g. `-10`): **Logic Plugins** (Magnetic, Stick) run *before* physics to modify the target.
  - Positive priority (e.g. `0`): **Visual Plugins** run *after* physics to render the state.
- **Reactive State:** The core state object (`pointer`, `target`, `smooth`, `velocity`) is shared by reference across all plugins.
- **Smart Smoothing:** Physics integration now uses frame-rate independent damping (`damp`) instead of simple lerping, ensuring consistent behavior on 120hz displays.

### ✨ New Plugins
- **`@supermousejs/magnetic`**: A logic-only plugin that modifies the cursor's target position to snap to elements.
- **`@supermousejs/stick`**: Morphs the cursor shape to match the bounding box of hovered elements.
- **`@supermousejs/pointer`**: A "Vehicle" style pointer that rotates based on velocity vector.
- **`@supermousejs/labs`**: Experimental state-driven components (`SmartIcon`, `SmartRing`).

### 🛠 Developer Experience
- **Playground:** A local Vite+Vue app for testing plugins in isolation.
- **Scaffolding:** `pnpm create:plugin` script to generate new packages with correct TS/Vite configs.
- **Documentation:** New documentation site with interactive examples.

---

## Version 1.0.0 (Legacy)

- Initial release.
- Single-file bundle containing Dot and Ring.
- Basic React hook support.
