/**
 * The tour reads in chapters rather than as one endless list: a chapter is a
 * shared idea (light, ink, physics, semantics) and every cursor declares the
 * one it belongs to. Order lives in the entry's `order`; this file only names
 * the ideas, so a cursor can be moved between chapters without touching
 * anyone else's numbers.
 */
export interface ChapterMeta {
  id: ChapterId;
  label: string;
  blurb: string;
}

export type ChapterId = "core" | "optics" | "art" | "motion" | "interaction";

export const CHAPTERS: readonly ChapterMeta[] = [
  { id: "core", label: "Core", blurb: "The plugins that ship in every install" },
  { id: "optics", label: "Optics", blurb: "Light, glass and signal" },
  { id: "art", label: "Art", blurb: "Ink, pixels and texture" },
  { id: "motion", label: "Motion", blurb: "Physics, fields and simulation" },
  { id: "interaction", label: "Interaction", blurb: "Semantics, targeting and snapping" }
];

/** Falls back to Core so a stray id in an entry cannot blank the whole tour. */
export function chapterMeta(id: string): ChapterMeta {
  return CHAPTERS.find((chapter) => chapter.id === id) ?? CHAPTERS[0];
}
