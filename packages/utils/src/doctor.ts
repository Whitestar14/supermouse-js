// ─── Types ───

export interface DoctorIssue {
  severity: "error" | "warn" | "info";
  code: string;
  message: string;
  hint?: string;
}

interface PluginLike {
  readonly name?: string;
  readonly priority?: number;
  readonly element?: HTMLElement;
  readonly [key: string]: unknown;
}

interface AppLike {
  readonly plugins?: readonly PluginLike[];
  readonly options?: Readonly<Record<string, unknown>>;
}

// ─── Constants ───

const BRAND = "[supermouse] doctor";

const S = {
  brand: "color: #42b883; font-weight: 600;",
  error: "color: #f43f5e; font-weight: 600;",
  warn: "color: #f59e0b; font-weight: 600;",
  info: "color: #3b82f6; font-weight: 600;",
  dim: "color: #6b7280;",
  code: "color: #a1a1aa; font-weight: 500;",
  hint: "color: #10b981;"
} as const;

const LOGIC_RE = /magnetic|stick|gravity|attract|snap|pull|repel|states/i;
const VISUAL_RE = /dot|ring|trail|cursor|icon|text|image|sparkle|glow|blob|spotlight/i;

// ─── Public API ───

/**
 * Supermouse diagnostic tool.
 *
 * Run `doctor(app)` to check priority ordering, plugin hygiene,
 * multi-instance coordination, and common misconfigurations.
 * Call `doctor()` without arguments for a lightweight DOM scan.
 */
export function doctor(app?: AppLike): void {
  const issues = app ? audit(app) : scanDom();
  printReport(issues);
}

// ─── Auditor ───

function audit(app: AppLike): readonly DoctorIssue[] {
  const plugins = app.plugins ?? [];
  const opts = app.options ?? {};

  return [
    ...checkPluginPriorities(plugins),
    ...checkStatesPriority(plugins),
    ...checkGhostElements(plugins),
    ...checkMultiInstance(opts),
    ...checkContainerPosition(opts),
    ...checkCursorPerformance(opts),
    ...scanDom()
  ];
}

function checkPluginPriorities(plugins: readonly PluginLike[]): readonly DoctorIssue[] {
  const out: DoctorIssue[] = [];

  for (const p of plugins) {
    const name = p.name ?? "unknown";
    const pri = p.priority ?? 0;

    if (LOGIC_RE.test(name) && pri >= 0) {
      out.push({
        severity: "warn",
        code: "PRIORITY_LOGIC",
        message: `Plugin "${name}" has priority ${pri} but appears to be a logic plugin (should run before physics).`,
        hint: `Set priority: -10 on "${name}"`
      });
    }

    if (VISUAL_RE.test(name) && pri < 0) {
      out.push({
        severity: "warn",
        code: "PRIORITY_VISUAL",
        message: `Plugin "${name}" has priority ${pri} but appears to be a visual plugin (should run after physics).`,
        hint: `Remove priority or use a positive value`
      });
    }
  }

  return out;
}

function checkStatesPriority(plugins: readonly PluginLike[]): readonly DoctorIssue[] {
  const states = plugins.find((p) => p.name === "states");
  if (!states) return [];

  const pri = states.priority ?? 0;
  if (pri >= 0) {
    return [
      {
        severity: "error",
        code: "STATES_PRIORITY",
        message: `States plugin has priority ${pri}. It must run before all visual plugins.`,
        hint: "Set priority: -999 on the States plugin"
      }
    ];
  }

  return [];
}

function checkGhostElements(plugins: readonly PluginLike[]): readonly DoctorIssue[] {
  const out: DoctorIssue[] = [];

  for (const p of plugins) {
    const name = p.name ?? "unknown";
    if (VISUAL_RE.test(name) && !p.element) {
      out.push({
        severity: "warn",
        code: "MISSING_ELEMENT",
        message: `Plugin "${name}" has no 'element' property — disablePlugin() will not hide its DOM.`,
        hint: "Assign plugin.element = el in install(), or use definePlugin()"
      });
    }
  }

  return out;
}

function checkMultiInstance(opts: Readonly<Record<string, unknown>>): readonly DoctorIssue[] {
  const scopes = document.querySelectorAll('[class*="supermouse-scope-"]');
  if (scopes.length <= 1) return [];
  if (opts.container !== document.body) return [];

  return [
    {
      severity: "warn",
      code: "MULTI_INSTANCE",
      message: `Detected ${scopes.length} Supermouse instances. The body instance may conflict with scoped ones.`,
      hint: "Use suspend() / resume() or scope instances to different containers"
    }
  ];
}

function checkContainerPosition(opts: Readonly<Record<string, unknown>>): readonly DoctorIssue[] {
  const container = opts.container as HTMLElement | undefined;
  if (!container || container === document.body) return [];

  const position = window.getComputedStyle(container).position;
  if (position !== "static") return [];

  return [
    {
      severity: "info",
      code: "CONTAINER_POSITION",
      message: "Container has position:static. Supermouse will mutate it to relative.",
      hint: "Set position: relative in your CSS to avoid the mutation"
    }
  ];
}

function checkCursorPerformance(opts: Readonly<Record<string, unknown>>): readonly DoctorIssue[] {
  if (opts.ignoreOnNative !== "css") return [];
  if (opts.cacheCursorStyle === true) return [];

  return [
    {
      severity: "info",
      code: "CURSOR_PERF",
      message:
        'ignoreOnNative is "css" and cacheCursorStyle is false. Every hover triggers getComputedStyle().',
      hint: "Enable cacheCursorStyle: true if elements rarely change cursor"
    }
  ];
}

// ─── DOM scan ───

function scanDom(): readonly DoctorIssue[] {
  const out: DoctorIssue[] = [];

  const isInitialized = Array.from(document.querySelectorAll("style")).some((s) =>
    s.id.startsWith("supermouse-style-")
  );

  if (!isInitialized) {
    return [
      {
        severity: "error",
        code: "NOT_INITIALIZED",
        message: "Supermouse has not been initialized yet.",
        hint: "Call doctor() after new Supermouse() has run"
      }
    ];
  }

  document.querySelectorAll('[style*="cursor"]').forEach((el) => {
    const style = el.getAttribute("style") ?? "";
    if (style.includes("cursor: none")) return;
    if (!style.includes("cursor")) return;

    out.push({
      severity: "warn",
      code: "INLINE_CURSOR",
      message: "Element has an inline cursor style that may override Supermouse.",
      hint: "Remove inline cursor styles"
    });
  });

  if (document.body.style.cursor !== "none") {
    const hasBodyInstance = !!document.querySelector(".supermouse-scope-0");
    if (hasBodyInstance) {
      out.push({
        severity: "warn",
        code: "BODY_CURSOR_LEAK",
        message: 'document.body.style.cursor is not "none". The native cursor may show through.',
        hint: "Ensure hideCursor: true on the body-level instance"
      });
    }
  }

  return out;
}

// ─── Reporter ───

function printReport(issues: readonly DoctorIssue[]): void {
  if (issues.length === 0) {
    console.log(`%c${BRAND}%c No issues found`, S.brand, S.dim);
    return;
  }

  const summary = [
    formatCount(issues, "error", "error"),
    formatCount(issues, "warn", "warning"),
    formatCount(issues, "info", "note")
  ]
    .filter((s): s is string => s !== null)
    .join(" · ");

  console.log(`%c${BRAND}%c ${summary}`, S.brand, S.dim);

  for (const issue of issues) {
    printIssue(issue);
  }
}

function formatCount(
  issues: readonly DoctorIssue[],
  severity: DoctorIssue["severity"],
  label: string
): string | null {
  const n = issues.filter((i) => i.severity === severity).length;
  return n > 0 ? `${n} ${label}${n > 1 ? "s" : ""}` : null;
}

function printIssue(issue: DoctorIssue): void {
  console.log(
    `%c${issue.severity.toUpperCase()}%c %c${issue.code}%c ${issue.message}`,
    S[issue.severity],
    S.dim,
    S.code,
    "color: inherit;"
  );

  if (issue.hint) {
    console.log(`  %c→%c ${issue.hint}`, S.hint, S.dim);
  }
}
