import { chapterMeta, type ChapterMeta } from "./chapters";
import type { CursorEntry } from "./types";

/**
 * Every module in `entries/` that default-exports a cursor is picked up here,
 * so adding a cursor to the showcase is one new file and nothing else.
 */
const modules = import.meta.glob<{ default: CursorEntry }>("./entries/*.ts", { eager: true });

export const CURSORS: CursorEntry[] = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => a.order - b.order);

/** One chapter of the tour, resolved against the entries that claim it. */
export interface ChapterSlice extends ChapterMeta {
  /** Index of the chapter's first cursor — where a jump lands. */
  start: number;
  /** Indices of every cursor in the chapter, in tour order. */
  indices: number[];
}

/**
 * Derived from the entries rather than declared separately, so a chapter can
 * never disagree with the cursors that populate it. Tour order decides chapter
 * order: the first cursor of a chapter places it.
 */
export const CHAPTERS: ChapterSlice[] = CURSORS.reduce<ChapterSlice[]>((chapters, entry, index) => {
  const meta = chapterMeta(entry.chapter);
  const found = chapters.find((chapter) => chapter.id === meta.id);
  if (found) {
    found.indices.push(index);
  } else {
    chapters.push({ ...meta, start: index, indices: [index] });
  }
  return chapters;
}, []);

export function chapterOf(index: number): ChapterSlice {
  const id = CURSORS[index]?.chapter;
  return CHAPTERS.find((chapter) => chapter.id === id) ?? CHAPTERS[0];
}

/** Zero-padded `01 / 11` for the HUD and the transition stamp. */
export function tally(index: number): { current: string; total: string } {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return { current: pad(index + 1), total: pad(CURSORS.length) };
}
