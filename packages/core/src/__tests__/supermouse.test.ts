import { describe, expect, it } from "vitest";
import { Supermouse } from "../Supermouse";

describe("Supermouse core", () => {
  it("registers and looks up plugins by name", () => {
    const app = new Supermouse();

    const plugin = {
      name: "test-plugin",
      install() {},
      update() {}
    };

    app.use(plugin);

    expect(app.getPlugin("test-plugin")).toBe(plugin);
    expect(app.getPlugin("missing-plugin")).toBeUndefined();
  });
});
