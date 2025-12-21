
/**
 * AST-Based Code Generator
 * Generates robust, formatted TypeScript code for Supermouse recipes.
 */

// --- Mini-AST Definition ---

type ASTValue = string | number | boolean | ASTNode | undefined;

interface ASTNode {
  type: 'Call' | 'Object' | 'Array' | 'Identifier' | 'Raw';
}

interface CallNode extends ASTNode {
  type: 'Call';
  callee: string;
  args: ASTValue[];
}

interface ObjectNode extends ASTNode {
  type: 'Object';
  properties: Record<string, ASTValue>;
}

interface IdentifierNode extends ASTNode {
  type: 'Identifier';
  name: string;
}

interface ArrayNode extends ASTNode {
  type: 'Array';
  elements: ASTValue[];
}

// --- AST Builders ---

const call = (callee: string, ...args: ASTValue[]): CallNode => ({ type: 'Call', callee, args });
const obj = (properties: Record<string, ASTValue>): ObjectNode => ({ type: 'Object', properties });
const id = (name: string): IdentifierNode => ({ type: 'Identifier', name });
const arr = (elements: ASTValue[]): ArrayNode => ({ type: 'Array', elements });

// --- Serializer ---

const serialize = (node: ASTValue, indentLevel = 0): string => {
  if (node === undefined) return 'undefined';
  if (typeof node === 'string') return `'${node}'`; // Auto-quote strings
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  
  const indent = '  '.repeat(indentLevel);
  const nextIndent = '  '.repeat(indentLevel + 1);

  if (node.type === 'Identifier') return (node as IdentifierNode).name;
  
  if (node.type === 'Array') {
    const n = node as ArrayNode;
    const elements = n.elements.map(e => serialize(e, indentLevel)).join(', ');
    return `[${elements}]`;
  }
  
  if (node.type === 'Call') {
    const n = node as CallNode;
    const args = n.args.map(a => serialize(a, indentLevel)).join(', ');
    return `${n.callee}(${args})`;
  }

  if (node.type === 'Object') {
    const n = node as ObjectNode;
    const entries = Object.entries(n.properties).filter(([_, v]) => v !== undefined);
    if (entries.length === 0) return '{}';
    
    const props = entries.map(([k, v]) => {
      return `${nextIndent}${k}: ${serialize(v, indentLevel + 1)}`;
    });
    return `{\n${props.join(',\n')}\n${indent}}`;
  }

  return '';
};

// --- Mappings ---

const PLUGIN_IMPORTS: Record<string, string> = {
  'basic-dot': 'Dot',
  'ghost-trail': 'Dot, Ring',
  'magnetic-button': 'Dot, Ring, Magnetic',
  'sticky-element': 'Dot, Ring, Stick',
  'sparkles': 'Dot, Sparkles',
  'text-cursor': 'Dot, Text',
  'text-ring': 'Dot, TextRing',
  'vehicle-pointer': 'Pointer',
  'context-icon': 'Icon'
};

const PKG_MAP: Record<string, string> = {
  'Dot': '@supermousejs/dot',
  'Ring': '@supermousejs/ring',
  'Sparkles': '@supermousejs/sparkles',
  'Text': '@supermousejs/text',
  'TextRing': '@supermousejs/text-ring',
  'Magnetic': '@supermousejs/magnetic',
  'Pointer': '@supermousejs/pointer',
  'Icon': '@supermousejs/icon',
  'Stick': '@supermousejs/stick'
};

// --- Main Generator ---

export const generateCode = (recipeId: string, config: any, globalConfig: any) => {
  const imports = new Set<string>();
  const chain: CallNode[] = [];

  // 1. Core Config
  const coreOptions: Record<string, any> = {};
  if (globalConfig.smoothness !== 0.15) coreOptions.smoothness = globalConfig.smoothness;
  if (!globalConfig.showNative) coreOptions.hideCursor = true;
  if (recipeId === 'context-icon') coreOptions.ignoreOnNative = false;

  // 2. Plugin Nodes
  if (recipeId === 'basic-dot') {
    chain.push(call('Dot', obj({
      size: config.size,
      color: config.color,
      mixBlendMode: config.mixBlendMode !== 'normal' ? config.mixBlendMode : undefined
    })));
  } 
  else if (recipeId === 'vehicle-pointer') {
    chain.push(call('Pointer', obj({
      size: config.size,
      color: config.color,
      restingAngle: config.restingAngle,
      returnToRest: config.returnToRest,
      restDelay: config.restDelay
    })));
  }
  else if (recipeId === 'context-icon') {
    chain.push(call('Icon', obj({
      icons: id('icons'), // Reference variable
      size: config.size,
      color: config.color,
      transitionDuration: config.transitionDuration,
      followStrategy: config.followStrategy,
      anchor: config.anchor
    })));
  }
  else if (recipeId === 'text-ring') {
    chain.push(call('Dot', obj({ size: 6, color: config.color })));
    chain.push(call('TextRing', obj({
      text: config.text,
      radius: config.radius,
      spread: config.spread,
      speed: config.speed,
      fontSize: config.fontSize,
      color: config.color
    })));
  }
  else if (recipeId === 'magnetic-button') {
    chain.push(call('Magnetic', obj({ attraction: config.attraction, distance: config.distance })));
    chain.push(call('Dot', obj({ size: 8, color: '#000000' })));
    chain.push(call('Ring', obj({ size: 30, color: '#000000' })));
  }
  else if (recipeId === 'sticky-element') {
    chain.push(call('Stick', obj({ padding: config.padding })));
    chain.push(call('Dot', obj({ size: 8, color: config.color, hideOnShape: config.hideDot })));
    chain.push(call('Ring', obj({ size: 30, color: config.color, enableSkew: true })));
  }
  else if (recipeId === 'ghost-trail') {
    chain.push(call('Dot', obj({ size: 4, color: config.color })));
    chain.push(call('Ring', obj({ 
      size: config.size, 
      color: config.color, 
      mixBlendMode: 'normal' 
    })));
  }
  else if (recipeId === 'sparkles') {
    chain.push(call('Dot', obj({ size: 8, color: config.color })));
    chain.push(call('Sparkles', obj({ 
      color: config.color, 
      minVelocity: config.velocity 
    })));
  }
  else if (recipeId === 'text-cursor') {
    chain.push(call('Dot', obj({ size: 8, color: '#000000' })));
    chain.push(call('Text', obj({ offset: arr([0, config.offsetY]) })));
  }

  // 3. Build Import Statements
  const importLines: string[] = [`import { Supermouse } from '@supermousejs/core';`];
  
  if (PLUGIN_IMPORTS[recipeId]) {
    const needed = PLUGIN_IMPORTS[recipeId].split(', ');
    needed.forEach(p => {
      importLines.push(`import { ${p} } from '${PKG_MAP[p]}';`);
    });
  }

  // 4. Serialize Output
  const lines: string[] = [...importLines, ''];

  // Special Handling for Icons variable
  if (recipeId === 'context-icon') {
    lines.push(`const icons = {`);
    lines.push(`  default: \`<svg>...</svg>\`,`);
    lines.push(`  pointer: \`<svg>...</svg>\`,`);
    lines.push(`  text:    \`<svg>...</svg>\``);
    lines.push(`};\n`);
  }

  lines.push(`const app = new Supermouse(${serialize(obj(coreOptions))});`);
  lines.push('');
  
  // Serialize Chain
  if (chain.length > 0) {
    lines.push(`app`);
    chain.forEach((node, i) => {
      const isLast = i === chain.length - 1;
      const code = serialize(node); // e.g. Dot({...})
      lines.push(`  .use(${code})${isLast ? ';' : ''}`);
    });
  }

  return lines.join('\n');
};
