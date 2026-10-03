import type { SupermousePlugin, ScopeConfig, CursorMode, RuleDefinition } from "../types";
import type { Supermouse } from "../Supermouse";
import { Stage } from "./Stage";

export type { ScopeConfig, CursorMode } from "../types";

export interface InheritedScopeOptions {
  cursor: CursorMode;
  hoverSelectors: string[];
  nativeCursorSelectors: string[];
  zIndex: number;
  inheritDataAttributes: boolean;
  ruleEntries: Array<[string, RuleDefinition]>;
  probeAttribute: string;
}

export class Scope {
  public readonly stage: Stage;
  public readonly probeAttribute: string;
  /** The CSS selector used for lazy resolution, or null for eager scopes.*/
  public readonly containerSelector: string | null;
  public readonly hoverSelectors: Set<string>;
  public readonly plugins: SupermousePlugin[] = [];
  public readonly nativeSelectors: string[];
  public readonly inheritDataAttributes: boolean;
  public readonly ruleEntries: Array<[string, RuleDefinition]>;
  public readonly name: string | undefined;
  public cursorMode: CursorMode;
  public active = true;

  private _bound: boolean;

  constructor(
    public readonly config: ScopeConfig,
    inherited: InheritedScopeOptions,
    private readonly _engine: Supermouse
  ) {
    this.name = config.name;
    this.cursorMode = config.cursor ?? inherited.cursor;
    this.hoverSelectors = new Set(config.hoverSelectors ?? inherited.hoverSelectors);
    this.inheritDataAttributes = config.inheritDataAttributes ?? inherited.inheritDataAttributes;
    this.ruleEntries = config.rules ? Object.entries(config.rules) : inherited.ruleEntries;
    this.probeAttribute = inherited.probeAttribute;
    this.nativeSelectors = config.nativeCursorSelectors ?? inherited.nativeCursorSelectors;

    let initialContainer: HTMLElement;
    if (typeof config.container === "string") {
      this.containerSelector = config.container;
      this._bound = false;
      initialContainer = document.createElement("div");
      initialContainer.setAttribute("data-supermouse-placeholder", "");
    } else {
      this.containerSelector = null;
      this._bound = true;
      initialContainer = config.container;
    }

    this.stage = new Stage(initialContainer, config.zIndex ?? inherited.zIndex);
  }

  /**
   * The scope's container element, or `null` if the scope is
   * selector-based and has not yet resolved to a live element.
   */
  get container(): HTMLElement | null {
    return this._bound ? this.stage.containerElement : null;
  }

  /**
   * True for eager scopes, and for selector scopes that have matched a
   * live element at least once.
   */
  get resolved(): boolean {
    return this._bound;
  }

  /**
   * True if this scope owns the given element.
   */
  public match(el: HTMLElement): boolean {
    if (this.containerSelector === null) {
      return this.stage.containerElement === el;
    }
    try {
      return el.matches(this.containerSelector);
    } catch {
      return false;
    }
  }

  /**
   * Rebinds this scope's stage to a matched element. No-op for eager
   * scopes and if already attached.
   */
  public bind(el: HTMLElement): void {
    if (this.containerSelector === null) return;
    if (this._bound && this.stage.containerElement === el) return;
    this.stage.attach(el);
    this._bound = true;
  }

  get hoverSelectorString(): string {
    return Array.from(this.hoverSelectors).join(", ");
  }

  get nativeSelectorString(): string {
    return this.nativeSelectors.join(", ");
  }

  /**
   * Removes this scope from the engine and cleans up its stage and
   * plugins. After `destroy()`, the scope cannot be reactivated.
   */
  public destroy(): void {
    this._engine._destroyScope(this);
  }

  /**
   * Sets the cursor mode for this scope. If the scope is currently
   * active, the change applies synchronously.
   */
  public setCursor(mode: CursorMode): void {
    this._engine._setScopeCursor(this, mode);
  }

  /**
   * Marks the scope as eligible for activation.
   *
   * If the pointer is already inside the scope's container, the scope
   * becomes active immediately. Otherwise it activates on the next
   * `mouseover` inside the container. Deactivation is always eager.
   */
  public activate(): void {
    this._engine._activateScope(this);
  }

  /**
   * Marks the scope as ineligible. If it was the active scope, control
   * yields immediately to the nearest active ancestor scope, or to
   * nothing if none exists.
   */
  public deactivate(): void {
    this._engine._deactivateScope(this);
  }

  /**
   * Installs a plugin into this scope. Returns the scope for chaining.
   */
  public use(plugin: SupermousePlugin): Scope {
    this._engine._installPlugin(this, plugin);
    return this;
  }

  /**
   * Removes a plugin from this scope by name.
   */
  public removePlugin(name: string): void {
    this._engine._removePluginFromScope(this, name);
  }

  /**
   * Returns the plugin installed in this scope matching `name`, or
   * `undefined`.
   */
  public getPlugin(name: string): SupermousePlugin | undefined {
    return this.plugins.find((p) => p.name === name);
  }

  buildRules(): string[] {
    const prefix = this.stage.getRulePrefix();
    const exclusion = this.stage.getExclusion();
    const probe = `:not([${this.probeAttribute}])`;

    return [
      `${prefix}${exclusion}${probe} { cursor: none !important; }`,
      `${prefix} *${exclusion}${probe} { cursor: none !important; }`,
      `${prefix} input[type="range"]${exclusion}::-webkit-slider-thumb { cursor: none !important; }`,
      `${prefix} input[type="range"]${exclusion}::-moz-range-thumb { cursor: none !important; }`
    ];
  }
}
