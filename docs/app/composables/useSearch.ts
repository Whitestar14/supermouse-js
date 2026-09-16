/**
 * useSearch — MiniSearch-powered docs search over *sections*, not just pages.
 *
 * The index is built from `/search-index.json`, a prerendered dump of
 * `queryCollectionSearchSections('docs')`. That gives one document per heading
 * (page title, sub-headings and the body text beneath each), so queries match
 * things "in between" page titles — a paragraph or an h3 — and land on the
 * right anchor.
 *
 * The index is fetched the first time the palette opens and cached for the
 * session, so it never adds weight to a page's initial payload.
 */
import { computed, ref, shallowRef } from "vue";
import MiniSearch from "minisearch";
import { useDocsNavigation } from "@config/navigation";

export interface SearchResult {
  /** Unique section id, e.g. `/docs/guide/usage#installation`. */
  id: string;
  /** Page title. */
  label: string;
  /** Section heading, when it differs from the page title. */
  heading?: string;
  description?: string;
  path: string;
  anchor?: string;
  type: "Guide" | "Plugin" | "Architecture" | "API";
  section?: string;
}

interface IndexSection {
  id: string;
  title: string;
  titles: string[];
  level: number;
  content: string;
}

interface IndexDoc {
  id: string;
  title: string;
  heading: string;
  content: string;
  path: string;
  anchor: string;
  type: SearchResult["type"];
  section: string;
}

/** Section group -> result badge. */
const GROUP_TYPE: Record<string, SearchResult["type"]> = {
  Guide: "Guide",
  Architecture: "Architecture",
  Integrations: "Guide",
  Reference: "API",
  "Standard Plugins": "Plugin",
  Experimental: "Plugin"
};

const MINISEARCH_OPTIONS = {
  fields: ["heading", "title", "content"],
  // Every field the UI reads must be *stored* — MiniSearch only returns
  // indexed fields when they also appear here.
  storeFields: ["title", "heading", "content", "path", "anchor", "type", "section"],
  searchOptions: {
    boost: { heading: 6, title: 4, content: 1 },
    prefix: true,
    fuzzy: 0.2
  }
};

const index = shallowRef<MiniSearch<IndexDoc> | null>(null);
let loadPromise: Promise<void> | null = null;

/** Strip markdown noise so a snippet reads as prose. */
function toSnippet(content?: string): string | undefined {
  const text = String(content ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_`#>[\]]/g, " ")
    .replace(/\(([^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text ? `${text.slice(0, 160)}${text.length > 160 ? "…" : ""}` : undefined;
}

function splitAnchor(id: string): { path: string; anchor: string } {
  const [path = "", anchor = ""] = id.split("#");
  return { path, anchor };
}

function loadIndex(groupByPath: Map<string, string>): Promise<void> {
  loadPromise ??= $fetch<IndexSection[]>("/search-index.json")
    .then((sections) => {
      const search = new MiniSearch<IndexDoc>(MINISEARCH_OPTIONS);

      const docs = sections.map<IndexDoc>((section) => {
        const { path, anchor } = splitAnchor(section.id);
        const group = groupByPath.get(path) ?? "";
        return {
          id: section.id,
          title: section.titles?.[0] ?? section.title,
          heading: section.title,
          content: section.content ?? "",
          path,
          anchor,
          type: GROUP_TYPE[group] ?? "Guide",
          section: group
        };
      });

      search.addAll(docs);
      index.value = search;
    })
    .catch((error) => {
      console.error("[search] failed to load the docs index", error);
      // Allow a later retry instead of caching the failure forever.
      loadPromise = null;
    });

  return loadPromise;
}

export function useSearch() {
  const query = ref("");
  const navigation = useDocsNavigation();

  // Snapshot the route -> group mapping while we still have a Nuxt context; the
  // loader runs after an `await` and cannot call composables anymore.
  const groupByPath = new Map<string, string>();
  for (const group of navigation) {
    for (const item of group.items) groupByPath.set(item.path, group.title);
  }

  void loadIndex(groupByPath);

  const results = computed<SearchResult[]>(() => {
    const trimmed = query.value.trim();
    const search = index.value;
    if (!trimmed || !search) return [];

    return search
      .search(trimmed, { combineWith: "OR" })
      .slice(0, 10)
      .map((hit) => {
        const doc = hit as unknown as Partial<IndexDoc>;
        const pageTitle = doc.title ?? doc.heading ?? hit.id;
        const heading = doc.heading;
        return {
          id: hit.id,
          label: pageTitle,
          heading: heading === pageTitle ? undefined : heading,
          description: toSnippet(doc.content),
          path: doc.path ?? "",
          anchor: doc.anchor || undefined,
          type: doc.type ?? "Guide",
          section: doc.section
        };
      });
  });

  const isLoading = computed(() => index.value === null);

  return { query, results, isLoading };
}
