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
  public readonly hoverSelectors: Set<string>;
  public readonly plugins: SupermousePlugin[] = [];
  public readonly nativeSelectors: string[];
  public readonly hideSelectors: string[];
  public readonly inheritDataAttributes: boolean;
  public readonly ruleEntries: Array<[string, RuleDefinition]>;
  public readonly name: string | undefined;
  public cursorMode: CursorMode;
  public disabled = false;

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

    this.stage = new Stage(config.container, config.zIndex ?? inherited.zIndex);
  }

  contains(node: Node): boolean {
    return this.stage.containerElement.contains(node);
  }

  get container(): HTMLElement {
    return this.stage.containerElement;
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
