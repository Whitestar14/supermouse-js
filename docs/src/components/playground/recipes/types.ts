import type { SupermouseInstance } from "@supermousejs/vue";

export type ControlType = "range" | "color" | "toggle" | "text" | "select";

export interface ControlSchema {
  key: string;
  label: string;
  type: ControlType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // for select
  unit?: string; // e.g. 'px', 'ms', 'deg'
  description?: string;
}

export type ASTValue = string | number | boolean | ASTNode | undefined;

export interface ASTNode {
  type: "Call" | "Object" | "Array" | "Identifier";
}

export interface CallNode extends ASTNode {
  type: "Call";
  callee: string;
  args: ASTValue[];
}

export interface ObjectNode extends ASTNode {
  type: "Object";
  properties: Record<string, ASTValue>;
}

export interface IdentifierNode extends ASTNode {
  type: "Identifier";
  name: string;
}

export interface ArrayNode extends ASTNode {
  type: "Array";
  elements: ASTValue[];
}

// AST Builders
export const call = (callee: string, ...args: ASTValue[]): CallNode => ({
  type: "Call",
  callee,
  args
});
export const obj = (properties: Record<string, ASTValue>): ObjectNode => ({
  type: "Object",
  properties
});
export const id = (name: string): IdentifierNode => ({ type: "Identifier", name });
export const arr = (elements: ASTValue[]): ArrayNode => ({ type: "Array", elements });

export interface RecipeAST {
  imports: Record<string, string[]>; // e.g. { '@supermousejs/dot': ['Dot'] }
  coreOptions?: Record<string, any>;
  chain?: CallNode[];
  preStatements?: string[];
}

export interface PresetRecipe {
  id: string;
  name: string;
  description: string;
  icon: string;
  schema: ControlSchema[];
  setup: (app: SupermouseInstance, config: any) => void;
  generateAST?: (config: any, globalConfig: any) => RecipeAST;
}
