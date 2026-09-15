/**
 * Global application constants and metadata.
 *
 * The version is injected from `packages/core/package.json` at build time
 * (see `vite.define` in nuxt.config.ts) so it can never drift from the release.
 */

declare const __SUPERMOUSE_VERSION__: string;

export const APP_VERSION = `v${__SUPERMOUSE_VERSION__}`;
export const APP_NAME = "Supermouse.js";
export const AUTHOR = "Stud.io Inc.";
export const YEAR = "2024-2026";

export const DOMAIN = "supermouse.js.org";
export const SITE_URL = `https://${DOMAIN}`;
export const GITHUB_URL = "https://github.com/Whitestar14/supermouse-js";
export const TWITTER_URL = "https://twitter.com/xijibomi";
