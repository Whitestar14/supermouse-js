import type { RouterConfig } from "nuxt/schema";
import { scrollToAnchor, scrollToTop, scrollToY, requestScrollReset } from "@utils/scroll";

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      scrollToY(savedPosition.top, "auto");
      return false;
    }

    if (to.hash) {
      const id = decodeURIComponent(to.hash.slice(1));
      return scrollToAnchor(id, "smooth").then((found) => {
        if (!found) scrollToTop("auto");
      });
    }

    requestScrollReset();
    return false;
  }
};
