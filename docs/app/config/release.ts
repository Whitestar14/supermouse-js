import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const TAG_PREFIX = "@supermousejs/core@";
const STABLE_VERSION = /^\d+\.\d+\.\d+$/;

export interface ReleaseInfo {
  /** Version the docs present as current. */
  version: string;
  /** ISO release date for `version`. */
  releasedAt: string;
}

interface Tag {
  name: string;
  date: string;
}

function git(args: string[], cwd: string): string {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 1024 * 1024
    }).trim();
  } catch {
    return "";
  }
}

function readInstalledVersion(repoRoot: string): string {
  const manifest = path.resolve(repoRoot, "packages/core/package.json");
  return String(JSON.parse(readFileSync(manifest, "utf-8")).version ?? "0.0.0");
}

/** Core tags, newest first, with their creation dates. */
function readCoreTags(repoRoot: string): Tag[] {
  const raw = git(
    [
      "for-each-ref",
      "--sort=-creatordate",
      "--format=%(refname:short)\t%(creatordate:iso-strict)",
      `refs/tags/${TAG_PREFIX}*`
    ],
    repoRoot
  );
  if (!raw) return [];

  return raw
    .split("\n")
    .map((line) => {
      const [name, date] = line.split("\t");
      return { name: name?.trim() ?? "", date: date?.trim() ?? "" };
    })
    .filter((tag) => tag.name.startsWith(TAG_PREFIX) && tag.date);
}

function lastCommitDate(repoRoot: string): string {
  return git(["log", "-1", "--format=%cI"], repoRoot);
}

/**
 * Version and release date the docs advertise. A prerelease core falls back to
 * the newest stable tag, and every branch returns a string: `nuxt.config.ts`
 * feeds this into Vite `define`, where a missing value crashes the client.
 */
export function resolveRelease(repoRoot: string): ReleaseInfo {
  const installed = readInstalledVersion(repoRoot);
  const tags = readCoreTags(repoRoot);

  const exact = tags.find((tag) => tag.name === `${TAG_PREFIX}${installed}`);
  const stable = tags.find((tag) => STABLE_VERSION.test(tag.name.slice(TAG_PREFIX.length)));
  const isPrerelease = installed.includes("-");

  if (!isPrerelease && exact) {
    return { version: installed, releasedAt: exact.date };
  }

  if (stable) {
    const version = stable.name.slice(TAG_PREFIX.length);
    if (isPrerelease) {
      console.info(
        `[docs] core is on ${installed} (prerelease); presenting the last stable release, ${version}.`
      );
    }
    return { version, releasedAt: stable.date };
  }

  if (exact) return { version: installed, releasedAt: exact.date };

  console.warn(
    `[docs] no git tag found for ${TAG_PREFIX}${installed}; falling back to the last commit date.`
  );
  return {
    version: installed,
    releasedAt: lastCommitDate(repoRoot) || new Date(0).toISOString()
  };
}
