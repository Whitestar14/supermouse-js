export function createCommandRegistry({ rootDir, logger, showHelp }) {
  return {
    create: {
      description: "Create a new plugin",
      usage: "create <name>",
      run: async (args) =>
        (await import("../commands/create-plugin.js")).handle(args, rootDir, logger)
    },

    remove: {
      description: "Remove an existing plugin",
      usage: "remove <name>",
      run: async (args) =>
        (await import("../commands/remove-plugin.js")).handle(args, rootDir, logger)
    },

    sync: {
      description: "Synchronize all configuration files",
      usage: "sync [options]",
      run: async (args) =>
        (await import("../commands/sync-configs.js")).handle(args, rootDir, logger)
    },

    generate: {
      description: "Generate documentation data",
      usage: "generate [options]",
      run: async (args) =>
        (await import("../commands/generate-docs.js")).handle(args, rootDir, logger)
    },

    check: {
      description: "Check bundle sizes",
      usage: "check [options]",
      run: async (args) => (await import("../commands/check-size.js")).handle(args, rootDir, logger)
    },

    manage: {
      description: "Interactive plugin manager",
      usage: "manage",
      run: async (args) => (await import("../commands/manage.js")).handle(args, rootDir, logger)
    },

    help: {
      description: "Show this help message",
      usage: "help [command]",
      run: showHelp
    }
  };
}

export function getCommandList(commands) {
  return ["create", "remove", "sync", "generate", "check", "help"].map((name) => ({
    name,
    ...commands[name]
  }));
}
