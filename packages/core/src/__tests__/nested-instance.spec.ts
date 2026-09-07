import { describe, it, expect, afterEach } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Nested instances cursor inheritance", () => {
  let globalApp: Supermouse;
  let previewApp: Supermouse;
  let body: HTMLElement;
  let previewContainer: HTMLElement;

  afterEach(() => {
    globalApp?.destroy();
    previewApp?.destroy();
    document.body.innerHTML = "";
    document.head.innerHTML = "";
  });

  it.fails(
    "preview container should set inline cursor to auto when in 'both' mode to override inherited none",
    () => {
      body = document.body;
      globalApp = new Supermouse({ container: body, cursor: "auto", autoStart: false });

      // Force global instance to hide native cursor
      globalApp.setCursor("custom");
      globalApp.step(performance.now() + 16);
      expect(body.style.cursor).toBe("none");

      previewContainer = document.createElement("div");
      body.appendChild(previewContainer);

      previewApp = new Supermouse({
        container: previewContainer,
        cursor: "both",
        autoStart: false
      });
      previewApp.step(performance.now() + 16);

      // The preview container should have its own inline cursor set to 'auto'
      // to override the inherited 'none' from body.
      expect(previewContainer.style.cursor).toBe("auto");
    }
  );

  it.fails("nested both mode should show native cursor", () => {
    const global = new Supermouse({ container: document.body, cursor: "auto", autoStart: false });
    global.setCursor("custom");
    global.step(performance.now() + 16);
    expect(document.body.style.cursor).toBe("none");

    const preview = document.createElement("div");
    document.body.appendChild(preview);
    const local = new Supermouse({ container: preview, cursor: "both", autoStart: false });
    local.step(performance.now() + 16);

    // The preview container should have inline cursor 'auto', showing native cursor
    expect(preview.style.cursor).toBe("auto");
  });
});
