import { ViteSSG } from "vite-ssg";
import { routes } from "./config/router";
import App from "./App.vue";
import "./style/index.css";

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL
  },
  ({ router }) => {
    if (!import.meta.env.SSR) {
      router.isReady().then(() => {
        document.documentElement.classList.remove("route-pending");
      });
    }
  }
);
