
# Supermouse Design System

> **Philosophy:** Brutalist-lite. High Contrast. Instant State. Physics-based Motion.

This document outlines the design principles and dynamics of the Supermouse application and documentation. All UI changes must adhere to these rules.

## 1. Interaction Dynamics

### The "No-Transition" Rule (UI)
The user interface should feel like a high-precision tool, not a marketing website.
*   **Do not** use CSS transitions for layout changes, modal appearances, or tab switches. State changes should be instantaneous (`v-if` / `display: none`).
*   **Do not** use easing for UI elements like drawers or sidebars. They should snap into place.
*   **Exception:** Small micro-interactions on hover (colors, borders) may have a very fast transition (e.g., `duration-100` or `duration-200`).

### The "Physics-First" Rule (Cursor)
*   **Only** the cursor and cursor-related effects are allowed to be smooth.
*   This contrast highlights the library's capability: the UI is rigid and static, while the cursor is fluid and organic.

## 2. Grid & Layout

### Strict Grid
*   The application uses a strict column layout defined in `Layout.vue` and `Playground.vue`.
*   **Gutter:** Fixed width (80px mobile / 96px desktop). Contains navigation logos or section numbers.
*   **Sidebar:** Fixed width (400px lg / 480px xl). Contains controls, text content, or headers.
*   **Main:** Flex grow. Contains visualization or interactive elements.
*   **Borders:** All sections must be separated by `border-zinc-200`.

### Positioning
*   Do not use floating overlays that break the grid (e.g., "Toast" messages are the only exception).
*   Contextual panels (like Code View) must replace existing grid cells (e.g., replace the Configuration panel) rather than sliding over them.

## 3. Typography

### Font Stack
*   **Sans:** Inter (`font-sans`). Used for headings and body text.
*   **Mono:** JetBrains Mono (`font-mono`). Used for code, labels, numbers, and small UI text.

### Hierarchy
*   **Labels:** `text-[10px] uppercase tracking-widest font-bold text-zinc-400`.
*   **Headings:** `tracking-tighter leading-none`.
*   **Body:** `text-pretty leading-relaxed`.

## 4. Visual Identity

### Colors
*   **Primary:** Black (`#000`), White (`#fff`).
*   **Accents:** Purple (`#750c7e` / Tailwind `purple-600`) for active states or emphasis.
*   **Zinc:** Used for borders (`zinc-200`) and subtle backgrounds (`zinc-50`).

### Components
*   **Buttons:** Sharp corners (no rounded-lg/xl, max rounded-sm). High contrast hover states (White -> Black).
*   **Inputs:** `bg-transparent` or `bg-zinc-50`, strictly bordered.

## 5. Technical Constraints

### Cursor Management
*   The `CursorEditor` is a modal environment. When it opens, it **must** pause the global/layout cursor to prevent double-cursor rendering.
*   The `Playground` gallery **must** use the standard documentation cursor to maintain immersion.
*   Do not rely on CSS `cursor: none` alone; use the `Supermouse` instance lifecycle (`enable`/`disable`) to manage visibility logic.
