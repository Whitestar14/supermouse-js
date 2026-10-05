import type { PluginMeta } from "@config/types";
import { ICONS } from "@config/icons";
import { GENERATED_PLUGINS } from "@data/generated-plugins";

export const PLUGINS: PluginMeta[] = GENERATED_PLUGINS.map((plugin) => ({
  ...plugin,
  icon: (ICONS as Record<string, string>)[plugin.icon] || ICONS.dot
}));
