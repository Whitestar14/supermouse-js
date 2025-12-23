
// A lightweight syntax highlighter with masking support.
// Strategy: Identify "islands" (strings, comments) first, replace them with placeholders.
// Then identify all "sea" tokens (keywords) in a single pass without modifying the string iteratively.
// Finally, reconstruct the string with HTML tags.

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

const COLORS = {
  purple: 'text-amber-500', // Keywords -> Amber
  green: 'text-zinc-500',   // Strings -> Grey
  red: 'text-zinc-600',     // Tags -> Darker Grey
  blue: 'text-zinc-300',    // Functions -> Light Grey (Subtle)
  orange: 'text-zinc-500',  // Numbers -> Grey
  yellow: 'text-zinc-400',  // Builtins -> Light Grey
  grey: 'text-zinc-600 italic', // Comments
  white: 'text-zinc-100',   // Base text (handled by parent mostly)
};

const JS_GRAMMAR: LanguageGrammar = {
  islands: [
    { type: 'comment', pattern: /\/\/.*|\/\*[\s\S]*?\*\//g, style: COLORS.grey },
    { type: 'string', pattern: /(['"`])(?:\\.|(?!\1).)*\1/g, style: COLORS.green },
  ],
  sea: [
    { type: 'function', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\()/g, style: COLORS.blue },
    { type: 'builtin', pattern: /\b(console|window|document|Math|Array|Object|String|Number|Boolean|Date|Promise|Map|Set|HTMLElement|Supermouse|Dot|Ring|Sparkles|Magnetic|Pointer|Icon|Text|Image|requestAnimationFrame|cancelAnimationFrame)\b/g, style: COLORS.yellow },
    { type: 'keyword', pattern: /\b(import|export|from|const|let|var|function|class|interface|type|return|if|else|for|while|switch|case|break|continue|new|this|super|extends|implements|async|await|try|catch|finally|throw|default|true|false|null|undefined|void|any)\b/g, style: COLORS.purple },
    { type: 'number', pattern: /\b\d+(\.\d+)?\b/g, style: COLORS.orange },
  ]
};

const HTML_GRAMMAR: LanguageGrammar = {
  islands: [
    { type: 'comment', pattern: /<!--[\s\S]*?-->/g, style: COLORS.grey },
    { type: 'string', pattern: /(['"])(?:\\.|(?!\1).)*\1/g, style: COLORS.green }, // Strings inside tags
  ],
  sea: [
    { type: 'tag', pattern: /<\/?[a-zA-Z0-9-]+/g, style: COLORS.red },
    { type: 'attr', pattern: /\b[a-zA-Z0-9-]+(?==)/g, style: COLORS.orange },
    { type: 'punctuation', pattern: /[<>=\/]/g, style: COLORS.grey },
  ]
};

const CSS_GRAMMAR: LanguageGrammar = {
  islands: [
    { type: 'comment', pattern: /\/\*[\s\S]*?\*\//g, style: COLORS.grey },
  ],
  sea: [
    { type: 'keyword', pattern: /@\w+/g, style: COLORS.purple }, // @media, @import
    { type: 'function', pattern: /[\.#][a-zA-Z0-9_-]+/g, style: COLORS.red }, // Selectors roughly
    { type: 'attr', pattern: /[a-zA-Z0-9-]+(?=:)/g, style: COLORS.blue }, // Properties
    { type: 'number', pattern: /:\s*([^;]+)/g, style: COLORS.green }, // Values (naive)
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

  // We mask islands by replacing them with a placeholder
  // We must do this iteratively to respect order
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
    
    // Store with styled HTML
    islands.push(`<span class="${bestMatch.rule.style}">${escapeHtml(content)}</span>`);
    
    maskedCode = maskedCode.substring(0, bestMatch.index) + placeholder + maskedCode.substring(bestMatch.index + bestMatch.length);
  }

  // 2. Identify Sea Tokens (Keywords, etc)
  // Instead of replacing in-place (which causes the recursion bug), we collect all matches
  const seaMatches: TokenMatch[] = [];

  for (const rule of grammar.sea) {
    // Reset regex
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

  // 3. Sort matches and resolve overlaps
  // We prioritize earlier matches. For same start index, longer matches win.
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

  // 4. Reconstruct String
  let result = "";
  let cursor = 0;

  for (const m of validMatches) {
    // Append plain text before token (escape it)
    result += escapeHtml(maskedCode.substring(cursor, m.index));
    
    // Append token (wrap in span, escape content)
    result += `<span class="${m.style}">${escapeHtml(m.content)}</span>`;
    
    cursor = m.index + m.length;
  }
  
  // Append remaining text
  result += escapeHtml(maskedCode.substring(cursor));

  // 5. Restore Islands
  return result.replace(/___ISLAND_(\d+)___/g, (_, index) => {
    return islands[Number(index)];
  });
}
