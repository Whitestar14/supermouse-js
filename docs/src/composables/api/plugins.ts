import type { ApiItem } from "./types";

export const pluginHooks: ApiItem[] = [
  {
    id: "install",
    name: "install(app)",
    signature: "install(app: Supermouse): void",
    desc: "Called once when the plugin is registered. Create and mount DOM elements here.",
    usage: `install(app) {
  const el = dom.createCircle(8, 'white');
  app.container.appendChild(el);
  this.el = el;
}`
  },
  {
    id: "update",
    name: "update(app, dt)",
    signature: "update(app: Supermouse, dt: number): void",
    desc: "Called every frame. Apply transforms and read state here. dt is delta time in seconds.",
    usage: `update(app, dt) {
  const { x, y } = app.state.smooth;
  dom.setTransform(this.el, x, y);
}`
  },
  {
    id: "plugin-destroy",
    name: "destroy(app)",
    signature: "destroy(app: Supermouse): void",
    desc: "Called when the app is destroyed. Remove DOM nodes and release references.",
    usage: `destroy() {
  this.el?.remove();
  this.el = null;
}`
  },
  {
    id: "onenable",
    name: "onEnable(app)",
    signature: "onEnable(app: Supermouse): void",
    desc: "Called when a disabled plugin is re-enabled. Restore visibility and reset state.",
    usage: `onEnable() {
  dom.setStyle(this.el, 'opacity', '1');
}`
  },
  {
    id: "ondisable",
    name: "onDisable(app)",
    signature: "onDisable(app: Supermouse): void",
    desc: "Called when a plugin is disabled. Hide elements but keep them in the DOM for fast re-enable.",
    usage: `onDisable() {
  dom.setStyle(this.el, 'opacity', '0');
}`
  }
];
