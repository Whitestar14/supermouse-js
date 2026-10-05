import { applyPendingNavigation } from "@utils/scroll";

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook("page:finish", () => {
    void nextTick(() => {
      requestAnimationFrame(() => applyPendingNavigation());
    });
  });
});
