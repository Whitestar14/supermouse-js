/**
 * Sitemap for the static host. The route list is injected at build time
 * from nuxt.config (static routes + generated plugin routes).
 */

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const host = String(config.public.siteUrl || "https://supermouse.js.org").replace(/\/$/, "");
  const routes = (config.public.sitemapRoutes as unknown as string[]) || [];

  const urls = routes
    .map((route) => {
      const loc = `${host}${route === "/" ? "" : route}`;
      const priority = route === "/" ? "1.0" : route === "/404" ? "0.1" : "0.8";
      return [
        "  <url>",
        `    <loc>${loc}</loc>`,
        `    <changefreq>weekly</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>"
      ].join("\n");
    })
    .join("\n");

  setHeader(event, "Content-Type", "application/xml");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
});
