/**
 * SEO constants shared between nuxt.config.ts, the sitemap/robots server
 * routes and app code. Kept framework-free so nuxt.config can import it.
 */

export const SITE_URL = "https://supermouse.js.org";

/** Static routes included in the sitemap. Plugin routes are appended at build time. */
export const STATIC_SITEMAP_ROUTES = [
  "/",
  "/docs/guide/introduction",
  "/docs/guide/installation",
  "/docs/guide/usage",
  "/docs/guide/troubleshooting",
  "/docs/guide/cookbook",
  "/docs/integrations/vue",
  "/docs/integrations/react",
  "/docs/advanced/architecture",
  "/docs/advanced/authoring",
  "/docs/advanced/contributing",
  "/docs/advanced/tips-and-tricks",
  "/docs/reference/api"
];

/** Paths excluded from indexing (mirrors the old vite-plugin-sitemap robots config). */
export const ROBOTS_DISALLOW = ["/404", "/404.html", "/labs"];
