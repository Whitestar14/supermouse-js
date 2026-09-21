import type { SupermousePlugin, ScopeConfig, CursorMode, RuleDefinition } from "../types";
import { normalizePolicy, type CursorPolicy } from "../policy";
import { Stage } from "./Stage";

export type { ScopeConfig, CursorMode } from "../types";

export interface InheritedScopeOptions {
  cursor: CursorMode;
  hoverSelectors: string[];
  cursorPolicy: CursorPolicy;
  zIndex: number;
  inheritDataAttributes: boolean;
  ruleEntries: Array<[string, RuleDefinition]>;
}

export class Scope {
  public readonly stage: Stage;
  /**
   * The CSS selector used for lazy resolution, or null for eager scopes.
   * Derived from `config.container` at construction: a string means lazy,
   * an element means eager.
   */
  public readonly containerSelector: string | null;
  public readonly hoverSelectors: Set<string>;
  public readonly plugins: SupermousePlugin[] = [];
  public readonly nativeSelectors: string[];
  public readonly hideSelectors: string[];
  public readonly inheritDataAttributes: boolean;
  public readonly ruleEntries: Array<[string, RuleDefinition]>;
  public readonly name: string | undefined;
  public cursorMode: CursorMode;
  public active = true;

  private _bound: boolean;

  constructor(
    public readonly config: ScopeConfig,
    inherited: InheritedScopeOptions
  ) {
    this.name = config.name;
    this.cursorMode = config.cursor ?? inherited.cursor;
    this.hoverSelectors = new Set(config.hoverSelectors ?? inherited.hoverSelectors);
    this.inheritDataAttributes = config.inheritDataAttributes ?? inherited.inheritDataAttributes;
    this.ruleEntries = config.rules ? Object.entries(config.rules) : inherited.ruleEntries;

    const policy = config.cursorPolicy
      ? normalizePolicy(config.cursorPolicy)
      : inherited.cursorPolicy;
    this.nativeSelectors = policy.native;
    this.hideSelectors = policy.hide;

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

  get container(): HTMLElement {
    return this.stage.containerElement;
  }

  /**
   * True for eager scopes, and for selector scopes that have matched a
   * live element at least once.
   */
  get resolved(): boolean {
    return this._bound;
  }

  /**
   * True if this scope owns the given element. Element equality for eager
   * scopes; `Element.matches` for selector scopes. Invalid selectors are
   * treated as non-matching; validation happens once at scope creation.
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
   * scopes, and no-op if the stage is already attached to `el`.
   */
  public bind(el: HTMLElement): void {
    if (this.containerSelector === null) return;
    if (this._bound && this.stage.containerElement === el) return;
    this.stage.attach(el);
    this._bound = true;
  }

  contains(node: Node): boolean {
    return this._bound && this.stage.containerElement.contains(node);
  }

  get hoverSelectorString(): string {
    return Array.from(this.hoverSelectors).join(", ");
  }

  get nativeSelectorString(): string {
    return this.nativeSelectors.join(", ");
  }

  buildRules(): string[] {
    const prefix = this.stage.getRulePrefix();
    const exclusion = this.stage.getExclusion();
    const rules: string[] = [
      `${prefix}${exclusion} { cursor: none !important; }`,
      `${prefix} *${exclusion} { cursor: none !important; }`
    ];

    for (const selector of this.hideSelectors) {
      rules.push(`${prefix} ${selector}${exclusion} { cursor: none !important; }`);
    }

    rules.push(
      `${prefix} input[type="range"]${exclusion}::-webkit-slider-thumb { cursor: none !important; }`
    );
    rules.push(
      `${prefix} input[type="range"]${exclusion}::-moz-range-thumb { cursor: none !important; }`
    );

    return rules;
  }
}
