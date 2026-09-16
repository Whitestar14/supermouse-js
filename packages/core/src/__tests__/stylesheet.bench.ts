import { bench, describe } from "vitest";
import { Supermouse } from "../Supermouse";

describe("stylesheet", () => {
  bench("construct + setRules", () => {
    const app = new Supermouse({ autoStart: false });
    app.destroy();
  });
});