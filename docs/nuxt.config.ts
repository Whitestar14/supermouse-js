import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import tailwindcss from "@tailwindcss/vite";
import type { NuxtConfig } from "nuxt/config";
import { SITE_URL, STATIC_SITEMAP_ROUTES, ROBOTS_DISALLOW } from "./app/config/seo";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin routes for prerender + sitemap (replaces vite-plugin-sitemap dynamicRoutes)
const pluginsData: Array<{ id: string }> = JSON.parse(
  readFileSync(path.resolve(__dirname, "app/data/generated-plugins.json"), "utf-8")
);
const pluginRoutes = pluginsData.map((p) => `/docs/plugins/${p.id}`);

const sitemapRoutes = [...STATIC_SITEMAP_ROUTES, ...pluginRoutes];

// Workspace packages are aliased straight to their TS sources (as in vite.config.ts)
const supermouseAliases = Object.fromEntries(
  [
    "react",
    "utils",
    "trail",
    "labs",
    "zoetrope",
    "core",
    "dot",
    "ring",
    "text",
    "image",
    "magnetic",
    "pointer",
    "icon",
    "states",
    "stick",
    "vue"
  ].map((pkg) => [`@supermousejs/${pkg}`, path.resolve(__dirname, `../packages/${pkg}/src/index.ts`)])
);

export default defineNuxtConfig({
  compatibilityDate: "2026-09-08",
  ssr: true,

  modules: ["@nuxt/content"],

  css: ["~/assets/css/index.css"],

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      title: "Supermouse | Modular Cursor System",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1.0" },
        {
          name: "description",
          content:
            "A modular, high-performance cursor engine for building dynamic, beautiful cursors for the web"
        },
        { property: "og:image", content: `${SITE_URL}/social-banner.png` },
        { property: "og:type", content: "website" },
        { name: "google-site-verification", content: "uZ6MsSjY_clcMoUs6D2HywTCmrdyZW0UUNGsP-EO8YY" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: `${SITE_URL}/social-banner.png` }
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "shortcut icon", href: "/favicon.svg", type: "image/x-icon" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
        }
      ]
    }
  },

  // Static prerendering & Vercel deployment: prerender all routes, flat 404.html.
  nitro: {
    prerender: {
      routes: [...sitemapRoutes, "/404.html"],
      crawlLinks: true,
      failOnError: false
    }
  },

  // Read by the sitemap.xml / robots.txt server routes (see app/server/routes)
  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
      sitemapRoutes,
      robotsDisallow: ROBOTS_DISALLOW
    }
  },

  alias: {
    ...supermouseAliases,
    "@": path.resolve(__dirname, "app"),
    "~": path.resolve(__dirname, "app"),
    "@config": path.resolve(__dirname, "app/config"),
    "@data": path.resolve(__dirname, "app/data"),
    "@components": path.resolve(__dirname, "app/components"),
    "@composables": path.resolve(__dirname, "app/composables"),
    "@playground": path.resolve(__dirname, "app/components/playground"),
    "@shared": path.resolve(__dirname, "app/components/shared"),
    "@utils": path.resolve(__dirname, "app/utils")
  },

  vite: {
    plugins: [tailwindcss()],
    define: {
      __SUPERMOUSE_VERSION__: JSON.stringify(
        JSON.parse(readFileSync(path.resolve(__dirname, "../packages/core/package.json"), "utf-8"))
          .version
      )
    }
  },
}) satisfies NuxtConfig;
