import { computed, ref } from "vue";
import { DOCS_NAVIGATION } from "@config/navigation";
import { PLUGINS } from "@data/plugin-data";
import { API_SECTIONS, ALL_API_ENTRIES } from "@composables/useApiReference";

export interface SearchResult {
  id: string;
  label: string;
  description?: string;
  path: string;
  type: "Guide" | "Plugin" | "API";
  section?: string;
  keywords: string[];
}

const PAGE_KEYWORDS: Record<string, string[]> = {
  "/docs/guide/introduction": [
    "start",
    "overview",
    "what",
    "about",
    "getting started",
    "philosophy",
    "core",
    "runtime"
  ],
  "/docs/guide/cookbook": [
    "recipes",
    "examples",
    "patterns",
    "snippets",
    "how to",
    "samples",
    "ideas"
  ],
  "/docs/guide/installation": ["setup", "add", "pnpm", "npm", "yarn", "start", "import", "install"],
  "/docs/guide/usage": [
    "config",
    "options",
    "init",
    "setup",
    "main",
    "provider",
    "plugins",
    "rules"
  ],
  "/docs/guide/troubleshooting": [
    "fix",
    "bug",
    "error",
    "issue",
    "glitch",
    "problem",
    "debug",
    "doctor"
  ],
  "/docs/guide/toolchain": ["toolchain", "cli", "scripts", "build", "monorepo", "workspace"],
  "/docs/advanced/architecture": ["core", "loop", "physics", "math", "internal", "lifecycle"],
  "/docs/advanced/authoring": [
    "plugin",
    "extension",
    "key",
    "add",
    "create",
    "write",
    "builder",
    "api",
    "custom"
  ],
  "/docs/advanced/contributing": [
    "pr",
    "github",
    "repo",
    "develop",
    "help",
    "cli",
    "scaffold",
    "generate",
    "script",
    "command",
    "terminal"
  ],
  "/docs/integrations/vue": ["component", "composable", "hook", "nuxt", "vue"],
  "/docs/integrations/react": ["component", "hook", "nextjs", "useeffect", "react"],
  "/docs/reference/api": [
    "core",
    "class",
    "supermouse",
    "options",
    "state",
    "methods",
    "plugin",
    "lifecycle",
    "utilities",
    "math",
    "dom",
    "effects",
    "reference"
  ],
  "/docs/advanced/tips-and-tricks": [
    "tips",
    "tricks",
    "patterns",
    "performance",
    "optimization",
    "cache",
    "priority"
  ]
};

const QUICK_PICKS: SearchResult[] = [
  {
    id: "quick-install",
    label: "Installation",
    path: "/docs/guide/installation",
    type: "Guide",
    section: "Guide",
    keywords: []
  },
  {
    id: "quick-usage",
    label: "Usage",
    path: "/docs/guide/usage",
    type: "Guide",
    section: "Guide",
    keywords: []
  },
  {
    id: "quick-api",
    label: "API Reference",
    path: "/docs/reference/api",
    type: "API",
    section: "Advanced",
    keywords: []
  },
  {
    id: "quick-dot",
    label: "Dot Plugin",
    path: "/docs/plugins/dot",
    type: "Plugin",
    keywords: []
  }
];

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim();
}

function tokenize(q: string): string[] {
  return normalizeQuery(q).split(/\s+/).filter(Boolean);
}

function scoreToken(query: string, text: string, boost: number = 1): number {
  const normalized = text.toLowerCase();
  if (normalized === query) return 100 * boost;
  if (normalized.startsWith(query)) return 50 * boost;
  if (normalized.includes(query)) return 20 * boost;

  const words = normalized.split(/[\s./_-]+/).filter(Boolean);
  if (words.some((word) => word.startsWith(query))) return 35 * boost;

  return 0;
}

function scoreItem(query: string, item: SearchResult): number {
  const tokens = tokenize(query);
  if (tokens.length === 0) return 0;

  let total = 0;
  for (const token of tokens) {
    const labelScore = scoreToken(token, item.label, 3);
    const keywordScore = Math.max(0, ...item.keywords.map((k) => scoreToken(token, k, 2)));
    const pathScore = scoreToken(token, item.path, 1);
    const sectionScore = item.section ? scoreToken(token, item.section, 1.5) : 0;
    const descScore = item.description ? scoreToken(token, item.description, 1) : 0;
    const tokenScore = labelScore + keywordScore + pathScore + sectionScore + descScore;

    if (tokenScore === 0) return 0;
    total += tokenScore;
  }

  return total + (tokens.length > 1 ? 10 : 0);
}

export function useSearch() {
  const query = ref("");

  const index = computed(() => {
    const items: SearchResult[] = [];

    DOCS_NAVIGATION.forEach((group) => {
      group.items.forEach((item) => {
        items.push({
          id: item.path,
          label: item.label,
          path: item.path,
          type: "Guide",
          section: group.title,
          keywords: PAGE_KEYWORDS[item.path] || []
        });
      });
    });

    API_SECTIONS.forEach((section) => {
      items.push({
        id: `api-${section.id}`,
        label: section.label,
        description: "API Reference section",
        path: `/docs/reference/api#${section.id}`,
        type: "API",
        section: "Reference",
        keywords: [section.id, section.label, "api", "reference"]
      });
    });

    ALL_API_ENTRIES.forEach((entry) => {
      items.push({
        id: `api-${entry.id}`,
        label: entry.name,
        description: entry.desc,
        path: `/docs/reference/api#${entry.id}`,
        type: "API",
        section: "Reference",
        keywords: [entry.id, entry.name, entry.type ?? "", "api"].filter(Boolean)
      });
    });

    PLUGINS.forEach((p) => {
      const keywords = [p.id, p.package, p.name];
      if (p.description) {
        keywords.push(
          ...p.description
            .toLowerCase()
            .split(/\W+/)
            .filter((k) => k.length > 2)
        );
      }

      items.push({
        id: p.id,
        label: p.name,
        description: p.description,
        path: `/docs/plugins/${p.id}`,
        type: "Plugin",
        keywords: keywords.filter((k) => k.length > 0)
      });
    });

    return items;
  });

  const results = computed(() => {
    const q = normalizeQuery(query.value);
    if (!q) return QUICK_PICKS;

    const scored = index.value
      .map((item) => ({ item, score: scoreItem(q, item) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.item);

    return scored;
  });

  return {
    query,
    results
  };
}
