import type { RouterConfig } from "nuxt/schema";
import { scrollToAnchor, scrollToTop, scrollToY, requestScrollReset } from "@utils/scroll";

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      scrollToY(savedPosition.top);
      return false;
    }

    if (to.hash) {
      const id = decodeURIComponent(to.hash.slice(1));
      return scrollToAnchor(id).then((found) => {
        if (!found) scrollToTop();
      });
    }

    requestScrollReset();
    return false;
  }
};
