import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import type { NuxtConfig } from "nuxt/config";
import { SITE_URL, STATIC_SITEMAP_ROUTES, ROBOTS_DISALLOW } from "./app/config/seo";
import { readDocsContent } from "./app/config/content-nav";
import { resolveRelease } from "./app/config/release";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const release = resolveRelease(repoRoot);

const { routes: contentRoutes, navigation: docsNavigation } = readDocsContent(
  path.resolve(__dirname, "content")
);

// Plugin ids come from `packages/*/meta.json`, compiled into a module by
// `scripts/build-data.js`. It is gitignored, so a fresh clone has to generate it
// — say so plainly rather than failing on a missing import.
const { GENERATED_PLUGINS } = await import("./app/data/generated-plugins").catch(() => {
  throw new Error(
    "docs/app/data/generated-plugins.ts is missing. Run `pnpm generate-docs` " +
      "from the repo root (or use `pnpm dev:docs`, which does it for you)."
  );
});
const pluginRoutes = GENERATED_PLUGINS.map((p) => `/docs/plugins/${p.id}`);

const sitemapRoutes = Array.from(
  new Set([...STATIC_SITEMAP_ROUTES, ...contentRoutes, ...pluginRoutes])
).sort();

const supermouseAliases = Object.fromEntries(
  [
    "react",
    "utils",
    "trail",
    "labs",
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
  ].map((pkg) => [
    `@supermousejs/${pkg}`,
    path.resolve(__dirname, `../packages/${pkg}/src/index.ts`)
  ])
);

export default defineNuxtConfig({
  compatibilityDate: "2026-09-08",
  ssr: false,

  modules: [
    "@nuxt/content",
    /**
     * `@nuxt/content` asks Vite to pre-bundle `@nuxtjs/mdc`'s own dependencies
     * (`@nuxtjs/mdc > remark-gfm` and friends). Under pnpm's isolated layout
     * `@nuxtjs/mdc` is not resolvable from this workspace root, so Vite cannot
     * expand those entries and Nuxt logs NUXT_B7002 on every boot. They are a
     * pre-bundling hint only, so the unresolvable ones are dropped here, after
     * the content module has had its say.
     */
    (_options: unknown, nuxt: any) => {
      const dropMdcDeps = (list: unknown): unknown => {
        if (!Array.isArray(list)) return list;
        return list.filter(
          (entry) => typeof entry !== "string" || !entry.startsWith("@nuxtjs/mdc >")
        );
      };

      // @nuxt/content adds these to Nuxt's options during module setup…
      nuxt.options.vite ??= {};
      nuxt.options.vite.optimizeDeps ??= {};
      nuxt.options.vite.optimizeDeps.include = dropMdcDeps(nuxt.options.vite.optimizeDeps.include);

      // …and may re-add them from a `vite:extendConfig` hook, so strip them from
      // the final Vite config too. That is the array Nuxt resolves (and warns on).
      nuxt.hook("vite:extendConfig", (config: any) => {
        if (!config?.optimizeDeps) return;
        config.optimizeDeps.include = dropMdcDeps(config.optimizeDeps.include);
      });
    }
  ],

  components: [
    {
      path: "~/components",
      pathPrefix: false,
      global: true
    }
  ],

  content: {
    build: {
      markdown: {
        highlight: false
      }
    }
  },

  css: ["~/assets/css/index.css"],

  vite: {
    plugins: [tailwindcss()],

    define: {
      __SUPERMOUSE_VERSION__: JSON.stringify(release.version),
      __SUPERMOUSE_RELEASE_AT__: JSON.stringify(release.releasedAt)
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: "en" },
      script: [
        {
          innerHTML:
            "(function(){try{var t=localStorage.getItem('supermouse-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();"
        }
      ],
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
        {
          name: "google-site-verification",
          content: "uZ6MsSjY_clcMoUs6D2HywTCmrdyZW0UUNGsP-EO8YY"
        },
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

  devtools: { enabled: false },

  nitro: {
    prerender: {
      routes: [...sitemapRoutes, "/404.html", "/search-index.json", "/sitemap.xml", "/robots.txt"],
      crawlLinks: false,
      concurrency: 4,
      failOnError: false
    }
  },

  // Read by the sitemap.xml / robots.txt server routes (see app/server/routes)
  // and by the docs sidebar/search, which both derive from content frontmatter.
  runtimeConfig: {
    public: {
      siteUrl: SITE_URL,
      sitemapRoutes,
      robotsDisallow: ROBOTS_DISALLOW,
      docsNavigation
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
    "@utils": path.resolve(__dirname, "app/utils")
  }
}) satisfies NuxtConfig;
