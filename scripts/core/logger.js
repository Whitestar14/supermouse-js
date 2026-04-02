/**
 * Professional logging utilities with colors and formatting
 */

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",

  // Foreground
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m"
};

export class Logger {
  constructor(prefix = "SUPERMOUSE", verbosity = "info") {
    this.prefix = prefix;
    this.verbosity = verbosity; // "debug" | "info" | "warn" | "error"
  }

  _log(level, color, symbol, ...args) {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    const prefix = `${color}${COLORS.bold}[${this.prefix}]${COLORS.reset}`;
    const time = `${COLORS.dim}${timestamp}${COLORS.reset}`;

    console.log(`${prefix} ${symbol} ${time}`, ...args);
  }

  header(title) {
    console.log("\n" + COLORS.cyan + COLORS.bold + "═".repeat(60) + COLORS.reset);
    console.log(COLORS.cyan + COLORS.bold + `  ${title}` + COLORS.reset);
    console.log(COLORS.cyan + COLORS.bold + "═".repeat(60) + COLORS.reset + "\n");
  }

  section(title) {
    console.log(`\n${COLORS.blue}${COLORS.bold}→ ${title}${COLORS.reset}`);
  }

  info(...args) {
    if (["debug", "info"].includes(this.verbosity)) {
      this._log("info", COLORS.cyan, "ℹ", ...args);
    }
  }

  success(...args) {
    this._log("success", COLORS.green, "✓", ...args);
  }

  warn(...args) {
    if (["debug", "info", "warn"].includes(this.verbosity)) {
      this._log("warn", COLORS.yellow, "⚠", ...args);
    }
  }

  error(...args) {
    this._log("error", COLORS.red, "✗", ...args);
  }

  debug(...args) {
    if (this.verbosity === "debug") {
      this._log("debug", COLORS.magenta, "🐛", ...args);
    }
  }

  box(type, ...args) {
    const colors = {
      info: COLORS.cyan,
      success: COLORS.green,
      warn: COLORS.yellow,
      error: COLORS.red
    };
    const color = colors[type] || COLORS.white;
    const symbol = { info: "ℹ", success: "✓", warn: "⚠", error: "✗" }[type] || "•";

    const text = args.join(" ");
    const padding = 2;
    const width = Math.max(60, text.length + padding * 2);

    console.log("\n" + color + "█".repeat(width) + COLORS.reset);
    console.log(color + "█" + " ".repeat(width - 2) + "█" + COLORS.reset);
    console.log(
      color +
        "█ " +
        COLORS.reset +
        COLORS.bold +
        text.padEnd(width - 4) +
        COLORS.reset +
        color +
        " █" +
        COLORS.reset
    );
    console.log(color + "█" + " ".repeat(width - 2) + "█" + COLORS.reset);
    console.log(color + "█".repeat(width) + COLORS.reset + "\n");
  }

  list(items, title = null) {
    if (title) console.log(COLORS.blue + `${title}:` + COLORS.reset);
    items.forEach((item) => {
      console.log(`  ${COLORS.cyan}•${COLORS.reset} ${item}`);
    });
  }

  table(headers, rows) {
    const colWidths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => String(r[i] || "").length))
    );

    const header = headers.map((h, i) => h.padEnd(colWidths[i])).join("  ");

    console.log("\n" + COLORS.bold + header + COLORS.reset);
    console.log(COLORS.dim + "─".repeat(header.length) + COLORS.reset);

    rows.forEach((row) => {
      const line = row.map((cell, i) => String(cell || "").padEnd(colWidths[i])).join("  ");
      console.log(line);
    });
  }

  clear() {
    process.stdout.write("\x1Bc");
  }

  newline() {
    console.log("");
  }
}

export const logger = new Logger();
