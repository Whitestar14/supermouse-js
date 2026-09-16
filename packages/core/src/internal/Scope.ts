import type { SupermousePlugin } from "../types";
import {
  compilePolicy,
  DEFAULT_CURSOR_POLICY,
  normalizePolicy,
  type CursorPolicy,
  type CursorPolicyInput
} from "../policy";
import { Stage } from "./Stage";
import { DEFAULT_HOVER_SELECTORS } from "../constants";

export type CursorMode = "auto" | "custom" | "native" | "both";

export interface ScopeConfig {
  name?: string;
  container: HTMLElement;
  cursor?: CursorMode;
  hoverSelectors?: string[];
  cursorPolicy?: CursorPolicyInput;
  plugins?: SupermousePlugin[];
  inheritDataAttributes?: boolean;
  zIndex?: number;
}

export interface InheritedScopeOptions {
  cursor: CursorMode;
  hoverSelectors: string[];
  cursorPolicy: CursorPolicy;
  zIndex: number;
  inheritDataAttributes: boolean;
}

export class Scope {
  public readonly stage: Stage;
  public readonly hoverSelectors: Set<string>;
  public readonly hoverSelectorString: string;
  public readonly plugins: SupermousePlugin[] = [];
  public readonly nativeSelectors: string[];
  public readonly hideSelectors: string[];
  public readonly inheritDataAttributes: boolean;
  public readonly name: string | undefined;
  public cursorMode: CursorMode;

  constructor(
    public readonly config: ScopeConfig,
    inherited: InheritedScopeOptions
  ) {
    this.name = config.name;
    this.cursorMode = config.cursor ?? inherited.cursor;
    this.hoverSelectors = new Set(config.hoverSelectors ?? inherited.hoverSelectors);
    this.hoverSelectorString = Array.from(this.hoverSelectors).join(", ");
    this.inheritDataAttributes = config.inheritDataAttributes ?? inherited.inheritDataAttributes;

    const policy = config.cursorPolicy
      ? normalizePolicy(config.cursorPolicy)
      : inherited.cursorPolicy;
    const compiled = compilePolicy(policy);
    this.nativeSelectors = compiled.native;
    this.hideSelectors = compiled.hide;

    this.stage = new Stage(config.container, config.zIndex ?? inherited.zIndex);

    if (config.plugins) {
      for (const plugin of config.plugins) this.plugins.push(plugin);
    }
  }

  contains(node: Node): boolean {
    return this.stage.containerElement.contains(node);
  }

  get container(): HTMLElement {
    return this.stage.containerElement;
  }

  /** Build the CSS rules this scope contributes to the shared stylesheet. */
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
