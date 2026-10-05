import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: "page",
      source: "docs/**/*.md",
      schema: z.object({
        title: z.string(),
        description: z.string().optional(),
        section: z.string().optional(),
        order: z.number().optional(),
        version: z.string().optional(),
        coreSize: z.string().optional(),
        license: z.string().optional(),
        badge: z.string().optional(),
        icon: z.string().optional()
      })
    }),

    /**
     * Authored documentation for individual plugins, keyed to the plugin id
     * (`plugins/dot.md` -> `/plugins/dot`).
     *
     * `packages/<pkg>/meta.json` remains the source of truth for structured
     * metadata — name, version, install command, and the options table — while
     * this collection carries the *narrative*: usage, patterns, caveats, and
     * live demos. The plugin page renders this body when it exists and falls
     * back to the generated layout when it doesn't.
     */
    plugins: defineCollection({
      type: "page",
      source: "plugins/**/*.md",
      schema: z.object({
        title: z.string().optional(),
        description: z.string().optional()
      })
    })
  }
});
