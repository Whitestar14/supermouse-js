
# Supermouse Design System

> **Philosophy:** Brutalist-lite. High Contrast. Instant State. Physics-based Motion.

## 1. Interaction Dynamics

### The "No-Transition" Rule (UI)
The user interface should feel like a high-precision tool, not a marketing website.
*   **Snap, Don't Fade:** Modal appearances, tab switches, and layout changes must be instantaneous (`duration-0`).
*   **Exception:** Micro-interactions on hover (colors, borders) are allowed fast transitions (`duration-100` or `duration-200`).

### The "Physics-First" Rule (Cursor)
*   **Only** the cursor and cursor-related effects are allowed to be smooth/floaty.
*   This contrast highlights the library's capability: the UI is rigid and static, while the cursor is fluid and organic.

## 2. Visual Identity

### Colors
*   **Primary:** Black (`#09090b`), White (`#ffffff`).
*   **Zinc:** Used for borders (`#e4e4e7`) and subtle backgrounds (`#fafafa`).
*   **Accents:** Strictly functional and sparse.
    *   **Amber (`#f59e0b`):** Primary highlight, focus states, and key callouts.
    *   **Red (`#ef4444`):** Errors, rejections, or destructive actions.
    *   **Monochrome Success:** Use Bold Black text or inverted colors (Black BG/White Text) instead of Green.

### Typography
*   **Headings:** Sans-serif (Inter/Satoshi). Tight tracking (`tracking-tighter`). Low line-height.
*   **Data/Code:** Monospace (JetBrains Mono). Used for all labels, stats, and configuration values.

### Components
*   **Buttons:** Sharp corners or very small radii (`rounded-sm`). 
*   **Borders:** All sections must be explicitly separated by `border-zinc-200`. The layout should look like a grid.

## 3. Playground Rules
*   **Canvas:** The preview area must always show the grid background to provide spatial reference for movement.
*   **Controls:** Inputs should update the cursor in real-time without requiring a reload.
