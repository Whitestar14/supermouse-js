/**
 * Interactive plugin manager command
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "manage.js");
    const childArgs = [...args];
    if (verbose) childArgs.push("--verbose");

    const child = spawn("node", [scriptPath, ...childArgs], {
      stdio: "inherit"
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`manage exited with code ${code}`));
    });
    child.on("error", reject);
  });
}
