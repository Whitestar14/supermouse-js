
## Changelog

### Version 2.0.0 (In Development)
**A complete rewrite of the library as a modular, TypeScript-first monorepo.**

#### 🚀 Core & Architecture
- **Monorepo Migration:** Switched to `pnpm` workspaces. The runtime is now isolated in `@supermousejs/core`, making the library significantly lighter for users who only need specific effects.
- **Plugin System V2:**
  - Introduced **Priority Scheduling**: Logic plugins (like `Magnetic`) now run *before* visual plugins to ensuring zero-latency rendering.
  - **Lifecycle Methods**: Standardized `install`, `update`, `onEnable`, `onDisable`, and `destroy`.
  - **State Management**: Centralized `MouseState` (pointer, target, smooth, velocity) shared across all plugins.
- **TypeScript:** Full TSDoc coverage and strict typing for all options and state properties.

#### 📚 Documentation & Playground
- **Interactive Editor:** Added a live "Studio" environment to test plugins, tweak parameters, and visualize physics settings in real-time.
- **Live Code Generation:** The playground now generates copy-paste ready TypeScript code based on your visual configuration.
- **Recipes Gallery:** Pre-configured presets for common patterns (Precision Dot, Vehicle Pointer, Text Ring, Context Icons).
- **Custom Syntax Highlighter:** Implemented a lightweight, regex-based tokenizer for JS/TS/HTML highlighting to remove dependencies on heavy libraries like Prism/Highlight.js.
- **"Brutalist-lite" UI:** A custom design system for the docs using sharp edges, high contrast, and mono typography.

#### ✨ New Plugins
- **`@supermousejs/pointer`**: A brutalist, vehicle-steering style cursor that rotates based on velocity.
- **`@supermousejs/magnetic`**: Decoupled physics logic that modifies the shared `target` state, allowing *any* visual cursor to become magnetic.
- **`@supermousejs/text-ring`**: SVG-based rotating text with seamless looping and auto-spreading.
- **`@supermousejs/zoetrope`**: Shared math utilities for circular layouts.
- **Standard Suite**: Ported `Dot`, `Ring`, `Sparkles`, `Image`, and `Text` to the new architecture.

#### 🎨 Visual Identity
- **Aesthetic**: "Brutalist-lite" — sharp edges, high contrast, technical typography.
- **Logo**: "Physics Hull" concept — a sharp target pointer encapsulated by a smoothed, lagging outline.

#### ⚠️ Edge Cases & Notes
- **SVG Pivots**: Rotating cursors (like `Pointer`) require precise alignment. If the SVG isn't centered in its viewbox, rotation will cause it to "orbit" the click point rather than spin in place.
- **Touch Devices**: V2 now includes `autoDisableOnMobile` by default, using `matchMedia('(pointer: fine)')` to prevent cursor rendering on touch screens.
- **Native Cursor Hiding**: The `Stage` system now dynamically injects CSS to hide the cursor on registered hover targets, preventing the "double cursor" glitch.

#### 🔜 Roadmap / Upcoming
- **`@supermousejs/icon`**: A state-machine plugin to handle semantic cursor changes (e.g., text beam, pointer hand, loading spinner).
- **Framework Wrappers**: dedicated `react` and `vue` packages to simplify integration.

---

### Version 1.0.0 (Legacy)
Initial release of Supermouse.js

### Features:
- Customizable cursor with dot and ring elements
- Multiple themes: default, neon, monochrome, sunset, ocean
- Smooth animations for cursor movement
- Responsive hover effects for interactive elements
- Customizable options for ring size, animation duration, and colors
- React integration with useSupermouse hook
### API:
- `setTheme()`: Change cursor theme
- `handleHoverEffects()`: Apply hover effects to interactive elements
- `setRingSize()`: Adjust outer ring size
- `setPointerColor()`: Customize pointer color
- `setAnimationDuration()`: Modify animation timing
- `setRingAnimationDuration()`: Adjust ring animation duration
- `setRingAnimationDelay()`: Set delay for ring animations
- `setHoverColor()`: Customize hover effect color
### Development:
- Implemented with JavaScript
- Jest testing framework with high code coverage
- Rollup for build process
