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
    })
  }
});
