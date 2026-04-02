/**
 * Generate documentation data command
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  logger.header("Generate Documentation Data");

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "generate-docs-data.js");
    const childArgs = [...args];
    if (verbose) childArgs.push("--verbose");

    const child = spawn("node", [scriptPath, ...childArgs], {
      stdio: "inherit"
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`generate-docs-data exited with code ${code}`));
    });
    child.on("error", reject);
  });
}
