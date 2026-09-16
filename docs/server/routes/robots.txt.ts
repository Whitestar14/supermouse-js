/**
 * robots.txt for the static host. Disallow list is injected at build time
 * from nuxt.config (mirrors the old vite-plugin-sitemap robots config).
 */

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const host = String(config.public.siteUrl || "https://supermouse.js.org").replace(/\/$/, "");
  const disallow = (config.public.robotsDisallow as string[]) || ["/404", "/labs"];

  const lines = [
    "User-agent: *",
    "Allow: /",
    ...disallow.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${host}/sitemap.xml`
  ];

  setHeader(event, "Content-Type", "text/plain");
  return `${lines.join("\n")}\n`;
});
