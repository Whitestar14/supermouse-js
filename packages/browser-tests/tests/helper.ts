import type { Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const coreBundle = readFileSync(
  resolve(import.meta.dirname, "../../core/dist/index.umd.js"),
  "utf-8"
);

const runtimeFixture = `
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

export interface RuntimeState {
  isNative: boolean;
  authoredCursor: string | null;
}

export async function setupApp(page: Page, options: Record<string, unknown> = {}): Promise<void> {
  await page.setContent(runtimeFixture);
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

export async function readState(page: Page): Promise<RuntimeState> {
  return page.evaluate(() => ({
    isNative: (window as any).app.state.isNative,
    authoredCursor: (window as any).app.state.authoredCursor
  }));
}
