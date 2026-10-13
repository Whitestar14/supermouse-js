/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

/** Replaced at build time by `vite.config.ts` with the core package version. */
declare const __SUPERMOUSE_VERSION__: string;
