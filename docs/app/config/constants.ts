/** Fallback for a build where the define never reached this module; the globals
 * are always strings in a normal build (see `config/release.ts`). */
const release: { version: string; releasedAt: string } =
  typeof __SUPERMOUSE_VERSION__ === "string" && typeof __SUPERMOUSE_RELEASE_AT__ === "string"
    ? { version: __SUPERMOUSE_VERSION__, releasedAt: __SUPERMOUSE_RELEASE_AT__ }
    : { version: "2.4.3", releasedAt: "" };

export const APP_VERSION = `v${release.version}`;
export const LAST_RELEASED_AT = release.releasedAt;

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "unknown time ago";

  const diffMs = Date.now() - then.getTime();
  if (diffMs < 0) return "in the future";

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30.44 * day;
  const year = 365.25 * day;

  const diff = diffMs / minute;
  if (diff < 1) return "just now";
  if (diff < 60) return `${Math.floor(diff)} minute${Math.floor(diff) === 1 ? "" : "s"} ago`;
  if (diff < 1440)
    return `${Math.floor(diff / 60)} hour${Math.floor(diff / 60) === 1 ? "" : "s"} ago`;
  if (diff < 28 * 1440)
    return `${Math.floor(diff / 1440)} day${Math.floor(diff / 1440) === 1 ? "" : "s"} ago`;
  if (diff < 12 * 28 * 1440)
    return `${Math.floor(diff / week)} week${Math.floor(diff / week) === 1 ? "" : "s"} ago`;
  if (diff < 12 * month)
    return `${Math.floor(diff / month)} month${Math.floor(diff / month) === 1 ? "" : "s"} ago`;
  return `${Math.floor(diff / year)} year${Math.floor(diff / year) === 1 ? "" : "s"} ago`;
}

export const APP_NAME = "Supermouse.js";
export const AUTHOR = "Stud.io Inc.";
export const YEAR = "2024-2026";

export const DOMAIN = "supermouse.js.org";
export const SITE_URL = `https://${DOMAIN}`;
export const GITHUB_URL = "https://github.com/Whitestar14/supermouse-js";
export const TWITTER_URL = "https://twitter.com/xijibomi";
