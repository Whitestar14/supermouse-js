import { ViteSSG } from "vite-ssg";
import { routes } from "./config/router";
import App from "./App.vue";
import "./style/index.css";

export const createApp = ViteSSG(App, {
  routes,
  base: import.meta.env.BASE_URL
});
