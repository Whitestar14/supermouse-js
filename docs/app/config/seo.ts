/**
 * SEO constants shared between nuxt.config.ts, the sitemap/robots server
 * routes and app code. Kept framework-free so nuxt.config can import it.
 */

export const SITE_URL = "https://supermouse.js.org";

/**
 * Routes that are neither markdown pages nor generated plugin pages.
 * Everything else is discovered from `content/**` and plugin metadata at
 * build time (see nuxt.config.ts), so this list stays tiny on purpose.
 */
export const STATIC_SITEMAP_ROUTES = ["/"];

/** Paths excluded from indexing. */
export const ROBOTS_DISALLOW = ["/404", "/404.html"];
