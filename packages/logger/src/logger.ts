import { createFormatter } from "./formatters";
import type { LogEntry, LoggerInterface, LoggerOptions, LogLevel } from "./types";
import { LOG_LEVEL_NUMBERS } from "./types";

/**
 * Box Logger — a structured logger for the Box framework.
 *
 * Features:
 * - Log levels: debug, info, warn, error, fatal
 * - Pretty console output with ANSI colors (development)
 * - Structured JSON output (production / log aggregation)
 * - Child loggers with bound context
 * - Level-based filtering
 *
 * @example
 * ```ts
 * import { createLogger } from "boxfw-logger";
 *
 * const log = createLogger({ level: "debug" });
 * log.info("Server started", { port: 3000 });
 * log.error("Database connection failed", { error: err });
 * ```
 */
export class Logger implements LoggerInterface {
  private name: string;
  private level: LogLevel;
  private format: "pretty" | "json";
  private useColors: boolean;
  private formatEntry: (entry: LogEntry) => string;
  private stream: { write: (text: string) => void };
  private bindings: Record<string, unknown>;
  private includeTimestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.name = options.name ?? "box";
    this.level = options.level ?? "info";
    this.format = options.format ?? "pretty";
    this.useColors = options.format !== "json" && (options.colors ?? true);
    this.stream = options.stream ?? process.stdout;
    this.bindings = {};
    this.includeTimestamp = options.timestamp ?? true;

    this.formatEntry = createFormatter({
      format: this.format,
      colors: this.useColors,
    });
  }

  /**
   * Create a child logger that inherits the parent's configuration
   * and adds bound context to every log entry.
   */
  child(bindings: Record<string, unknown>): LoggerInterface {
    const child = new Logger({
      name: this.name,
      level: this.level,
      format: this.format,
      colors: this.useColors,
      stream: this.stream,
      timestamp: this.includeTimestamp,
    });
    child.bindings = { ...this.bindings, ...bindings };
    return child;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write("error", message, meta);
  }

  fatal(message: string, meta?: Record<string, unknown>): void {
    this.write("fatal", message, meta);
  }

  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    this.write(level, message, meta);
  }

  /**
   * Flush pending writes (no-op for stdout, useful for file streams).
   */
  async flush(): Promise<void> {
    // Stdout doesn't need flushing, but keep for API compatibility
  }

  // ─── Private ──────────────────────────────────────────────────

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_NUMBERS[level] >= LOG_LEVEL_NUMBERS[this.level];
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    // Separate error from meta
    let error: Error | undefined;
    let cleanMeta = meta;

    if (meta?.error instanceof Error) {
      error = meta.error as Error;
      cleanMeta = { ...meta };
      delete (cleanMeta as Record<string, unknown>).error;
    }

    // Merge bindings
    const mergedMeta =
      cleanMeta && Object.keys(cleanMeta).length > 0
        ? { ...this.bindings, ...cleanMeta }
        : Object.keys(this.bindings).length > 0
          ? { ...this.bindings }
          : undefined;

    const entry: LogEntry = {
      level,
      message,
      timestamp: this.includeTimestamp ? new Date().toISOString() : "",
      name: this.name,
      meta: mergedMeta,
      error,
    };

    const formatted = this.formatEntry(entry);
    this.stream.write(formatted);
  }
}

/**
 * Create a new Box logger instance.
 *
 * @example
 * ```ts
 * // Pretty output for development
 * const log = createLogger({ level: "debug" });
 *
 * // JSON output for production
 * const log = createLogger({ format: "json", level: "info" });
 * ```
 */
export function createLogger(options: LoggerOptions = {}): LoggerInterface {
  return new Logger(options);
}
