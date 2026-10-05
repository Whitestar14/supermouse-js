import type { RouterConfig } from "nuxt/schema";
import { requestAnchor, requestTop, scrollToY } from "@utils/scroll";

export default <RouterConfig>{
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      scrollToY(savedPosition.top);
      return false;
    }

    // The target does not exist yet, so record the intent and let
    // `anchor-scroll.client.ts` carry it out once the page has rendered.
    if (to.hash) requestAnchor(decodeURIComponent(to.hash.slice(1)));
    else requestTop();

    return false;
  }
};
