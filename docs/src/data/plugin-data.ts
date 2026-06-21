import { PluginMeta } from "@config/types";
import { ICONS } from "@config/icons";
import generatedData from "@data/generated-plugins.json";

export const PLUGINS: PluginMeta[] = generatedData.map((p: any) => ({
  ...p,
  icon: (ICONS as Record<string, string>)[p.icon] || ICONS.dot
}));
