import type { RouterConfig } from "nuxt/schema";

// Replicates the scrollBehavior from the old docs/src/config/router.ts
export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, top: 80, behavior: "smooth" };
    }
    return { top: 0 };
  }
};
