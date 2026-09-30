import { test, expect } from "@playwright/test";

const SCOPE_STYLES = `
  .supermouse-scope-0.supermouse-hide-0:not(.supermouse-scope-0 .supermouse-scope):not(.supermouse-scope-0 .supermouse-scope *):not([data-sm-probe]) { cursor: none !important; }
  .supermouse-scope-0.supermouse-hide-0 *:not(.supermouse-scope-0 .supermouse-scope):not(.supermouse-scope-0 .supermouse-scope *):not([data-sm-probe]) { cursor: none !important; }
  .supermouse-scope-0.supermouse-hide-0 input[type="range"]:not(.supermouse-scope-0 .supermouse-scope):not(.supermouse-scope-0 .supermouse-scope *)::-webkit-slider-thumb { cursor: none !important; }
  .supermouse-scope-0.supermouse-hide-0 input[type="range"]:not(.supermouse-scope-0 .supermouse-scope):not(.supermouse-scope-0 .supermouse-scope *)::-moz-range-thumb { cursor: none !important; }
`;

const FIXTURE = `
  <!doctype html>
  <html>
  <head>
    <style>
      a { cursor: pointer; color: #2b6cb0; }
      button { cursor: pointer; }
      .canvas-wrap { cursor: crosshair; }
      ${SCOPE_STYLES}
    </style>
  </head>
  <body>
    <div id="scope" class="supermouse-scope supermouse-scope-0 supermouse-hide-0">
      <a href="#">link</a>
      <button>button</button>
      <input type="text">
      <input type="button" value="btn">
      <input type="checkbox">
      <textarea></textarea>
      <select><option>x</option></select>
      <div contenteditable="true">edit</div>
      <div role="button">role</div>
      <div tabindex="0">focus</div>
      <label>label</label>
      <canvas class="canvas-wrap" width="40" height="20"></canvas>
    </div>
  </body>
  </html>
`;

test("suppression covers all common interactive elements", async ({ page }) => {
  await page.setContent(FIXTURE);

  const cases = [
    "a",
    "button",
    "input[type=text]",
    "input[type=button]",
    "input[type=checkbox]",
    "textarea",
    "select",
    "[contenteditable]",
    "[role=button]",
    "[tabindex]",
    "label",
    "canvas"
  ];

  for (const selector of cases) {
    const cursor = await page
      .locator(`#scope > ${selector}, #scope ${selector}`)
      .first()
      .evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor, `${selector} should compute cursor: none`).toBe("none");
  }
});

test("probe attribute re-exposes the authored cursor", async ({ page }) => {
  await page.setContent(FIXTURE);

  const cursor = await page.evaluate(() => {
    const link = document.querySelector("#scope a")!;
    link.setAttribute("data-sm-probe", "");
    const c = getComputedStyle(link).cursor;
    link.removeAttribute("data-sm-probe");
    return c;
  });

  expect(cursor).toBe("pointer");
});

test("nested scope is excluded from the outer suppression", async ({ page }) => {
  await page.setContent(`
    <!doctype html>
    <html>
    <head>
      <style>${SCOPE_STYLES}</style>
    </head>
    <body>
      <div id="outer" class="supermouse-scope supermouse-scope-0 supermouse-hide-0">
        <div id="inner" class="supermouse-scope supermouse-scope-1">
          <a href="#">nested link</a>
        </div>
      </div>
    </body>
    </html>
  `);

  // Outer scope suppresses its own descendants, but the exclusion chain
  // keeps those rules off the nested scope's subtree.
  const cursor = await page.locator("#inner a").evaluate((el) => getComputedStyle(el).cursor);
  expect(cursor).not.toBe("none");
});
