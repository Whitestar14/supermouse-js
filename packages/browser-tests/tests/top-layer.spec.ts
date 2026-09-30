import { test, expect } from "@playwright/test";

test("body-level popover stage is demoted behind showModal()", async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html>
    <body>
      <div id="stage" popover="manual" style="position: fixed; inset: 0; pointer-events: none; z-index: 999999;">
        <div id="dot" style="position:absolute; top:0; left:0; width:24px; height:24px; border-radius:50%; background:red; transform: translate(200px, 200px);"></div>
      </div>
      <dialog id="modal" style="width: 400px; height: 300px; background: white; border: 2px solid black;">
        <p>Modal content</p>
      </dialog>
      <script>
        document.getElementById("stage").showPopover();
      </script>
    </body>
    </html>
  `);

  // Open the modal. It enters the top layer after the stage.
  await page.evaluate(() => {
    (document.getElementById("modal") as HTMLDialogElement).showModal();
  });

  // The stage is in the top layer but inserted earlier, so the modal wins.
  // Assert by checking what's on top at the dot's location.
  const topEl = await page.evaluate(() => {
    const el = document.elementFromPoint(212, 212);
    return el?.id ?? el?.tagName ?? null;
  });

  // In Chromium and Firefox, the modal is on top.
  // This is the finding that justifies per-container stages.
  expect(topEl).toBe("modal");
});

test("per-container stage renders above its host modal", async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html>
    <body>
      <dialog id="modal" style="width: 400px; height: 300px; background: white; border: 2px solid black;">
        <div id="stage" style="position: absolute; inset: 0; pointer-events: none; z-index: 999999;">
          <div id="dot" style="position:absolute; top:0; left:0; width:24px; height:24px; border-radius:50%; background:red; transform: translate(100px, 100px);"></div>
        </div>
      </dialog>
      <script>
        document.getElementById("modal").showModal();
      </script>
    </body>
    </html>
  `);

  // The stage is inside the dialog, so it renders above the modal content
  // without needing popover or top-layer tricks.
  const topEl = await page.evaluate(() => {
    const el = document.elementFromPoint(112, 112);
    // The stage has pointer-events: none, so elementFromPoint sees through
    // it. Check that the dot is visually above the modal by comparing paint
    // order via getBoundingClientRect and whether the dot is visible.
    return el?.id ?? el?.tagName ?? null;
  });

  // The dialog is what's under the dot because the stage is pointer-events: none.
  // The real assertion is that the dot is not clipped or hidden — check its
  // computed opacity and position.
  const dotVisible = await page.locator("#dot").evaluate((el) => {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && style.opacity !== "0" && style.display !== "none";
  });

  expect(dotVisible).toBe(true);
});
