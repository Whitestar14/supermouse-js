import type {
  SupermouseInstance,
  SupermousePlugin,
  SupermouseOptions,
  MouseState
} from "@supermousejs/core";

export interface Point {
  x: number;
  y: number;
}

export interface OptionSchema {
  name: string;
  type: string;
  default?: string;
  description: string;
  reactive?: boolean;
}

export interface PluginMeta {
  id: string;
  name: string;
  package: string;
  description: string;
  code: string;
  icon: string;
  recipeId: string;
  version: string;
  options?: OptionSchema[];
  installCommand: string;
  importSnippet: string;
  hasDetailedDocs: boolean;
}

export type { SupermouseInstance, SupermousePlugin, SupermouseOptions, MouseState };
