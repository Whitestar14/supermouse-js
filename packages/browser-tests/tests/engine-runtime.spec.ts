import { test, expect } from "@playwright/test";
import { readState, setupApp } from "./helper";

test("bare <input type=text> falls back to native (UA cursor is 'text')", async ({ page }) => {
  await setupApp(page);
  await page.locator("#text-input").hover();

  const state = await readState(page);
  expect(state.isNative).toBe(true);

  const cursor = await page.locator("#container").evaluate((el) => getComputedStyle(el).cursor);
  expect(cursor).toBe("auto");
});

test("<input type=checkbox> matches the default native list", async ({ page }) => {
  await setupApp(page);
  await page.locator("#checkbox").hover();
  const state = await readState(page);
  expect(state.isNative).toBe(true);
});

test("<canvas> with authored crosshair falls back via the probe", async ({ page }) => {
  await setupApp(page);
  await page.locator("#canvas").hover();

  const state = await readState(page);
  expect(state.isNative).toBe(true);
  expect(state.authoredCursor).toBe("crosshair");
});

test("<div class=drag-handle> with authored grab does not fall back", async ({ page }) => {
  await setupApp(page);
  await page.locator("#drag").hover();

  const state = await readState(page);
  // The probe reads "grab" correctly, but grab is in SUPERMOUSE_CURSORS,
  // so no fallback fires — custom cursor shows.
  expect(state.authoredCursor).toBe("grab");
  expect(state.isNative).toBe(false);
});

test("<a> with UA pointer does not fall back", async ({ page }) => {
  await setupApp(page);
  await page.locator("#container a").hover();

  const state = await readState(page);
  // UA cursor is "pointer", which is in the allowlist.
  expect(state.authoredCursor).toBe("pointer");
  expect(state.isNative).toBe(false);
});

test("probe-only fallback for form controls varies by engine", async ({ page }, testInfo) => {
  await setupApp(page, { nativeCursorSelectors: [] });
  await page.locator("#text-input").hover();
  const state = await readState(page);
  if (testInfo.project.name === "webkit") {
    expect(state.isNative).toBe(false); // WebKit UA doesn't set cursor on inputs
  } else {
    expect(state.isNative).toBe(true); // Chromium/Firefox UA set cursor: text
  }
});
