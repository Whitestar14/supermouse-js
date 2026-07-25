import {
  RECIPES,
  type PresetRecipe,
  type ASTValue,
  type CallNode,
  type ObjectNode,
  type IdentifierNode,
  type ArrayNode
} from "@playground/recipes";

const formatKey = (key: string): string => {
  if (key.startsWith("'") || key.startsWith('"')) return key;
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
};

const serialize = (node: ASTValue, indentLevel = 0): string => {
  if (node === undefined) return "undefined";
  if (typeof node === "string") return `'${node}'`;
  if (typeof node === "number" || typeof node === "boolean") return String(node);

  if (node.type === "Identifier") return (node as IdentifierNode).name;

  if (node.type === "Array") {
    const n = node as ArrayNode;
    const elements = n.elements.map((e) => serialize(e, indentLevel)).join(", ");
    return `[${elements}]`;
  }

  if (node.type === "Call") {
    const n = node as CallNode;
    const args = n.args.map((a) => serialize(a, indentLevel)).join(", ");
    return `${n.callee}(${args})`;
  }

  if (node.type === "Object") {
    const n = node as ObjectNode;
    const entries = Object.entries(n.properties).filter(([_, v]) => v !== undefined);
    if (entries.length === 0) return "{}";

    const singleLineProps = entries
      .map(([k, v]) => `${formatKey(k)}: ${serialize(v, 0)}`)
      .join(", ");
    const singleLine = `{ ${singleLineProps} }`;

    const isComplex = entries.some(
      ([_, v]) => v && typeof v === "object" && (v.type === "Object" || v.type === "Array")
    );

    if (!isComplex && singleLine.length <= 60) {
      return singleLine;
    }

    const indent = "  ".repeat(indentLevel);
    const nextIndent = "  ".repeat(indentLevel + 1);
    const props = entries.map(
      ([k, v]) => `${nextIndent}${formatKey(k)}: ${serialize(v, indentLevel + 1)}`
    );
    return `{\n${props.join(",\n")}\n${indent}}`;
  }

  return "";
};

export const generateCode = (
  recipe: PresetRecipe | string,
  config: any,
  globalConfig: any
): string => {
  let targetRecipe: PresetRecipe | undefined;
  if (typeof recipe === "string") {
    targetRecipe = RECIPES.find((r) => r.id === recipe);
  } else {
    targetRecipe = recipe;
  }

  const coreOptions: Record<string, any> = {};
  if (globalConfig?.smoothness !== 0.15) coreOptions.smoothness = globalConfig?.smoothness;
  if (globalConfig && !globalConfig.showNative) coreOptions.hideCursor = true;

  if (!targetRecipe || !targetRecipe.generateAST) {
    const coreSerialized =
      Object.keys(coreOptions).length > 0
        ? serialize({ type: "Object", properties: coreOptions } as any)
        : "";
    return `import { Supermouse } from '@supermousejs/core';\n\nconst app = new Supermouse(${coreSerialized});`;
  }

  const ast = targetRecipe.generateAST(config, globalConfig);

  const finalCoreOptions = { ...coreOptions, ...ast.coreOptions };

  const importsByPackage: Record<string, Set<string>> = {
    "@supermousejs/core": new Set(["Supermouse"])
  };

  if (ast.imports) {
    Object.entries(ast.imports).forEach(([pkg, symbols]) => {
      if (!importsByPackage[pkg]) importsByPackage[pkg] = new Set();
      symbols.forEach((s) => importsByPackage[pkg].add(s));
    });
  }

  const importLines = Object.entries(importsByPackage).map(([pkg, symbols]) => {
    const list = Array.from(symbols).join(", ");
    return `import { ${list} } from '${pkg}';`;
  });

  const lines: string[] = [...importLines, ""];

  if (ast.preStatements) {
    lines.push(...ast.preStatements);
  }

  const coreSerialized =
    Object.keys(finalCoreOptions).length > 0
      ? serialize({ type: "Object", properties: finalCoreOptions } as any)
      : "";

  lines.push(`const app = new Supermouse(${coreSerialized});`);

  if (ast.chain && ast.chain.length > 0) {
    lines.push("");
    lines.push("app");
    ast.chain.forEach((node, i) => {
      const isLast = i === ast.chain!.length - 1;
      const code = serialize(node);
      lines.push(`  .use(${code})${isLast ? ";" : ""}`);
    });
  }

  return lines.join("\n");
};
