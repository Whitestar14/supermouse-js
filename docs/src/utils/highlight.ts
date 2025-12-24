
// A lightweight syntax highlighter with masking support.

type TokenType = 'comment' | 'string' | 'keyword' | 'number' | 'builtin' | 'function' | 'tag' | 'attr' | 'operator' | 'punctuation';

interface GrammarRule {
  type: TokenType;
  pattern: RegExp;
  style: string;
}

interface LanguageGrammar {
  islands: GrammarRule[]; // High priority, content is masked
  sea: GrammarRule[];     // Low priority, content is highlighted
}

// Dark Mode Palette (Background #09090b)
const COLORS = {
  amber: 'text-amber-500 font-bold', // Keywords, Tags
  white: 'text-zinc-100',            // Identifiers, Functions
  lightGrey: 'text-zinc-300',        // Attributes, Builtins
  mediumGrey: 'text-zinc-400',       // Strings, Numbers
  darkGrey: 'text-zinc-600',         // Punctuation, Operators
  comment: 'text-zinc-500 italic',   // Comments
};

const JS_GRAMMAR: LanguageGrammar = {
  islands: [
    { type: 'comment', pattern: /\/\/.*|\/\*[\s\S]*?\*\//g, style: COLORS.comment },
    { type: 'string', pattern: /(['"`])(?:\\.|(?!\1).)*\1/g, style: COLORS.mediumGrey },
  ],
  sea: [
    { type: 'function', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\()/g, style: COLORS.white },
    { type: 'builtin', pattern: /\b(console|window|document|Math|Array|Object|String|Number|Boolean|Date|Promise|Map|Set|HTMLElement|Supermouse|Dot|Ring|Sparkles|Magnetic|Pointer|Icon|Text|Image|requestAnimationFrame|cancelAnimationFrame)\b/g, style: COLORS.lightGrey },
    { type: 'keyword', pattern: /\b(import|export|from|const|let|var|function|class|interface|type|return|if|else|for|while|switch|case|break|continue|new|this|super|extends|implements|async|await|try|catch|finally|throw|default|true|false|null|undefined|void|any)\b/g, style: COLORS.amber },
    { type: 'number', pattern: /\b\d+(\.\d+)?\b/g, style: COLORS.mediumGrey },
    { type: 'punctuation', pattern: /[{}()\[\].,:;]/g, style: COLORS.darkGrey },
  ]
};

const HTML_GRAMMAR: LanguageGrammar = {
  islands: [
    { type: 'comment', pattern: /<!--[\s\S]*?-->/g, style: COLORS.comment },
    { type: 'string', pattern: /(['"])(?:\\.|(?!\1).)*\1/g, style: COLORS.mediumGrey }, 
  ],
  sea: [
    { type: 'tag', pattern: /<\/?[a-zA-Z0-9-]+/g, style: COLORS.amber },
    { type: 'attr', pattern: /\b[a-zA-Z0-9-@:]+(?==)/g, style: COLORS.lightGrey }, // Expanded for Vue @click etc
    { type: 'punctuation', pattern: /[<>=\/]/g, style: COLORS.darkGrey },
  ]
};

const CSS_GRAMMAR: LanguageGrammar = {
  islands: [
    { type: 'comment', pattern: /\/\*[\s\S]*?\*\//g, style: COLORS.comment },
  ],
  sea: [
    { type: 'keyword', pattern: /@\w+/g, style: COLORS.amber }, 
    { type: 'function', pattern: /[\.#][a-zA-Z0-9_-]+/g, style: COLORS.white }, 
    { type: 'attr', pattern: /[a-zA-Z0-9-]+(?=:)/g, style: COLORS.lightGrey }, 
    { type: 'number', pattern: /:\s*([^;]+)/g, style: COLORS.mediumGrey }, 
  ]
};

const GRAMMARS: Record<string, LanguageGrammar> = {
  js: JS_GRAMMAR,
  ts: JS_GRAMMAR,
  typescript: JS_GRAMMAR,
  javascript: JS_GRAMMAR,
  html: HTML_GRAMMAR,
  vue: HTML_GRAMMAR, 
  css: CSS_GRAMMAR,
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

interface TokenMatch {
  index: number;
  length: number;
  content: string;
  style: string;
}

export function highlight(code: string, lang: string = 'js'): string {
  const grammar = GRAMMARS[lang.toLowerCase()] || GRAMMARS.js;
  
  // 1. Extract Islands (Comments, Strings)
  const islands: string[] = [];
  let maskedCode = code;

  while (true) {
    let bestMatch: { index: number; length: number; rule: GrammarRule } | null = null;

    for (const rule of grammar.islands) {
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(maskedCode);
      if (match) {
        if (!bestMatch || match.index < bestMatch.index) {
          bestMatch = { index: match.index, length: match[0].length, rule };
        }
      }
    }

    if (!bestMatch) break;

    const content = maskedCode.substring(bestMatch.index, bestMatch.index + bestMatch.length);
    const placeholder = `___ISLAND_${islands.length}___`;
    
    islands.push(`<span class="${bestMatch.rule.style}">${escapeHtml(content)}</span>`);
    
    maskedCode = maskedCode.substring(0, bestMatch.index) + placeholder + maskedCode.substring(bestMatch.index + bestMatch.length);
  }

  // 2. Identify Sea Tokens
  const seaMatches: TokenMatch[] = [];

  for (const rule of grammar.sea) {
    const regex = new RegExp(rule.pattern.source, 'g'); 
    let match;
    while ((match = regex.exec(maskedCode)) !== null) {
      seaMatches.push({
        index: match.index,
        length: match[0].length,
        content: match[0],
        style: rule.style
      });
    }
  }

  seaMatches.sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index;
    return b.length - a.length;
  });

  const validMatches: TokenMatch[] = [];
  let lastIndex = 0;

  for (const m of seaMatches) {
    if (m.index >= lastIndex) {
      validMatches.push(m);
      lastIndex = m.index + m.length;
    }
  }

  // 3. Reconstruct
  let result = "";
  let cursor = 0;

  for (const m of validMatches) {
    result += escapeHtml(maskedCode.substring(cursor, m.index));
    result += `<span class="${m.style}">${escapeHtml(m.content)}</span>`;
    cursor = m.index + m.length;
  }
  
  result += escapeHtml(maskedCode.substring(cursor));

  return result.replace(/___ISLAND_(\d+)___/g, (_, index) => {
    return islands[Number(index)];
  });
}
