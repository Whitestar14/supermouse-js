/**
 * Remove plugin command
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  logger.header("Remove Plugin");

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "remove-plugin.js");
    const childArgs = [...args];
    if (verbose) childArgs.push("--verbose");
    if (dryRun) childArgs.push("--dry-run");
    if (autoYes) childArgs.push("-y");

    const child = spawn("node", [scriptPath, ...childArgs], {
      stdio: "inherit"
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`remove-plugin exited with code ${code}`));
    });
    child.on("error", reject);
  });
}
