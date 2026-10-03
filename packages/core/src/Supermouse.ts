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
import { OFFSCREEN, DEFAULT_HOVER_SELECTORS, DEFAULT_NATIVE_CURSOR_SELECTORS } from "./constants";
import { Input } from "./internal/Input";
import { createStyleOwner, setRules, destroyStylesheet } from "./internal/Stylesheet";

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
  private _activeScope: Scope | null = null;
  private _installingScope: Scope | null = null;
  private scopeByName = new Map<string, Scope>();

  private input: Input;
  private styleOwner: number;

  private _running = false;
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
      pointerTarget: null,
      hoverTarget: null,
      authoredCursor: null,
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
      nativeCursorSelectors: this.options.nativeCursorSelectors,
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
      (node) => this.resolveScopeForNode(node),
      () => this.applyCursorNow()
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

  public get container(): HTMLElement {
    return (this._activeScope ?? this._scopes[0]).stage.containerElement;
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
   * scope.
   */
  public use(plugin: SupermousePlugin): this {
    this._installPlugin(this._scopes[0], plugin);
    return this;
  }

  /**
   * Searches every scope and returns the first plugin matching `name`.
   */
  public getPlugin(name: string): SupermousePlugin | undefined {
    for (const scope of this._scopes) {
      const found = scope.plugins.find((p) => p.name === name);
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Enables a plugin by name
   */
  public enablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (!plugin || plugin.isEnabled !== false) return;

    plugin.isEnabled = true;

    const scope = this.findScopeForPlugin(plugin);
    if (scope && scope === this._activeScope && scope.active) {
      this.scopeActivatePlugin(plugin);
    }
  }

  /**
   * Disables a plugin by name
   */
  public disablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (!plugin || plugin.isEnabled === false) return;

    const scope = this.findScopeForPlugin(plugin);
    const active = scope !== null && scope === this._activeScope && scope.active;

    if (active) {
      this.deactivatePlugin(plugin);
    } else {
      plugin.isEnabled = false;
    }
  }

  public togglePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (!plugin) return;
    if (plugin.isEnabled === false) this.enablePlugin(name);
    else this.disablePlugin(name);
  }

  public getScope(name: string): Scope | undefined {
    return this.scopeByName.get(name);
  }

  public addScope(config: ScopeConfig): Scope {
    const scope = this.createScope(config);
    this.installPlugins(scope);
    this.rebuildStylesheet();
    return scope;
  }

  /**
   * Sets the cursor mode on the active scope.
   */
  public setCursor(mode: CursorMode): void {
    if (!this._activeScope) return;
    this._setScopeCursor(this._activeScope, mode);
  }

  /**
   * Adds one or more hover selectors to the current scope's shared set.
   */
  public addHoverSelectors(selectors: string): void {
    const scope = this._installingScope ?? this._activeScope ?? this._scopes[0];
    if (!scope) return;
    for (const s of selectors.split(",")) {
      const trimmed = s.trim();
      if (trimmed) scope.hoverSelectors.add(trimmed);
    }
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
    this.scopeByName.clear();
    this._activeScope = null;
    this.state.scope = null;
    destroyStylesheet(this.styleOwner);
  }

  private createScope(config: ScopeConfig): Scope {
    if (typeof config.container !== "string") {
      const el = config.container;
      for (const s of this._scopes) {
        if (s.containerSelector === null && s.stage.containerElement === el) {
          console.warn(
            `[Supermouse] A scope is already registered for this container. ` +
              `The previous scope will no longer activate.`
          );
          break;
        }
      }
    }

    const scope = new Scope(
      config,
      {
        cursor: this.options.cursor,
        hoverSelectors: this.options.hoverSelectors ?? DEFAULT_HOVER_SELECTORS,
        nativeCursorSelectors:
          this.options.nativeCursorSelectors ?? DEFAULT_NATIVE_CURSOR_SELECTORS,
        zIndex: this.options.zIndex,
        inheritDataAttributes: this.options.inheritDataAttributes,
        ruleEntries: this.options.rules ? Object.entries(this.options.rules) : [],
        probeAttribute: `data-${this.options.dataPrefix}-probe`
      },
      this
    );

    this._scopes.push(scope);
    if (scope.name) this.scopeByName.set(scope.name, scope);
    return scope;
  }

  /** @internal */
  public _destroyScope(scope: Scope): void {
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

    scope.stage.destroy();

    this._scopes.splice(i, 1);
    if (scope.name) this.scopeByName.delete(scope.name);

    if (this._activeScope === scope) {
      const next =
        this.resolveScopeForNode(scope.stage.containerElement.parentElement) ??
        this._scopes.find((s) => s.active) ??
        null;
      this.input.setActiveScope(next);
      this.input.resettle();
      this.applyCursorNow();
    }

    this.rebuildStylesheet();
  }

  /** @internal */
  public _setScopeCursor(scope: Scope, mode: CursorMode): void {
    scope.cursorMode = mode;
    if (scope === this._activeScope) {
      this.state.cursorMode = mode;
      this.applyCursorNow();
    }
  }

  /** @internal */
  public _deactivateScope(scope: Scope): void {
    if (!scope.active) return;
    scope.active = false;

    if (this._activeScope === scope) {
      const next =
        this.resolveScopeForNode(scope.stage.containerElement.parentElement) ??
        this._scopes.find((s) => s.active) ??
        null;
      this.input.setActiveScope(next);
      this.input.resettle();
      this.applyCursorNow();
    }
  }

  /** @internal */
  public _activateScope(scope: Scope): void {
    scope.active = true;

    if (this._activeScope === scope) return;
    if (!this.input.hasSeenPointer) return;

    if (scope.containerSelector !== null && !scope.resolved) {
      const candidates = document.querySelectorAll(scope.containerSelector);
      for (const el of candidates) {
        if (this.input.isPointerInside(el as HTMLElement)) {
          scope.bind(el as HTMLElement);
          break;
        }
      }
    }

    if (!scope.resolved) return;
    if (!this.input.isPointerInside(scope.stage.containerElement)) return;

    this.input.setActiveScope(scope);
    this.input.resettle();
    this.applyCursorNow();
  }

  /**
   * Called by `Input` on every `mouseover`, and internally when the active
   * scope is removed or deactivated. Walks from `node` up the ancestor
   * chain, returning the innermost active scope whose `match` succeeds
   * for an ancestor. The matched scope is bound to that ancestor before
   * return.
   */
  private resolveScopeForNode(node: Node | null): Scope | null {
    for (let el = node as HTMLElement | null; el; el = el.parentElement) {
      for (const scope of this._scopes) {
        if (!scope.active) continue;
        if (scope.match(el)) {
          scope.bind(el);
          return scope;
        }
      }
    }
    return null;
  }

  private findScopeForPlugin(plugin: SupermousePlugin): Scope | null {
    for (const scope of this._scopes) {
      if (scope.plugins.includes(plugin)) return scope;
    }
    return null;
  }

  private installPlugins(scope: Scope): void {
    if (!scope.config.plugins) return;
    for (const plugin of scope.config.plugins) this._installPlugin(scope, plugin);
  }

  /** @internal */
  public _installPlugin(scope: Scope, plugin: SupermousePlugin): void {
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

  /** @internal */
  public _removePluginFromScope(scope: Scope, name: string): void {
    const i = scope.plugins.findIndex((p) => p.name === name);
    if (i === -1) return;
    const plugin = scope.plugins[i];
    scope.plugins.splice(i, 1);

    this.runBeforeDisable(plugin, () => {
      try {
        plugin.onDisable?.(this);
        plugin.destroy?.(this);
      } catch (e) {
        console.error(`[Supermouse] Plugin '${name}' cleanup threw:`, e);
      }
      plugin.element?.remove();
    });
  }

  private runBeforeDisable(plugin: SupermousePlugin, finish: () => void): void {
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
      this.state.scope = { name: scope.name, container: scope.stage.containerElement };
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

    this.runBeforeDisable(plugin, () => {
      if (plugin.element) plugin.element.style.display = "none";
      plugin.onDisable?.(this);
    });
  }

  private scopeDeactivatePlugin(plugin: SupermousePlugin): void {
    this.runBeforeDisable(plugin, () => {
      if (plugin.element) plugin.element.style.display = "none";
      plugin.onDisable?.(this);
    });
  }

  private scopeActivatePlugin(plugin: SupermousePlugin): void {
    if (plugin.element) plugin.element.style.display = "";
    plugin.onEnable?.(this);
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

  /**
   * Synchronously writes the current cursor and stage visibility for the
   * active scope. Called after hover state settles, on cursor mode changes,
   * and on programmatic scope transitions. The `update()` rAF path calls
   * the same writers as a backstop.
   */
  private applyCursorNow(): void {
    const scope = this._activeScope;
    if (!scope) return;
    scope.stage.setVisibility(this.resolveStageVisibility());
    if (this.input.isEnabled) {
      scope.stage.setNativeCursor(this.resolveCursorState());
    }
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

  private rebuildStylesheet(): void {
    const rules: string[] = [":where(.supermouse-scope .supermouse-scope) { cursor: auto }"];
    for (const scope of this._scopes) rules.push(...scope.buildRules());
    setRules(this.styleOwner, rules);
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
}

export type SupermouseInstance = Supermouse;
export { DEFAULT_HOVER_SELECTORS };
