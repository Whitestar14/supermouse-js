declare const __VERSION__: string | undefined;
const VERSION: string = typeof __VERSION__ !== "undefined" ? __VERSION__ : "0.0.0";

import type { MouseState, SupermouseOptions, SupermousePlugin } from "./types";
import { OFFSCREEN } from "./constants";
import { Input } from "./internal/Input";
import { Scope, type CursorMode, type ScopeConfig } from "./internal/Scope";
import { setRules, destroy as destroyStylesheet } from "./internal/Stylesheet";
import { DEFAULT_CURSOR_POLICY, type CursorPolicyInput } from "./policy";

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
  readonly container: HTMLElement;
  remove(): void;
  setCursor(mode: CursorMode): void;
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
  private scopeByContainer = new Map<HTMLElement, Scope>();

  private input: Input;

  private rafId = 0;
  private lastTime = 0;
  private isRunning = false;
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
      interaction: {}
    };

    const primary = this.createScope({
      container: this.options.container,
      cursor: this.options.cursor,
      hoverSelectors: this.options.hoverSelectors,
      cursorPolicy: this.options.cursorPolicy,
      plugins: this.options.plugins,
      zIndex: this.options.zIndex
    });

    this.input = new Input(
      this.state,
      this.options,
      (enabled) => {
        if (!enabled) this.reset();
      },
      (scope) => this.handleActiveScopeChange(scope)
    );

    this.input.setScopes(this._scopes);
    this.input.setActiveScope(primary);

    this.installPlugins(primary);

    if (this.options.scopes) {
      for (const cfg of this.options.scopes) this.addScope(cfg);
    }

    this.rebuildStylesheet();
    this.bindVisibilityHandling();
    if (this.options.autoStart) this.start();
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

  public use(plugin: SupermousePlugin): this {
    this.installPlugin(this._scopes[0], plugin);
    return this;
  }

  public getPlugin(name: string): SupermousePlugin | undefined {
    for (const scope of this._scopes) {
      const found = scope.plugins.find((p) => p.name === name);
      if (found) return found;
    }
    return undefined;
  }

  public enablePlugin(name: string): void {
    const plugin = this.getPlugin(name);
    if (plugin && plugin.isEnabled === false) {
      plugin.isEnabled = true;
      if (plugin.element) plugin.element.style.display = "";
      plugin.onEnable?.(this);
    }
  }

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

  public setCursor(mode: CursorMode): void {
    if (!this._activeScope) return;
    this._activeScope.cursorMode = mode;
    this.state.cursorMode = mode;
  }

  public addScope(config: ScopeConfig): ScopeHandle {
    const scope = this.createScope(config);
    this.input.setScopes(this._scopes);
    this.installPlugins(scope);
    this.rebuildStylesheet();

    return {
      name: scope.name,
      container: scope.container,
      remove: () => this.removeScope(scope),
      setCursor: (mode) => this.setScopeCursor(scope, mode)
    };
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
    if (this.isRunning) return;
    this._running = true;
    if (document.hidden) return;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
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
    this.scopeByContainer.clear();
    this._activeScope = null;
    destroyStylesheet();
  }

  // ─── Internal ───

  private _running = false;

  private createScope(config: ScopeConfig): Scope {
    const scope = new Scope(config, {
      cursor: this.options.cursor,
      hoverSelectors: this.options.hoverSelectors ?? [
        "a",
        "button",
        "input",
        "textarea",
        "[data-hover]",
        "[data-cursor]"
      ],
      cursorPolicy: this.options.cursorPolicy
        ? normalizePolicyLocal(this.options.cursorPolicy)
        : DEFAULT_CURSOR_POLICY,
      zIndex: this.options.zIndex,
      inheritDataAttributes: this.options.inheritDataAttributes
    });

    this._scopes.push(scope);
    this.scopeByContainer.set(scope.container, scope);
    return scope;
  }

  private removeScope(scope: Scope): void {
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
    this.scopeByContainer.delete(scope.container);
    this.input.setScopes(this._scopes);

    if (this._activeScope === scope) {
      this.input.setActiveScope(this._scopes[0] ?? null);
    }

    this.rebuildStylesheet();
  }

  private setScopeCursor(scope: Scope, mode: CursorMode): void {
    scope.cursorMode = mode;
    if (scope === this._activeScope) this.state.cursorMode = mode;
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

    if (scope !== this._activeScope) {
      plugin.isEnabled = false;
      if (plugin.element) plugin.element.style.display = "none";
    }
  }

  private handleActiveScopeChange(scope: Scope | null): void {
    const previous = this._activeScope;
    if (previous === scope) return;

    if (previous) {
      for (const plugin of previous.plugins) this.deactivatePlugin(plugin);
    }

    this._activeScope = scope;

    if (scope) {
      this.state.cursorMode = scope.cursorMode;
      for (const plugin of scope.plugins) this.activatePlugin(plugin);
    }
  }

  private activatePlugin(plugin: SupermousePlugin): void {
    if (plugin.isEnabled !== false) return;
    plugin.isEnabled = true;
    if (plugin.element) plugin.element.style.display = "";
    plugin.onEnable?.(this);
  }

  private deactivatePlugin(plugin: SupermousePlugin): void {
    if (plugin.isEnabled === false) return;
    plugin.isEnabled = false;

    const finish = () => {
      if (plugin.element) plugin.element.style.display = "none";
      plugin.onDisable?.(this);
    };

    const result = plugin.onBeforeDisable?.(this);
    if (result && typeof (result as Promise<void>).then === "function") {
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

  private rebuildStylesheet(): void {
    const rules: string[] = [];
    for (const scope of this._scopes) rules.push(...scope.buildRules());
    setRules(rules);
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

    if (this.input.isEnabled && this.state.hasReceivedInput) {
      this.state.target.x = this.state.pointer.x;
      this.state.target.y = this.state.pointer.y;
    }

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
}

function normalizePolicyLocal(input: CursorPolicyInput) {
  if ("rules" in input) return input;
  const native = new Set(input.native ?? []);
  const hide = new Set(input.hide ?? []);
  const selectors = new Set([...native, ...hide]);
  return {
    rules: Array.from(selectors).map((selector) => ({
      selector,
      native: native.has(selector),
      hide: hide.has(selector)
    }))
  };
}

export type SupermouseInstance = Supermouse;
