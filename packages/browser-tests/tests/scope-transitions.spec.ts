import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const coreBundle = readFileSync(resolve(__dirname, "../../core/dist/index.umd.js"), "utf-8");

type CursorMode = "auto" | "custom" | "native" | "both";

interface SetupOptions {
  primaryMode: CursorMode;
  modalMode: CursorMode;
}

async function setupApp(page: Page, opts: SetupOptions): Promise<void> {
  await page.setContent(`
    <!doctype html>
    <html>
    <body style="margin: 0; height: 100vh;">
      <div id="primary" style="width: 100vw; height: 100vh; position: relative;">
        <p>primary content</p>
        <div id="modal" style="position: absolute; top: 100px; left: 100px; width: 300px; height: 200px; background: white; border: 1px solid #ccc;">
          <input type="text" id="modal-input" style="margin: 40px; width: 200px;" />
        </div>
      </div>
    </body>
    </html>
  `);
  await page.addScriptTag({ content: coreBundle });
  await page.evaluate((setup) => {
    const { Supermouse } = (window as any).SupermouseCore;
    const primary = document.getElementById("primary")!;
    const modal = document.getElementById("modal")!;
    const app = new Supermouse({
      container: primary,
      cursor: setup.primaryMode,
      autoStart: false
    });
    const modalHandle = app.addScope({
      container: modal,
      cursor: setup.modalMode
    });
    modalHandle.deactivate();
    app.start();
    (window as any).app = app;
    (window as any).modalHandle = modalHandle;
  }, opts);
}

async function readState(page: Page) {
  return page.evaluate(() => ({
    isNative: (window as any).app.state.isNative,
    cursorMode: (window as any).app.state.cursorMode,
    scopeName: (window as any).app.state.scope?.name ?? null
  }));
}

test("activate() re-settles hover state when the pointer is over a native-cursor element", async ({
  page
}) => {
  await setupApp(page, { primaryMode: "custom", modalMode: "auto" });

  // Pointer lands on the text input while the modal scope is deactivated.
  // The primary scope (custom mode) governs; its settle path resets
  // state.isNative to false and skips native detection entirely.
  await page.locator("#modal-input").hover();
  const before = await readState(page);
  expect(before.cursorMode).toBe("custom");
  expect(before.isNative).toBe(false);

  // Activate the modal scope. The pointer is already inside its container,
  // so _activateScope runs the eager path. Without resettle, state.isNative
  // stays stale (false) even though the new scope is auto mode and the
  // input's authored cursor is "text".
  await page.evaluate(() => (window as any).modalHandle.activate());

  const after = await readState(page);
  expect(after.cursorMode).toBe("auto");
  expect(after.isNative).toBe(true);
});

test("deactivate() re-settles hover state when the pointer is over a native-cursor element", async ({
  page
}) => {
  await setupApp(page, { primaryMode: "auto", modalMode: "custom" });

  // Activate the modal scope, then move the pointer over the input.
  await page.evaluate(() => (window as any).modalHandle.activate());
  await page.locator("#modal-input").hover();

  const inModal = await readState(page);
  expect(inModal.cursorMode).toBe("custom");
  // Custom mode ignores the input's authored "text" cursor — isNative
  // is force-reset to false by settleHoverState's early return.
  expect(inModal.isNative).toBe(false);

  // Deactivate the modal. The primary scope is auto mode and the input is
  // still under the pointer, so isNative should flip to true. Without
  // resettle (which the old clearHover path stood in for), isNative would
  // remain false and the custom cursor would show over a text input.
  await page.evaluate(() => (window as any).modalHandle.deactivate());

  const after = await readState(page);
  expect(after.cursorMode).toBe("auto");
  expect(after.isNative).toBe(true);
});
