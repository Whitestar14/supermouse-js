let styleTag: HTMLStyleElement | null = null;
let currentRules: string[] = [];

function ensureTag(): void {
  if (styleTag || typeof document === "undefined") return;
  styleTag = document.createElement("style");
  styleTag.id = "supermouse-styles";
  document.head.appendChild(styleTag);
}

export function setRules(rules: string[]): void {
  ensureTag();
  if (!styleTag) return;
  currentRules = rules;
  styleTag.textContent = rules.join("\n");
}

export function getRules(): string[] {
  return currentRules;
}

export function destroy(): void {
  styleTag?.remove();
  styleTag = null;
  currentRules = [];
}