/**
 * Sync configurations command
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handle({ verbose, dryRun, autoYes, args }, rootDir, logger) {
  logger.header("Synchronize Configurations");

  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "sync-configs.js");
    const childArgs = [...args];
    if (verbose) childArgs.push("--verbose");
    if (dryRun) childArgs.push("--dry-run");
    if (autoYes) childArgs.push("--non-interactive");

    const child = spawn("node", [scriptPath, ...childArgs], {
      stdio: "inherit"
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`sync-configs exited with code ${code}`));
    });
    child.on("error", reject);
  });
}
