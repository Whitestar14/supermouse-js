import type { SupermousePlugin, ScopeConfig, CursorMode, RuleDefinition } from "../types";
import { compilePolicy, normalizePolicy, type CursorPolicy } from "../policy";
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

  private _resolved: boolean;

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
    const compiled = compilePolicy(policy);
    this.nativeSelectors = compiled.native;
    this.hideSelectors = compiled.hide;

    let initialContainer: HTMLElement;
    if (typeof config.container === "string") {
      this.containerSelector = config.container;
      this._resolved = false;
      initialContainer = document.createElement("div");
      initialContainer.setAttribute("data-supermouse-placeholder", "");
    } else {
      this.containerSelector = null;
      this._resolved = true;
      initialContainer = config.container;
    }

    this.stage = new Stage(initialContainer, config.zIndex ?? inherited.zIndex);
  }

  contains(node: Node): boolean {
    if (!this._resolved) return false;
    return this.stage.containerElement.contains(node);
  }

  get container(): HTMLElement {
    return this.stage.containerElement;
  }

  /**
   * True for eager scopes, and for selector scopes whose container has
   * been resolved to a live element.
   */
  get resolved(): boolean {
    return this._resolved;
  }

  /**
   * Rebinds this scope's stage to a resolved container. Returns the
   * previous container if the scope was already resolved, so the caller
   * can clean up the old binding. No-op for eager scopes.
   */
  public resolveContainer(el: HTMLElement): HTMLElement | null {
    if (this.containerSelector === null) return null;
    const prev = this._resolved ? this.stage.containerElement : null;
    if (prev === el) return null;
    this.stage.setContainer(el);
    this._resolved = true;
    return prev;
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

    rules.push(`${prefix} label${exclusion} { cursor: none !important; }`);
    rules.push(`${prefix} select${exclusion} { cursor: none !important; }`);
    rules.push(
      `${prefix} input[type="range"]${exclusion}::-webkit-slider-thumb { cursor: none !important; }`
    );
    rules.push(
      `${prefix} input[type="range"]${exclusion}::-moz-range-thumb { cursor: none !important; }`
    );

    return rules;
  }
}
