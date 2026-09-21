declare const __VERSION__: string | undefined;
const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0";

import type {
  MouseState,
  SupermouseOptions,
  SupermousePlugin,
  CursorMode,
  ScopeConfig
} from "./types";
import { Scope } from "./internal/Scope";
import { OFFSCREEN, DEFAULT_HOVER_SELECTORS } from "./constants";
import { Input } from "./internal/Input";
import { createStyleOwner, setRules, destroyStylesheet } from "./internal/Stylesheet";
import { DEFAULT_CURSOR_POLICY, normalizePolicy } from "./policy";

function lerp(a: number, b: number, factor: number): number {
  return a + (b - a) * factor;
}

/**
 * Framerate-independent exponential smoothing by Freya Holmér.
 * @param lambda  Response rate.
 * @param dt Delta time in seconds.
 *
 * https://www.youtube.com/watch?v=LSNQuFEDOyQ
 */
function damp(a: number, b: number, lambda: number, dt: number): number {
  return lerp(a, b, 1 - Math.exp(-lambda * dt));
}

export interface ScopeHandle {
  readonly name: string | undefined;
  /**
   * The scope's container element, or `null` if the scope is
   * selector-based and has not yet been resolved to a live element.
   */
  readonly container: HTMLElement | null;
  readonly active: boolean;
  /** True for eager scopes and for selector scopes that have resolved. */
  readonly resolved: boolean;

  destroy(): void;
  setCursor(mode: CursorMode): void;
  /**
   * Marks the scope as eligible for activation.
   *
   * Activation is lazy: the scope becomes active on the next `mouseover`
   * inside its container, not immediately. If you need to force the scope
   * active while the pointer is already inside it, this will not work
   * until the pointer moves. Deactivation, by contrast, is eager.
   */
  activate(): void;
  /**
   * Marks the scope as ineligible. If it was the active scope, control
   * yields immediately to the nearest active ancestor scope, or to
   * nothing if none exists.
   */
  deactivate(): void;

  use(plugin: SupermousePlugin): ScopeHandle;
  removePlugin(name: string): void;
  getPlugin(name: string): SupermousePlugin | undefined;
}

type ResolvedOptions = SupermouseOptions &
  Required<
    Pick<
      SupermouseOptions,
      | "smoothness"
      | "enableTouch"
      | "autoDisableOnMobile"
      | "cursor"
      | "hideOnLeave"
      | "autoStart"
      | "container"
      | "dataPrefix"
      | "zIndex"
      | "inheritDataAttributes"
    >
  >;

export class Supermouse {
  public static readonly version: string = VERSION;
  public readonly version: string = VERSION;

  state: MouseState;
  options: ResolvedOptions;

  private _scopes: Scope[] = [];
  /** Scopes whose `container` config was a selector string, awaiting resolution. */
  private _selectorScopes: Scope[] = [];
  private _activeScope: Scope | null = null;
  private _installingScope: Scope | null = null;
  /**
   * Map from container element to the scope currently bound to it. Eager
   * scopes are inserted at construction; selector scopes are inserted on
   * resolution, and rebound when a container unmounts and a fresh match
   * appears.
   */
  private scopeByContainer = new Map<HTMLElement, Scope>();
  private scopeByName = new Map<string, Scope>();
  private scopeHandles = new Map<Scope, ScopeHandle>();

  private input: Input;
  private styleOwner: number;

  private rafId = 0;
  private lastTime = 0;
  private visibilityAbortController = new AbortController();
  private crashedPlugins: SupermousePlugin[] = [];

  constructor(options: SupermouseOptions = {}) {
    this.options = {
      smoothness: 0.15,
      enableTouch: false,
      autoDisableOnMobile: true,
      cursor: "auto",
      hideOnLeave: true,
      autoStart: true,
      container: document.body,
      dataPrefix: "supermouse",
      zIndex: 9999,
      inheritDataAttributes: true,
      ...options
    } as ResolvedOptions;

    this.styleOwner = createStyleOwner();

    this.state = {
      pointer: { ...OFFSCREEN },
      target: { ...OFFSCREEN },
      smooth: { ...OFFSCREEN },
      velocity: { x: 0, y: 0 },
      displacement: { x: 0, y: 0 },
      angle: 0,
      isDown: false,
      isHover: false,
      isNative: false,
      cursorMode: this.options.cursor,
      hoverTarget: null,
      reducedMotion: false,
      hasReceivedInput: false,
      shape: null,
      interaction: {},
      scope: null
    };

    const primary = this.createScope({
      container: this.options.container,
      cursor: this.options.cursor,
      hoverSelectors: this.options.hoverSelectors,
      cursorPolicy: this.options.cursorPolicy,
      plugins: this.options.plugins,
      rules: this.options.rules,
      zIndex: this.options.zIndex
    });

    this.input = new Input(
      this.state,
      this.options,
      (enabled) => {
        if (!enabled) this.reset();
      },
      (scope) => this.handleActiveScopeChange(scope),
      (node) => this.resolveScopeForNode(node)
    );

    this.input.setActiveScope(primary);

    this.installPlugins(primary);

    if (this.options.scopes) {
      for (const cfg of this.options.scopes) this.addScope(cfg);
    }

    this.rebuildStylesheet();
    this.bindVisibilityHandling();
    if (this.options.autoStart) this.startLoop();
  }

  // ─── Public API ───

  public get container(): HTMLElement {
    return (this._activeScope ?? this._scopes[0]).container;
  }

  public get stage(): HTMLDivElement {
    const scope = this._installingScope ?? this._activeScope ?? this._scopes[0];
    return scope.stage.element;
  }

  public get isEnabled(): boolean {
    return this.input.isEnabled;
  }

  public get isRunning(): boolean {
    return this._running;
  }

  /**
   * Installs a plugin into the primary scope.
   *
   * In multi-scope mode, prefer `handle.use(plugin)` to target a specific
   * scope. This method always installs to the primary scope, regardless of
   * which scope is currently active.
   */
  public use(plugin: SupermousePlugin): this {
    this.installPlugin(this._scopes[0], plugin);
    return this;
  }

  /**
   * Searches every scope and returns the first plugin matching `name`.
   * Scopes are searched in registration order (primary first).
   */
  public getPlugin(name: string): SupermousePlugin | undefined {
    for (const scope of this._scopes) {
      const found = scope.plugins.find((p) => p.name === name);
      if (found) return found;
    }
    return undefined;
  }

  public getScope(name: string): ScopeHandle | undefined {
    const scope = this.scopeByName.get(name);
    return scope ? this.scopeHandles.get(scope) : undefined;
  }

  /**
   * Enables a plugin by name, wherever it lives.
   *
   * If the plugin's scope is not currently active, its `isEnabled` flag is
   * set but lifecycle hooks do not fire until the scope becomes active.
   */
  public enablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (!plugin || plugin.isEnabled !== false) return;

    plugin.isEnabled = true;

    const scope = this._activeScope;
    if (scope && scope.active && scope.plugins.includes(plugin)) {
      this.scopeActivatePlugin(plugin);
    }
  }

  /**
   * Disables a plugin by name, wherever it lives.
   *
   * Unlike `handle.deactivate()`, this permanently changes the plugin's
   * user-facing enabled state. The plugin will not activate even when its
   * owning scope becomes active again.
   */
  public disablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (plugin && plugin.isEnabled !== false) this.deactivatePlugin(plugin);
  }

  public togglePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (!plugin) return;
    if (plugin.isEnabled === false) this.enablePlugin(name);
    else this.disablePlugin(name);
  }

  /**
   * Sets the cursor mode on the *active* scope.
   *
   * To set the mode on a specific scope, use `handle.setCursor(mode)`.
   */
  public setCursor(mode: CursorMode): void {
    if (!this._activeScope) return;
    this._activeScope.cursorMode = mode;
    this.state.cursorMode = mode;
  }

  public addScope(config: ScopeConfig): ScopeHandle {
    const scope = this.createScope(config);
    this.installPlugins(scope);
    this.rebuildStylesheet();
    return this.scopeHandles.get(scope)!;
  }

  public enable(): void {
    this.input.isEnabled = true;

    if (this.input.hasSeenPointer) {
      this.state.target.x = this.state.smooth.x = this.state.pointer.x;
      this.state.target.y = this.state.smooth.y = this.state.pointer.y;
      this.resetMotion();
      this.state.hasReceivedInput = true;
    }

    if (this._activeScope) {
      this._activeScope.stage.setNativeCursor(this.resolveCursorState());
    }
  }

  public disable(opts?: { reset?: boolean }): void {
    this.input.isEnabled = false;

    if (this._activeScope) {
      this._activeScope.stage.setNativeCursor("auto");
      this._activeScope.stage.setVisibility(false);
    }

    if (opts?.reset) this.reset();
  }

  public reset(): void {
    this.state.target = { ...OFFSCREEN };
    this.state.smooth = { ...OFFSCREEN };
    this.resetMotion();
    this.state.angle = 0;
    this.state.hasReceivedInput = false;
    this.state.shape = null;
    this.state.interaction = {};
  }

  public start(): void {
    this.startLoop();
  }

  public step(time: number): void {
    this.update(time);
  }

  public destroy(): void {
    this._running = false;
    cancelAnimationFrame(this.rafId);
    this.visibilityAbortController.abort();
    this.input.destroy();

    for (const scope of this._scopes) {
      for (const plugin of scope.plugins) {
        try {
          plugin.destroy?.(this);
        } catch (e) {
          console.error(e);
        }
      }
      scope.stage.destroy();
    }

    this._scopes = [];
    this._selectorScopes = [];
    this.scopeByContainer.clear();
    this.scopeByName.clear();
    this.scopeHandles.clear();
    this._activeScope = null;
    this.state.scope = null;
    destroyStylesheet(this.styleOwner);
  }

  // ─── Internal ───

  private _running = false;

  private createScope(config: ScopeConfig): Scope {
    const isSelectorScope = typeof config.container === "string";

    if (!isSelectorScope) {
      const el = config.container as HTMLElement;
      if (this.scopeByContainer.has(el)) {
        console.warn(
          `[Supermouse] A scope is already registered for this container. ` +
            `The previous scope will no longer activate.`
        );
      }
    }

    const scope = new Scope(config, {
      cursor: this.options.cursor,
      hoverSelectors: this.options.hoverSelectors ?? DEFAULT_HOVER_SELECTORS,
      cursorPolicy: this.options.cursorPolicy
        ? normalizePolicy(this.options.cursorPolicy)
        : DEFAULT_CURSOR_POLICY,
      zIndex: this.options.zIndex,
      inheritDataAttributes: this.options.inheritDataAttributes,
      ruleEntries: this.options.rules ? Object.entries(this.options.rules) : []
    });

    this._scopes.push(scope);
    if (isSelectorScope) {
      this._selectorScopes.push(scope);
    } else {
      this.scopeByContainer.set(scope.container, scope);
    }
    if (scope.name) this.scopeByName.set(scope.name, scope);
    this.scopeHandles.set(scope, this.buildScopeHandle(scope));
    return scope;
  }

  private buildScopeHandle(scope: Scope): ScopeHandle {
    const handle: ScopeHandle = {
      get name() {
        return scope.name;
      },
      get container() {
        return scope.resolved ? scope.container : null;
      },
      get active() {
        return scope.active;
      },
      get resolved() {
        return scope.resolved;
      },
      destroy: () => this.destroyScope(scope),
      setCursor: (mode) => this.setScopeCursor(scope, mode),
      deactivate: () => this.deactivateScope(scope),
      activate: () => this.activateScope(scope),
      use: (plugin) => {
        this.installPlugin(scope, plugin);
        return handle;
      },
      removePlugin: (name) => this.removePluginFromScope(scope, name),
      getPlugin: (name) => scope.plugins.find((p) => p.name === name)
    };
    return handle;
  }

  private destroyScope(scope: Scope): void {
    const i = this._scopes.indexOf(scope);
    if (i === -1) return;

    for (const plugin of scope.plugins) {
      try {
        plugin.destroy?.(this);
      } catch (e) {
        console.error(e);
      }
    }
    scope.plugins.length = 0;

    this.scopeByContainer.delete(scope.container);
    scope.stage.destroy();

    this._scopes.splice(i, 1);
    const si = this._selectorScopes.indexOf(scope);
    if (si !== -1) this._selectorScopes.splice(si, 1);
    if (scope.name) this.scopeByName.delete(scope.name);
    this.scopeHandles.delete(scope);

    if (this._activeScope === scope) {
      const next =
        this.findScopeAbove(scope.container.parentElement) ??
        this._scopes.find((s) => s.active) ??
        null;
      this.input.setActiveScope(next);
    }

    this.rebuildStylesheet();
  }

  private setScopeCursor(scope: Scope, mode: CursorMode): void {
    scope.cursorMode = mode;
    if (scope === this._activeScope) this.state.cursorMode = mode;
  }

  /**
   * Marks the scope ineligible for activation and, if it was active, yields
   * immediately to the nearest active ancestor scope (or nothing).
   */
  private deactivateScope(scope: Scope): void {
    if (!scope.active) return;
    scope.active = false;

    if (this._activeScope === scope) {
      const next =
        this.findScopeAbove(scope.container.parentElement) ??
        this._scopes.find((s) => s.active) ??
        null;
      this.input.setActiveScope(next);
    }
  }

  /**
   * Marks the scope eligible for activation.
   *
   * This is lazy: the scope only becomes active once the pointer triggers
   * a `mouseover` inside its container. If the pointer is already inside
   * the container when this is called, the scope stays inactive until the
   * next mouse movement across a container boundary.
   */
  private activateScope(scope: Scope): void {
    scope.active = true;
  }

  private findScopeAbove(start: HTMLElement | null): Scope | null {
    let cur = start;
    while (cur) {
      const s = this.scopeByContainer.get(cur);
      if (s && s.active) return s;
      cur = cur.parentElement;
    }
    return null;
  }

  /**
   * Called by `Input` on every `mouseover`. Walks from the event target up
   * the ancestor chain, returning the innermost active scope whose container
   * contains the target.
   *
   * Eager scopes are found via `scopeByContainer`. Selector scopes are
   * matched via `Element.matches` against each ancestor, and bound to the
   * first match. If a previously-bound container was detached, the stale
   * binding is dropped and the selector loop can re-resolve to a fresh
   * match.
   */
  private resolveScopeForNode(node: Node): Scope | null {
    let cur = node as HTMLElement | null;

    while (cur) {
      const bound = this.scopeByContainer.get(cur);
      if (bound) {
        if (bound.active && cur.isConnected) return bound;
        this.scopeByContainer.delete(cur);
      }

      for (let i = 0; i < this._selectorScopes.length; i++) {
        const scope = this._selectorScopes[i];
        if (!scope.active) continue;

        let matches = false;
        try {
          matches = cur.matches(scope.containerSelector!);
        } catch {
          // Invalid selector; ignore.
          continue;
        }
        if (matches) {
          this.bindScopeToContainer(scope, cur);
          return scope;
        }
      }

      cur = cur.parentElement;
    }

    return null;
  }

  private bindScopeToContainer(scope: Scope, container: HTMLElement): void {
    const prev = scope.resolveContainer(container);
    if (prev && prev !== container) {
      this.scopeByContainer.delete(prev);
    }
    this.scopeByContainer.set(container, scope);
  }

  private installPlugins(scope: Scope): void {
    if (!scope.config.plugins) return;
    for (const plugin of scope.config.plugins) this.installPlugin(scope, plugin);
  }

  private installPlugin(scope: Scope, plugin: SupermousePlugin): void {
    if (scope.plugins.some((p) => p.name === plugin.name)) {
      console.warn(`[Supermouse] Plugin "${plugin.name}" already installed.`);
      return;
    }

    plugin.isEnabled ??= true;
    this._installingScope = scope;
    try {
      plugin.install?.(this);
    } catch (e) {
      console.error(`[Supermouse] Failed to install plugin '${plugin.name}'.`, e);
      this._installingScope = null;
      return;
    }
    this._installingScope = null;

    scope.plugins.push(plugin);
    scope.plugins.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

    if (scope !== this._activeScope || !scope.active) {
      if (plugin.element) plugin.element.style.display = "none";
    }
  }

  private removePluginFromScope(scope: Scope, name: string): void {
    const i = scope.plugins.findIndex((p) => p.name === name);
    if (i === -1) return;
    const plugin = scope.plugins[i];
    scope.plugins.splice(i, 1);

    const finish = (): void => {
      try {
        plugin.onDisable?.(this);
        plugin.destroy?.(this);
      } catch (e) {
        console.error(`[Supermouse] Plugin '${name}' cleanup threw:`, e);
      }
      plugin.element?.remove();
    };

    const result = plugin.onBeforeDisable?.(this);
    if (result && typeof result.then === "function") {
      void Promise.resolve(result)
        .then(finish)
        .catch((err) => {
          console.error(`[Supermouse] Plugin '${name}' onBeforeDisable threw:`, err);
          finish();
        });
    } else {
      finish();
    }
  }

  private handleActiveScopeChange(scope: Scope | null): void {
    const previous = this._activeScope;
    if (previous === scope) return;

    if (previous) {
      for (const plugin of previous.plugins) {
        if (plugin.isEnabled !== false) this.scopeDeactivatePlugin(plugin);
      }
    }

    this._activeScope = scope;

    if (scope) {
      this.state.cursorMode = scope.cursorMode;
      this.state.scope = { name: scope.name, container: scope.container };
      for (const plugin of scope.plugins) {
        if (plugin.isEnabled !== false) this.scopeActivatePlugin(plugin);
      }
    } else {
      this.state.scope = null;
    }
  }

  private deactivatePlugin(plugin: SupermousePlugin): void {
    if (plugin.isEnabled === false) return;
    plugin.isEnabled = false;

    const finish = (): void => {
      if (plugin.element) plugin.element.style.display = "none";
      plugin.onDisable?.(this);
    };

    const result = plugin.onBeforeDisable?.(this);
    if (result && typeof result.then === "function") {
      void Promise.resolve(result)
        .then(finish)
        .catch((err) => {
          console.error(`[Supermouse] Plugin '${plugin.name}' onBeforeDisable threw:`, err);
          finish();
        });
    } else {
      finish();
    }
  }

  /**
   * Runs the deactivation lifecycle for a plugin whose owning scope just
   * became inactive. Does NOT flip `plugin.isEnabled`, so user intent
   * (e.g. States disabling a plugin) survives the scope round-trip.
   */
  private scopeDeactivatePlugin(plugin: SupermousePlugin): void {
    const finish = (): void => {
      if (plugin.element) plugin.element.style.display = "none";
      plugin.onDisable?.(this);
    };

    const result = plugin.onBeforeDisable?.(this);
    if (result && typeof result.then === "function") {
      void Promise.resolve(result)
        .then(finish)
        .catch((err) => {
          console.error(`[Supermouse] Plugin '${plugin.name}' onBeforeDisable threw:`, err);
          finish();
        });
    } else {
      finish();
    }
  }

  private scopeActivatePlugin(plugin: SupermousePlugin): void {
    if (plugin.element) plugin.element.style.display = "";
    plugin.onEnable?.(this);
  }

  private rebuildStylesheet(): void {
    const rules: string[] = [];
    for (const scope of this._scopes) rules.push(...scope.buildRules());
    setRules(this.styleOwner, rules);
  }

  private runPluginSafe(plugin: SupermousePlugin, deltaTime: number): void {
    if (plugin.isEnabled === false) return;
    try {
      plugin.update?.(this, deltaTime);
    } catch (e) {
      console.error(`[Supermouse] Plugin '${plugin.name}' crashed and has been disabled.`, e);
      plugin.isEnabled = false;
      this.crashedPlugins.push(plugin);
    }
  }

  private cleanupCrashedPlugins(): void {
    if (this.crashedPlugins.length === 0) return;
    for (const plugin of this.crashedPlugins) {
      for (const scope of this._scopes) {
        const i = scope.plugins.indexOf(plugin);
        if (i !== -1) {
          scope.plugins.splice(i, 1);
          break;
        }
      }
      try {
        plugin.onDisable?.(this);
        plugin.destroy?.(this);
      } catch (err) {
        console.error(`[Supermouse] Failed to cleanup crashed plugin '${plugin.name}'.`, err);
      }
      plugin.element?.remove();
    }
    this.crashedPlugins = [];
  }

  private resolveStageVisibility(): boolean {
    if (this.state.cursorMode === "native") return false;
    if (this.state.cursorMode === "custom" || this.state.cursorMode === "both") {
      return this.input.isEnabled && this.state.hasReceivedInput;
    }
    return this.input.isEnabled && !this.state.isNative && this.state.hasReceivedInput;
  }

  private resolveCursorState(): "none" | "auto" {
    if (!this.input.isEnabled) return "auto";
    if (this.state.cursorMode === "native" || this.state.cursorMode === "both") return "auto";
    if (this.state.cursorMode === "custom") return "none";
    return this.state.isNative || !this.state.hasReceivedInput ? "auto" : "none";
  }

  private resetMotion(): void {
    this.state.velocity = { x: 0, y: 0 };
    this.state.displacement = { x: 0, y: 0 };
  }

  private update(time: number): void {
    const dtMs = time - this.lastTime;
    const dt = Math.min(dtMs / 1000, 0.1);
    this.lastTime = time;

    const currentTarget = this.input.getCurrentTarget();
    if (currentTarget && !currentTarget.isConnected) {
      this.input.clearHover();
    } else if (currentTarget) {
      this.input.parseDOMInteraction(currentTarget);
    }

    // Base target follows the pointer. Logic plugins (priority < 0) run
    // after this and may override it before physics damps smooth toward it.
    if (this.input.isEnabled && this.state.hasReceivedInput) {
      this.state.target.x = this.state.pointer.x;
      this.state.target.y = this.state.pointer.y;
    }

    const activeScope = this._activeScope;
    if (activeScope) {
      activeScope.stage.setVisibility(this.resolveStageVisibility());
      if (this.input.isEnabled) {
        activeScope.stage.setNativeCursor(this.resolveCursorState());
      }
      for (let i = 0; i < activeScope.plugins.length; i++) {
        this.runPluginSafe(activeScope.plugins[i], dtMs);
      }
    }

    this.cleanupCrashedPlugins();

    if (this.input.isEnabled) {
      const factor = this.state.reducedMotion ? 1000 : (1 / this.options.smoothness) * 2;
      const px = this.state.smooth.x;
      const py = this.state.smooth.y;

      this.state.smooth.x = damp(this.state.smooth.x, this.state.target.x, factor, dt);
      this.state.smooth.y = damp(this.state.smooth.y, this.state.target.y, factor, dt);

      this.state.displacement.x = this.state.target.x - this.state.smooth.x;
      this.state.displacement.y = this.state.target.y - this.state.smooth.y;

      if (dt > 0) {
        this.state.velocity.x = (this.state.smooth.x - px) / dt;
        this.state.velocity.y = (this.state.smooth.y - py) / dt;
      } else {
        this.state.velocity.x = 0;
        this.state.velocity.y = 0;
      }

      const { x: vx, y: vy } = this.state.velocity;
      if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
        this.state.angle = Math.atan2(vy, vx) * (180 / Math.PI);
      }
    }
  }

  private tick = (time: number): void => {
    this.update(time);
    if (this._running) this.rafId = requestAnimationFrame(this.tick);
  };

  private bindVisibilityHandling(): void {
    document.addEventListener(
      "visibilitychange",
      () => {
        if (!this._running) return;
        if (document.hidden) {
          cancelAnimationFrame(this.rafId);
        } else {
          this.lastTime = performance.now();
          this.rafId = requestAnimationFrame(this.tick);
        }
      },
      { signal: this.visibilityAbortController.signal }
    );
  }

  private startLoop(): void {
    if (this._running) return;
    this._running = true;
    if (document.hidden) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  /**
   * Adds one or more hover selectors to the current scope. Intended for
   * raw-object plugins during `install`. Plugins written with `definePlugin`
   * should use the `selector` option instead, and consumers setting up a
   * scope should prefer the `hoverSelectors` option at construction.
   */
  public registerHoverTarget(selector: string): void {
    const scope = this._installingScope ?? this._activeScope ?? this._scopes[0];
    if (!scope) return;
    for (const s of selector.split(",")) {
      const trimmed = s.trim();
      if (trimmed) scope.hoverSelectors.add(trimmed);
    }
  }
}

export type SupermouseInstance = Supermouse;
export { DEFAULT_HOVER_SELECTORS };
