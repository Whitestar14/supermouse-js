import { defineConfig, UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Sitemap from "vite-plugin-sitemap";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import type { ViteSSGOptions } from "vite-ssg";

interface ViteConfig extends UserConfig {
  ssgOptions?: ViteSSGOptions;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginsData = JSON.parse(
  readFileSync(path.resolve(__dirname, "./src/data/generated-plugins.json"), "utf-8")
);
const pluginRoutes = pluginsData.map((p: any) => `/docs/plugins/${p.id}`);

const corePkgPath = path.resolve(__dirname, "../packages/core/package.json");
const corePkg = JSON.parse(readFileSync(corePkgPath, "utf-8"));

export default defineConfig({
  plugins: [
    vue(),
    Sitemap({
      hostname: "https://supermouse.js.org",
      generateRobotsTxt: true,
      robots: [
        {
          userAgent: "*",
          allow: "/",
          disallow: ["/404", "/labs"]
        }
      ],
      dynamicRoutes: [
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
        "/reference/api",
        ...pluginRoutes
      ]
    })
  ],
  ssgOptions: {
    script: "async",
    formatting: "minify",
    includedRoutes(paths: string[]) {
      return paths.flatMap((path) => {
        if (path.includes("pathMatch")) return [];

        if (path === "/docs/plugins/:id") {
          return pluginRoutes;
        }
        return path;
      });
    },
    onFinished() {}
  },
  define: {
    __SUPERMOUSE_VERSION__: JSON.stringify(corePkg.version),
    __VERSION__: JSON.stringify(corePkg.version)
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./src/components/shared"),
      "@landing": path.resolve(__dirname, "./src/components/landing"),
      "@playground": path.resolve(__dirname, "./src/components/playground"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@layouts": path.resolve(__dirname, "./src/layouts"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@data": path.resolve(__dirname, "./src/data"),
      "@composables": path.resolve(__dirname, "./src/composables"),

      "@supermousejs/react": path.resolve(__dirname, "../packages/react/src/index.ts"),
      "@supermousejs/utils": path.resolve(__dirname, "../packages/utils/src/index.ts"),
      "@supermousejs/trail": path.resolve(__dirname, "../packages/trail/src/index.ts"),
      "@supermousejs/labs": path.resolve(__dirname, "../packages/labs/src/index.ts"),
      "@supermousejs/zoetrope": path.resolve(__dirname, "../packages/zoetrope/src/index.ts"),

      "@supermousejs/core": path.resolve(__dirname, "../packages/core/src/index.ts"),
      "@supermousejs/dot": path.resolve(__dirname, "../packages/dot/src/index.ts"),
      "@supermousejs/ring": path.resolve(__dirname, "../packages/ring/src/index.ts"),
      "@supermousejs/text": path.resolve(__dirname, "../packages/text/src/index.ts"),
      "@supermousejs/image": path.resolve(__dirname, "../packages/image/src/index.ts"),

      "@supermousejs/magnetic": path.resolve(__dirname, "../packages/magnetic/src/index.ts"),
      "@supermousejs/pointer": path.resolve(__dirname, "../packages/pointer/src/index.ts"),
      "@supermousejs/icon": path.resolve(__dirname, "../packages/icon/src/index.ts"),
      "@supermousejs/states": path.resolve(__dirname, "../packages/states/src/index.ts"),
      "@supermousejs/stick": path.resolve(__dirname, "../packages/stick/src/index.ts"),
      "@supermousejs/vue": path.resolve(__dirname, "../packages/vue/src/index.ts")
    }
  }
} as ViteConfig);
