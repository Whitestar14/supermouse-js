/**
 * Global application constants and metadata.
 *
 * The version is injected from `packages/core/package.json` at build time
 * (see `vite.define` in nuxt.config.ts) so it can never drift from the release.
 */

declare const __SUPERMOUSE_VERSION__: string;
declare const __SUPERMOUSE_RELEASE_AT__: string;

export const APP_VERSION = `v${__SUPERMOUSE_VERSION__}`;export const LAST_RELEASED_AT = __SUPERMOUSE_RELEASE_AT__;

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
  if (diff < 1440) return `${Math.floor(diff / 60)} hour${Math.floor(diff / 60) === 1 ? "" : "s"} ago`;
  if (diff < 28 * 1440) return `${Math.floor(diff / 1440)} day${Math.floor(diff / 1440) === 1 ? "" : "s"} ago`;
  if (diff < 12 * 28 * 1440) return `${Math.floor(diff / (7 * 1440))} week${Math.floor(diff / (7 * 1440)) === 1 ? "" : "s"} ago`;
  if (diff < 24 * 365.25 * 24 * 60) return `${Math.floor(diff / (30.44 * 1440))} month${Math.floor(diff / (30.44 * 1440)) === 1 ? "" : "s"} ago`;
  return `${Math.floor(diff / (365.25 * 1440))} year${Math.floor(diff / (365.25 * 1440)) === 1 ? "" : "s"} ago`;
}

export const APP_NAME = "Supermouse.js";
export const AUTHOR = "Stud.io Inc.";
export const YEAR = "2024-2026";

export const DOMAIN = "supermouse.js.org";
export const SITE_URL = `https://${DOMAIN}`;
export const GITHUB_URL = "https://github.com/Whitestar14/supermouse-js";
export const TWITTER_URL = "https://twitter.com/xijibomi";
