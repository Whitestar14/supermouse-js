import { computed, ref } from "vue";
import { DOCS_NAVIGATION } from "@config/navigation";
import { PLUGINS } from "@data/plugin-data";

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
  "/docs/guide/installation": ["setup", "add", "pnpm", "npm", "yarn", "start", "import"],
  "/docs/guide/usage": ["config", "options", "init", "setup", "main", "provider"],
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
  "/docs/advanced/architecture": ["core", "loop", "physics", "math", "internal", "lifecycle"],
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
  "/docs/integrations/vue": ["component", "composable", "hook", "nuxt"],
  "/docs/integrations/react": ["component", "hook", "nextjs", "useeffect"],
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
    "effects"
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

function normalizeQuery(q: string): string {
  return q.toLowerCase().trim();
}

function scoreMatch(query: string, text: string, boost: number = 1): number {
  const normalized = text.toLowerCase();
  if (normalized === query) return 100 * boost;
  if (normalized.startsWith(query)) return 50 * boost;
  if (normalized.includes(query)) return 20 * boost;
  return 0;
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

    PLUGINS.forEach((p) => {
      const keywords = [p.id, p.package];
      if (p.description) {
        keywords.push(...p.description.split(" ").slice(0, 10));
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
    if (!q) return [];

    const scored = index.value
      .map((item) => {
        const labelScore = scoreMatch(q, item.label, 3);
        const keywordScore = Math.max(0, ...item.keywords.map((k) => scoreMatch(q, k, 2)));
        const pathScore = scoreMatch(q, item.path, 1);
        const descScore = item.description ? scoreMatch(q, item.description, 1) : 0;
        const totalScore = labelScore + keywordScore + pathScore + descScore;

        return { item, score: totalScore };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.item);

    return scored;
  });

  return {
    query,
    results
  };
}
