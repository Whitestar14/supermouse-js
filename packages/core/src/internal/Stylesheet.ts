let nextOwnerId = 0;
const sheets = new Map<number, HTMLStyleElement>();

export function createStyleOwner(): number {
  return nextOwnerId++;
}

export function setRules(owner: number, rules: string[]): void {
  let tag = sheets.get(owner);
  if (!tag) {
    tag = document.createElement("style");
    tag.id = `supermouse-styles-${owner}`;
    document.head.appendChild(tag);
    sheets.set(owner, tag);
  }
  tag.textContent = rules.join("\n");
}

export function destroyStylesheet(owner: number): void {
  sheets.get(owner)?.remove();
  sheets.delete(owner);
}
