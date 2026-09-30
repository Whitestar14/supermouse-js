import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const coreBundle = readFileSync(
  resolve(import.meta.dirname, "../../core/dist/index.umd.js"),
  "utf-8"
);

const FIXTURE = `
  <!doctype html>
  <html>
  <head>
    <style>
      /* Site CSS that competes with Supermouse */
      a { cursor: pointer; color: #2b6cb0; }
      button { cursor: pointer; }
      .canvas-wrap { cursor: crosshair; }
      .drag-handle { cursor: grab; }
    </style>
  </head>
  <body>
    <div id="container">
      <a href="#">link</a>
      <input type="text" id="text-input">
      <input type="checkbox" id="checkbox">
      <button id="button">button</button>
      <canvas id="canvas" class="canvas-wrap" width="40" height="20"></canvas>
      <div id="drag" class="drag-handle" style="padding: 8px; border: 1px solid #ccc;">drag</div>
    </div>
  </body>
  </html>
`;

async function setupApp(page: Page, options: Record<string, unknown> = {}): Promise<void> {
  await page.setContent(FIXTURE);
  await page.addScriptTag({ content: coreBundle });
  await page.evaluate((opts) => {
    const { Supermouse } = (window as any).SupermouseCore;
    const container = document.getElementById("container")!;
    const app = new Supermouse({
      container,
      cursor: "auto",
      autoStart: false,
      ...opts
    });
    app.start();
    (window as any).app = app;
  }, options);
}

async function readState(
  page: Page
): Promise<{ isNative: boolean; authoredCursor: string | null }> {
  return page.evaluate(() => ({
    isNative: (window as any).app.state.isNative,
    authoredCursor: (window as any).app.state.authoredCursor
  }));
}

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
