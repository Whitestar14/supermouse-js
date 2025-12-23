
import { PluginMeta } from './types';
import { ICONS } from './icons.ts';
import generatedData from './generated-plugins.json';

export interface ExtendedPluginMeta extends PluginMeta {
  recipeId?: string;
}

// Map the plain JSON data (strings) to runtime assets (SVG strings)
export const PLUGINS: ExtendedPluginMeta[] = generatedData.map((p: any) => ({
  ...p,
  // If icon key is valid, use it; else fallback to dot
  icon: (ICONS as any)[p.icon] || ICONS.dot
}));
