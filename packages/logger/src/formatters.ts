import type { LogEntry, LogFormat } from "./types";

// ─── Color utilities ──────────────────────────────────────────────

type ColorCode = (str: string) => string;

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  bgRed: "\x1b[41m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
};

function color(code: string): ColorCode {
  return (str: string) => `${code}${str}${ANSI.reset}`;
}

const colors = {
  red: color(ANSI.red),
  green: color(ANSI.green),
  yellow: color(ANSI.yellow),
  blue: color(ANSI.blue),
  magenta: color(ANSI.magenta),
  cyan: color(ANSI.cyan),
  gray: color(ANSI.gray),
  bold: color(ANSI.bold),
  dim: color(ANSI.dim),
};

// ─── Level styling ────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, { label: string; color: ColorCode; bg: string }> = {
  debug: { label: "DBUG", color: colors.gray, bg: "" },
  info: { label: "INFO", color: colors.blue, bg: "" },
  warn: { label: "WARN", color: colors.yellow, bg: ANSI.bgYellow },
  error: { label: "EROR", color: colors.red, bg: ANSI.bgRed },
  fatal: { label: "FATL", color: colors.red, bg: ANSI.bgRed },
};

const STATUS_COLORS: Record<string, ColorCode> = {
  "2": colors.green,
  "3": colors.cyan,
  "4": colors.yellow,
  "5": colors.red,
};

function statusColor(code: number): ColorCode {
  const prefix = String(code)[0]!;
  return STATUS_COLORS[prefix] ?? colors.gray;
}

// ─── Timestamp ────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  // "2026-07-04T12:34:56.789Z" → "12:34:56.789"
  return iso.slice(11, 23);
}

// ─── Pretty formatter ─────────────────────────────────────────────

function formatPretty(entry: LogEntry, useColors: boolean): string {
  const ts = formatTimestamp(entry.timestamp);
  const levelStyle = LEVEL_STYLES[entry.level] ?? LEVEL_STYLES.info!;

  const levelTag = useColors
    ? `${levelStyle.bg}${ANSI.bold} ${levelStyle.label} ${ANSI.reset}`
    : `[${levelStyle.label}]`;

  const nameTag = useColors ? colors.dim(entry.name) : entry.name;
  const arrow = useColors ? colors.dim("→") : "→";
  const message = entry.message;

  // Status code with color
  let statusPart = "";
  if (entry.status !== undefined) {
    const sc = statusColor(entry.status);
    statusPart = useColors ? sc(String(entry.status)) : String(entry.status);
  }

  // Duration
  let durationPart = "";
  if (entry.duration !== undefined) {
    const dur = entry.duration >= 1000
      ? `${(entry.duration / 1000).toFixed(2)}s`
      : `${entry.duration}ms`;
    durationPart = useColors ? colors.dim(dur) : dur;
  }

  // Method + path
  let reqPart = "";
  if (entry.method && entry.path) {
    const methodColored = useColors ? colors.magenta(entry.method) : entry.method;
    const pathColored = useColors ? colors.cyan(entry.path) : entry.path;
    reqPart = `${methodColored} ${pathColored}`;
  }

  // Error (stack trace on a new line)
  let errorPart = "";
  if (entry.error) {
    const errMsg = entry.error.stack ?? entry.error.message;
    errorPart = useColors
      ? `\n  ${colors.red(errMsg)}`
      : `\n  ${errMsg}`;
  }

  // Meta (JSON inline)
  let metaPart = "";
  if (entry.meta && Object.keys(entry.meta).length > 0) {
    const metaStr = safeStringify(entry.meta);
    metaPart = useColors ? ` ${colors.dim(metaStr)}` : ` ${metaStr}`;
  }

  // Assemble parts
  const parts = [
    useColors ? colors.dim(ts) : ts,
    levelTag,
    nameTag,
    arrow,
    message,
  ];

  if (reqPart) parts.push(reqPart);
  if (statusPart) parts.push(statusPart);
  if (durationPart) parts.push(durationPart);

  let line = parts.join(" ");

  if (metaPart) line += metaPart;
  if (errorPart) line += errorPart;

  return line + "\n";
}

// ─── JSON formatter ───────────────────────────────────────────────

function formatJson(entry: LogEntry): string {
  const obj: Record<string, unknown> = {
    level: entry.level,
    message: entry.message,
    timestamp: entry.timestamp,
    name: entry.name,
  };

  if (entry.method) obj.method = entry.method;
  if (entry.path) obj.path = entry.path;
  if (entry.status !== undefined) obj.status = entry.status;
  if (entry.duration !== undefined) obj.duration = entry.duration;
  if (entry.meta && Object.keys(entry.meta).length > 0) {
    obj.meta = entry.meta;
  }
  if (entry.error) {
    obj.error = {
      message: entry.error.message,
      stack: entry.error.stack,
    };
  }

  return JSON.stringify(obj) + "\n";
}

// ─── Public API ───────────────────────────────────────────────────

export interface FormatterOptions {
  format: LogFormat;
  colors: boolean;
}

/**
 * Create a log entry formatter based on the configuration.
 */
export function createFormatter(opts: FormatterOptions): (entry: LogEntry) => string {
  return (entry: LogEntry) => {
    if (opts.format === "json") {
      return formatJson(entry);
    }
    return formatPretty(entry, opts.colors);
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return "[Circular]";
  }
}
