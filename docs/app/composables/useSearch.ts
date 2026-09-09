import { ref, computed, shallowRef } from "vue";
import MiniSearch from "minisearch";
import { DOCS_NAVIGATION } from "@config/navigation";
import { PLUGINS } from "@data/plugin-data";
import { API_SECTIONS } from "@composables/useApiReference";

export interface SearchResult {
  id: string;
  label: string;
  description?: string;
  heading?: string;
  path: string;
  type: "Guide" | "Plugin" | "API" | "Architecture";
  section?: string;
  keywords?: string[];
  content?: string;
}

interface SearchDocument {
  id: string;
  label: string;
  heading: string;
  path: string;
  type: "Guide" | "Plugin" | "API" | "Architecture";
  section: string;
  description: string;
  keywords: string;
  content: string;
}

// Curated default recommendations when search query is empty
const QUICK_PICKS: SearchResult[] = [
  {
    id: "quick-intro",
    label: "Introduction",
    description: "Overview and core philosophy of Supermouse",
    path: "/docs/guide/introduction",
    type: "Guide",
    section: "Guide"
  },
  {
    id: "quick-install",
    label: "Installation",
    description: "Install via pnpm, npm, yarn, or bun",
    path: "/docs/guide/installation",
    type: "Guide",
    section: "Guide"
  },
  {
    id: "quick-usage",
    label: "Basic Usage",
    description: "Initializing your first cursor with plugins and options",
    path: "/docs/guide/usage",
    type: "Guide",
    section: "Guide"
  },
  {
    id: "quick-labs",
    label: "Interactive Labs",
    description: "Real-time interactive GSAP cursor playground",
    path: "/labs",
    type: "Guide",
    section: "Playground"
  },
  {
    id: "quick-api",
    label: "API Reference",
    description: "Complete options, state, methods, and lifecycle reference",
    path: "/docs/reference/api",
    type: "API",
    section: "Reference"
  },
  {
    id: "quick-magnetic",
    label: "Magnetic Plugin",
    description: "Magnetic attraction to elements with spring physics",
    path: "/docs/plugins/magnetic",
    type: "Plugin",
    section: "Plugins"
  },
  {
    id: "quick-dot",
    label: "Dot Plugin",
    description: "Minimalist ultra-fast trailing dot cursor",
    path: "/docs/plugins/dot",
    type: "Plugin",
    section: "Plugins"
  }
];

// Rich searchable documents dataset
const SEARCH_DOCUMENTS: SearchDocument[] = [
  // Guide pages & deep sub-headings
  {
    id: "guide-intro",
    label: "Introduction",
    heading: "Core Philosophy",
    path: "/docs/guide/introduction",
    type: "Guide",
    section: "Guide",
    description: "Modular, high-performance cursor engine for dynamic web cursors.",
    keywords: "overview getting started philosophy runtime headless zero overhead",
    content: "Supermouse is built on a simple premise: the core cursor engine never draws a pixel. Plugins own visual rendering while the core coordinates physics, easing, and state."
  },
  {
    id: "guide-installation",
    label: "Installation",
    heading: "Setup & Package Managers",
    path: "/docs/guide/installation",
    type: "Guide",
    section: "Guide",
    description: "Step-by-step setup using pnpm, npm, yarn, or bun.",
    keywords: "install pnpm npm yarn bun cdn setup import install packages",
    content: "Install @supermousejs/core and desired plugins like @supermousejs/dot or @supermousejs/magnetic."
  },
  {
    id: "guide-usage",
    label: "Basic Usage",
    heading: "Initialization & Options",
    path: "/docs/guide/usage",
    type: "Guide",
    section: "Guide",
    description: "Instantiating Supermouse, configuring smoothing, and registering plugins.",
    keywords: "quickstart init new Supermouse plugins config options damping speed",
    content: "Create an instance by passing an array of plugins: new Supermouse({ plugins: [dot(), magnetic()] })."
  },
  {
    id: "guide-cookbook",
    label: "Cookbook",
    heading: "Recipes & Patterns",
    path: "/docs/guide/cookbook",
    type: "Guide",
    section: "Guide",
    description: "Practical cursor combinations, interactive hover triggers, and canvas particle trails.",
    keywords: "cookbook recipes samples patterns ghost trail vehicle magnetic button sparkles",
    content: "Curated real-world recipes combining multiple plugins for custom interactive effects."
  },
  {
    id: "guide-troubleshooting",
    label: "Troubleshooting",
    heading: "Common Issues & Solutions",
    path: "/docs/guide/troubleshooting",
    type: "Guide",
    section: "Guide",
    description: "Debugging cursor lag, z-index layering, mobile touch disabling, and framework hydration.",
    keywords: "fix bug error glitch problem lag z-index touch mobile doctor debug",
    content: "Solutions for common issues including pointer events conflicts, high-DPI canvas scaling, and touch device optimization."
  },
  {
    id: "guide-toolchain",
    label: "Toolchain & Monorepo",
    heading: "Developer Tooling",
    path: "/docs/guide/toolchain",
    type: "Guide",
    section: "Guide",
    description: "Internal CLI commands, scaffolding, and multi-package build scripts.",
    keywords: "toolchain cli scripts build monorepo pnpm workspace pnpm run",
    content: "Supermouse monorepo scripts for building packages, running tests, and generating documentation."
  },

  // Integrations
  {
    id: "integration-vue",
    label: "Vue.js Integration",
    heading: "Vue 3 & Nuxt Composable",
    path: "/docs/integrations/vue",
    type: "Guide",
    section: "Integrations",
    description: "useSupermouse composable and SupermouseProvider component for Vue 3 and Nuxt.",
    keywords: "vue nuxt composable useSupermouse reactive client-only component",
    content: "Native Vue 3 composables managing cursor lifecycle with automatic cleanup on component unmount."
  },
  {
    id: "integration-react",
    label: "React Integration",
    heading: "React & Next.js Hook",
    path: "/docs/integrations/react",
    type: "Guide",
    section: "Integrations",
    description: "useSupermouse hook and SupermouseProvider wrapper for React and Next.js.",
    keywords: "react nextjs hook useSupermouse useEffect component provider",
    content: "Idiomatic React hook handling SSR hydration boundaries and DOM refs seamlessly."
  },

  // Architecture
  {
    id: "arch-core",
    label: "Core Architecture",
    heading: "Input to Render Pipeline",
    path: "/docs/advanced/architecture",
    type: "Architecture",
    section: "Advanced",
    description: "How Supermouse handles raw pointer input, physics interpolation, and plugin rendering.",
    keywords: "architecture physics loop lerp delta math pipeline stage isolation",
    content: "The core loop runs on requestAnimationFrame, calculating interpolated smooth coordinates using spring physics and delivering updates to plugins."
  },
  {
    id: "arch-authoring",
    label: "Plugin Authoring",
    heading: "Creating Custom Plugins",
    path: "/docs/advanced/authoring",
    type: "Architecture",
    section: "Advanced",
    description: "Complete guide to writing high-performance canvas, SVG, or DOM plugins.",
    keywords: "plugin authoring create custom plugin interface lifecycle hooks onMove onRender",
    content: "Implement the SupermousePlugin interface with lifecycle hooks: init, onMove, onRender, and destroy."
  },
  {
    id: "arch-contributing",
    label: "Contributing",
    heading: "Development Workflow",
    path: "/docs/advanced/contributing",
    type: "Architecture",
    section: "Advanced",
    description: "Guide for contributing plugins, core features, or bug fixes to Supermouse.",
    keywords: "contributing github pull request dev testing vitest eslint guidelines",
    content: "Setup instructions, branch naming conventions, testing requirements, and pull request checklist."
  },

  // API Reference Sections & Symbols
  {
    id: "api-core-class",
    label: "Supermouse Class",
    heading: "Core Class Constructor",
    path: "/docs/reference/api#core-class",
    type: "API",
    section: "Reference",
    description: "The primary Supermouse class responsible for stage management and the physics loop.",
    keywords: "class Supermouse constructor init start stop pause",
    content: "export class Supermouse { constructor(options?: SupermouseOptions) }"
  },
  {
    id: "api-options-damping",
    label: "Options: damping",
    heading: "SupermouseOptions.damping",
    path: "/docs/reference/api#options",
    type: "API",
    section: "Reference",
    description: "Physics smoothing factor between 0 (instant, no smoothing) and 1 (extreme lag).",
    keywords: "damping smoothness lag easing lerp physics options config",
    content: "damping: number (default: 0.15) — controls the exponential decay of pointer interpolation."
  },
  {
    id: "api-options-container",
    label: "Options: container",
    heading: "SupermouseOptions.container",
    path: "/docs/reference/api#options",
    type: "API",
    section: "Reference",
    description: "DOM element bounding the cursor lifecycle and rendering stage.",
    keywords: "container element dom boundary target window body element",
    content: "container: HTMLElement | string (default: document.body) — bounds cursor activity to a specific element."
  },
  {
    id: "api-state-pointer",
    label: "State: pointer",
    heading: "MouseState.pointer",
    path: "/docs/reference/api#state",
    type: "API",
    section: "Reference",
    description: "Raw un-smoothed pointer coordinates (x, y), client coordinates, and delta.",
    keywords: "state pointer raw coordinates x y clientX clientY delta",
    content: "state.pointer: { x: number, y: number, vx: number, vy: number } — raw pointer input values."
  },
  {
    id: "api-state-smooth",
    label: "State: smooth",
    heading: "MouseState.smooth",
    path: "/docs/reference/api#state",
    type: "API",
    section: "Reference",
    description: "Interpolated physics coordinates (x, y) after damping calculations.",
    keywords: "state smooth physics coordinates x y lerped position",
    content: "state.smooth: { x: number, y: number, vx: number, vy: number } — smoothed cursor values."
  },
  {
    id: "api-methods-destroy",
    label: "Methods: destroy()",
    heading: "Supermouse.destroy()",
    path: "/docs/reference/api#methods",
    type: "API",
    section: "Reference",
    description: "Tears down event listeners, removes DOM elements, and stops requestAnimationFrame.",
    keywords: "destroy clean unmount remove dispose stop cleanup",
    content: "destroy(): void — completely removes the cursor and all registered plugins from the DOM."
  },
  {
    id: "api-methods-update",
    label: "Methods: update()",
    heading: "Supermouse.update()",
    path: "/docs/reference/api#methods",
    type: "API",
    section: "Reference",
    description: "Dynamically updates global options or individual plugin parameters at runtime.",
    keywords: "update set options config dynamic change reconfigure",
    content: "update(options: Partial<SupermouseOptions>): void — reconfigures active parameters."
  },
  {
    id: "api-plugin-interface",
    label: "Plugin Interface",
    heading: "SupermousePlugin Definition",
    path: "/docs/reference/api#plugin-interface",
    type: "API",
    section: "Reference",
    description: "TypeScript interface defining plugin lifecycle, name, priority, and rendering hooks.",
    keywords: "plugin interface hooks init onMove onRender destroy priority",
    content: "interface SupermousePlugin { name: string; priority?: number; init(ctx): void; onRender(state, ctx): void; }"
  },

  // All 13 Plugins
  ...PLUGINS.map((p): SearchDocument => ({
    id: `plugin-${p.id}`,
    label: `${p.name} Plugin`,
    heading: p.package,
    path: `/docs/plugins/${p.id}`,
    type: "Plugin",
    section: "Plugins",
    description: p.description || `${p.name} cursor plugin for Supermouse`,
    keywords: `${p.id} ${p.name} ${p.package} plugin cursor visual effect`,
    content: `${p.name} plugin provides ${p.description || "custom cursor rendering"}. Install via ${p.package}.`
  }))
];

// Initialize MiniSearch index
const miniSearch = new MiniSearch<SearchDocument>({
  fields: ["label", "heading", "description", "keywords", "content"],
  storeFields: ["id", "label", "heading", "path", "type", "section", "description"],
  searchOptions: {
    boost: {
      label: 4,
      heading: 3,
      keywords: 2.5,
      description: 1.8,
      content: 1
    },
    prefix: true,
    fuzzy: 0.2
  }
});

miniSearch.addAll(SEARCH_DOCUMENTS);

export function useSearch() {
  const query = ref("");

  const results = computed<SearchResult[]>(() => {
    const q = query.value.trim();
    if (!q) {
      return QUICK_PICKS;
    }

    const searchResults = miniSearch.search(q, {
      combineWith: "OR"
    });

    if (searchResults.length === 0) {
      return [];
    }

    return searchResults.slice(0, 10).map((r) => ({
      id: r.id,
      label: r.label,
      heading: r.heading,
      path: r.path,
      type: r.type as SearchResult["type"],
      section: r.section,
      description: r.description
    }));
  });

  return {
    query,
    results
  };
}
