/**
 * Build-time content discovery.
 *
 * Reads `content/**\/*.md` frontmatter so the docs navigation, prev/next
 * ordering, prerender route list and per-page "last updated" dates all come
 * from one source of truth. Adding a markdown page with `title` / `section` /
 * `order` is enough — nothing else needs updating by hand.
 *
 * Framework-free so `nuxt.config.ts` can import it directly.
 */

import { execSync } from "child_process";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

export interface DocsNavItem {
  label: string;
  path: string;
  /** ISO `YYYY-MM-DD` of the last commit that touched the source file. */
  updated?: string;
}

export interface DocsNavGroup {
  title: string;
  items: DocsNavItem[];
}

interface ContentPage {
  path: string;
  title: string;
  section: string;
  order: number;
  updated: string;
}

/** Sections render in this order; anything else is appended alphabetically. */
const SECTION_ORDER = ["Guide", "Architecture", "Integrations", "Reference"];

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Minimal `key: value` frontmatter reader — no dependencies, no YAML features. */
function parseFrontmatter(source: string): Record<string, string | number> {
  const block = FRONTMATTER.exec(source)?.[1];
  if (!block) return {};

  return block.split(/\r?\n/).reduce<Record<string, string | number>>((data, line) => {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) return data;

    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    if (value === "") return data;

    data[match[1]] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
    return data;
  }, {});
}

/** `docs/guide/usage.md` -> `/docs/guide/usage`, `docs/index.md` -> `/docs`. */
function toRoute(relativePath: string): string {
  return `/${relativePath.replace(/\.md$/, "")}`.replace(/\/index$/, "");
}

/**
 * Last commit date per file, from a single `git log` pass.
 *
 * Repo-relative paths are keyed by their `docs/content/...` form so callers can
 * look them up with the path relative to the content root.
 */
function readGitDates(contentRoot: string): Map<string, string> {
  const dates = new Map<string, string>();
  try {
    const prefix = execSync("git rev-parse --show-prefix", {
      cwd: contentRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    const log = execSync("git log --pretty=format:__%cI --name-only -- .", {
      cwd: contentRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      maxBuffer: 16 * 1024 * 1024
    });

    let current = "";
    for (const line of log.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.startsWith("__")) {
        current = trimmed.slice(2).slice(0, 10);
        continue;
      }
      // git prints newest first, so the first hit for a file wins.
      if (current && !dates.has(trimmed)) dates.set(trimmed, current);
    }
  } catch {
    // No git available (tarball builds, CI without history) — mtime is used instead.
  }
  return dates;
}

function collectPages(
  dir: string,
  gitDates: Map<string, string>,
  gitPrefix: string,
  prefix = "",
  pages: ContentPage[] = []
): ContentPage[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

    const relative = `${prefix}${entry.name}`;
    const absolute = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      collectPages(absolute, gitDates, gitPrefix, `${relative}/`, pages);
      continue;
    }
    if (!entry.name.endsWith(".md")) continue;

    const frontmatter = parseFrontmatter(readFileSync(absolute, "utf-8"));
    const updated =
      gitDates.get(`${gitPrefix}${relative}`) ??
      statSync(absolute).mtime.toISOString().slice(0, 10);

    pages.push({
      path: toRoute(relative),
      title: String(frontmatter.title ?? entry.name.replace(/\.md$/, "")),
      section: String(frontmatter.section ?? "Guide"),
      order: Number(frontmatter.order ?? Number.MAX_SAFE_INTEGER),
      updated
    });
  }
  return pages;
}

export function readDocsContent(contentRoot: string): {
  routes: string[];
  navigation: DocsNavGroup[];
} {
  const gitDates = readGitDates(contentRoot);

  let gitPrefix = "";
  try {
    gitPrefix = execSync("git rev-parse --show-prefix", {
      cwd: contentRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    gitPrefix = "";
  }

  const pages = collectPages(contentRoot, gitDates, gitPrefix).sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title)
  );

  const bySection = new Map<string, DocsNavItem[]>();
  for (const page of pages) {
    const items = bySection.get(page.section) ?? [];
    items.push({ label: page.title, path: page.path, updated: page.updated });
    bySection.set(page.section, items);
  }

  const titles = [...bySection.keys()].sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a);
    const bi = SECTION_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return {
    routes: pages.map((page) => page.path),
    navigation: titles.map((title) => ({ title, items: bySection.get(title)! }))
  };
}
