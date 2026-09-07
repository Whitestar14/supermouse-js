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
  readonly update?: (...args: any[]) => void;
  readonly [key: string]: unknown;
}

interface AppLike {
  readonly plugins?: readonly PluginLike[];
  readonly options?: Readonly<Record<string, unknown>>;
  readonly state?: {
    readonly cursorMode?: "auto" | "custom" | "native" | "both";
    readonly hasReceivedInput?: boolean;
  };
  readonly input?: {
    readonly isEnabled?: boolean;
  };
}

const BRAND = "[supermouse] doctor";

const S = {
  brand:
    "color: #ffffff; background: #42b883; padding: 2px 4px; border-radius: 2px; font-weight: 700;",
  error:
    "color: #ffffff; background: #f43f5e; padding: 2px 4px; border-radius: 2px; font-weight: 700;",
  warn: "color: #1f2937; background: #f59e0b; padding: 2px 4px; border-radius: 2px; font-weight: 700;",
  info: "color: #ffffff; background: #3b82f6; padding: 2px 4px; border-radius: 2px; font-weight: 700;",
  dim: "color: #6b7280;",
  code: "color: #a1a1aa; font-weight: 500;",
  hint: "color: #10b981; font-weight: 600;"
} as const;

export function doctor(app?: any): void {
  const issues = app ? audit(app) : scanDom();
  printReport(issues);
}

function audit(app: any): readonly DoctorIssue[] {
  const plugins = app.plugins ?? [];
  const opts = app.options ?? {};

  return [
    ...checkPluginPriorities(plugins),
    ...checkStatesPriority(plugins),
    ...checkGhostElements(plugins),
    ...checkMultiInstance(opts),
    ...checkContainerPosition(opts),
    ...checkCursorMode(opts, app.state),
    ...scanDom(app)
  ];
}

function isVisualPlugin(plugin: PluginLike): boolean {
  if (plugin.element !== undefined) return true;
  if (typeof plugin.update === "function" && plugin.update.length >= 3) return true;
  return false;
}

function isLogicPlugin(plugin: PluginLike): boolean {
  if (plugin.element !== undefined) return false;
  if (typeof plugin.update === "function" && plugin.update.length === 2) return true;
  return false;
}

function checkPluginPriorities(plugins: readonly PluginLike[]): readonly DoctorIssue[] {
  const out: DoctorIssue[] = [];

  for (const p of plugins) {
    const name = p.name ?? "unknown";
    const pri = p.priority ?? 0;

    if (isLogicPlugin(p) && pri >= 0) {
      out.push({
        severity: "warn",
        code: "PRIORITY_LOGIC",
        message: `Plugin "${name}" has priority ${pri} but appears to be a logic plugin (should run before physics).`,
        hint: `Set priority to a negative value (e.g. -10) on "${name}"`
      });
    }

    if (isVisualPlugin(p) && pri < 0) {
      out.push({
        severity: "warn",
        code: "PRIORITY_VISUAL",
        message: `Plugin "${name}" has priority ${pri} but appears to be a visual plugin (should run after physics).`,
        hint: "Remove priority or use a positive value"
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
    if (isVisualPlugin(p) && !p.element) {
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

function checkCursorMode(
  opts: Readonly<Record<string, unknown>>,
  state?: AppLike["state"]
): readonly DoctorIssue[] {
  const cursor = opts.cursor;
  if (cursor === undefined) return [];

  const validModes = ["auto", "custom", "native", "both"];
  if (typeof cursor === "string" && !validModes.includes(cursor)) {
    return [
      {
        severity: "error",
        code: "INVALID_CURSOR_MODE",
        message: `Invalid cursor mode "${cursor}". Expected one of: ${validModes.join(", ")}.`,
        hint: `Set cursor to one of: ${validModes.join(", ")}`
      }
    ];
  }

  if (cursor === "both" && opts.container !== document.body && state?.cursorMode === "both") {
    return [
      {
        severity: "warn",
        code: "NESTED_BOTH_MODE",
        message:
          "Scoped instance uses cursor: 'both'. In nested scopes, the native cursor may be hidden by the outer instance's cursor suppression.",
        hint: "Offset the custom cursor when cursorMode === 'both' or consider a single-instance scope architecture"
      }
    ];
  }

  return [];
}

function scanDom(app?: AppLike): readonly DoctorIssue[] {
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

  const bodyInstance = document.querySelector(".supermouse-scope-0");
  if (bodyInstance) {
    const hasHideClass = bodyInstance.classList.contains("supermouse-hide-0");
    const cursorMode = app?.state?.cursorMode ?? "auto";
    const hasReceivedInput = app?.state?.hasReceivedInput ?? true;
    const inputEnabled = app?.input?.isEnabled ?? true;

    if (cursorMode === "custom" && inputEnabled && hasReceivedInput && !hasHideClass) {
      out.push({
        severity: "warn",
        code: "BODY_CURSOR_LEAK",
        message:
          "Body instance has cursor: 'custom' but native cursor suppression class is not applied.",
        hint: "Check that the animation loop is running and setCursor('custom') was called"
      });
    }
  }

  return out;
}

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
