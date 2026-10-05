import type { PresetRecipe } from "./types";

export * from "./types";
export * from "./constants";

// Auto-discover all recipe modules in the items directory
const modules = import.meta.glob("./items/*.ts", { eager: true });

export const RECIPES: PresetRecipe[] = Object.values(modules).map(
  (mod: any) => mod.default || Object.values(mod)[0]
);
