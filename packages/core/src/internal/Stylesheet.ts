let sheet: CSSStyleSheet | null = null;
let styleTag: HTMLStyleElement | null = null;
let useAdopted = false;

function ensureSheet(): void {
  if (sheet || styleTag) return;

  if (
    typeof document !== "undefined" &&
    "adoptedStyleSheets" in document &&
    typeof CSSStyleSheet !== "undefined" &&
    "replaceSync" in CSSStyleSheet.prototype
  ) {
    try {
      sheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      useAdopted = true;
      return;
    } catch {
      // fall through to style tag
    }
  }

  styleTag = document.createElement("style");
  styleTag.id = "supermouse-styles";
  document.head.appendChild(styleTag);
}

let currentRules: string[] = [];

function writeRules(rules: string[]): void {
  ensureSheet();
  currentRules = rules;

  if (useAdopted && sheet) {
    if (sheet.cssRules.length > 0) {
      sheet.deleteRule(0);
    }
    for (const rule of rules) {
      try {
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch (e) {
        console.warn(`[Supermouse] Failed to insert rule: ${rule}`, e);
      }
    }
  } else if (styleTag) {
    styleTag.textContent = rules.join("\n");
  }
}

export function setRules(rules: string[]): void {
  writeRules(rules);
}

export function getRules(): string[] {
  return currentRules;
}

export function destroy(): void {
  if (useAdopted && sheet && typeof document !== "undefined") {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => s !== sheet);
  }
  sheet = null;
  styleTag?.remove();
  styleTag = null;
  currentRules = [];
  useAdopted = false;
}
