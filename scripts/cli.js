#!/usr/bin/env node

/**
 * Supermouse CLI - Professional tooling for plugin management and configuration
 * Usage: node scripts/cli.js <command> [options]
 */

import { fileURLToPath } from "url";
import path from "path";
import { Logger } from "./core/logger.js";
import { createCommandRegistry, getCommandList } from "./core/command-registry.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const logger = new Logger("supermouse-cli");

// --- Commands ---

const commands = createCommandRegistry({
  rootDir,
  logger,
  showHelp
});

const commandList = getCommandList(commands);

// --- Help System ---

function showHelp(args = []) {
  const [specificCmd] = args;

  if (specificCmd && commands[specificCmd]) {
    const cmd = commands[specificCmd];
    logger.header(`Help: ${specificCmd}`);
    logger.info(`Description: ${cmd.description}`);
    logger.info(`Usage: supermouse ${cmd.usage}`);
    logger.info(`\nRun in: ${rootDir}`);
  } else {
    logger.header("Supermouse CLI - Plugin Manager");
    logger.info("Official tooling for supermouse-js plugin development\n");

    logger.section("Available Commands");
    const cmdList = commandList
      .map(({ name, description }) => [`  ${name.padEnd(12)}`, description])
      .concat([["  manage".padEnd(12), "(interactive) " + commands.manage.description]]);

    cmdList.forEach(([key, desc]) => {
      console.log(`${key}   ${desc}`);
    });

    logger.section("Global Options");
    console.log(`  --help              Show help for a command`);
    console.log(`  --verbose           Enable verbose output`);
    console.log(`  --dry-run           Show what would be done without making changes`);
    console.log(`  -y, --yes           Skip confirmations`);

    logger.section("Examples");
    console.log(`  supermouse create my-plugin`);
    console.log(`  supermouse sync --verbose`);
    console.log(`  supermouse remove my-plugin -y`);
    console.log(`  supermouse help create`);
  }
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);

  // Handle no arguments
  if (args.length === 0) {
    showHelp([]);
    process.exit(0);
  }

  // Global options
  const verbose = args.includes("--verbose") || args.includes("-v");
  const dryRun = args.includes("--dry-run");
  const autoYes = args.includes("--yes") || args.includes("-y");

  if (verbose) {
    logger.verbosity = "debug";
  }

  logger.debug("CLI started with args:", args.join(" "));
  logger.debug("Verbose mode:", verbose ? "ON" : "OFF");
  logger.debug("Dry run:", dryRun ? "ENABLED" : "DISABLED");
  logger.debug("Auto-confirm:", autoYes ? "YES" : "NO");

  // Parse command
  const commandNameIndex = args.findIndex((a) => !a.startsWith("--") && a !== "--help");
  const commandName = commandNameIndex >= 0 ? args[commandNameIndex] : null;
  const commandArgs = commandNameIndex >= 0 ? args.slice(commandNameIndex + 1) : args;

  // Handle help flag
  if (args.includes("--help") && !commandName) {
    showHelp([]);
    process.exit(0);
  }

  if (!commandName) {
    showHelp([]);
    process.exit(0);
  }

  if (commandArgs.includes("--help")) {
    showHelp([commandName]);
    process.exit(0);
  }

  // Validate command exists
  if (!commands[commandName]) {
    logger.error(`Unknown command: "${commandName}"`);
    logger.newline();
    showHelp([]);
    process.exit(1);
  }

  // Add global options to command args
  const finalArgs = {
    verbose,
    dryRun,
    autoYes,
    args: commandArgs
  };

  try {
    await commands[commandName].run(finalArgs);
    process.exit(0);
  } catch (error) {
    logger.error("Command failed:", error.message);
    if (verbose) {
      logger.debug(error.stack);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error("Fatal error:", err.message);
  console.error(err);
  process.exit(1);
});
