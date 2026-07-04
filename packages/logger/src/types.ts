/**
 * Log levels ordered by severity (lowest → highest).
 */
export const LOG_LEVELS = ["debug", "info", "warn", "error", "fatal"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

/**
 * Numeric severity mapping for level filtering.
 */
export const LOG_LEVEL_NUMBERS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

/**
 * Output format for the logger.
 * - "pretty": human-readable colored output (development)
 * - "json": structured JSON lines (production / log aggregation)
 */
export type LogFormat = "pretty" | "json";

/**
 * Configuration options for `createLogger()`.
 */
export interface LoggerOptions {
  /**
   * Minimum log level to output. Default: `"info"`.
   */
  level?: LogLevel;

  /**
   * Output format. Default: `"pretty"`.
   */
  format?: LogFormat;

  /**
   * Enable ANSI colors (pretty mode only). Default: `true`.
   */
  colors?: boolean;

  /**
   * Application name to include in logs. Default: `"box"`.
   */
  name?: string;

  /**
   * Custom output stream. Default: `process.stdout`.
   */
  stream?: { write: (text: string) => void };

  /**
   * Include timestamp in logs. Default: `true`.
   */
  timestamp?: boolean;

  /**
   * Include caller file/line info (pretty mode, development). Default: `false`.
   */
  callerInfo?: boolean;
}

/**
 * A structured log entry before formatting.
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  name: string;
  /** Optional structured metadata */
  meta?: Record<string, unknown>;
  /** Error object (logged separately for stack trace) */
  error?: Error;
  /** Duration in milliseconds (for request logs) */
  duration?: number;
  /** HTTP method (for request logs) */
  method?: string;
  /** Request path (for request logs) */
  path?: string;
  /** HTTP status code (for request logs) */
  status?: number;
}

/**
 * Configuration for the `requestLogger()` middleware.
 */
export interface RequestLoggerOptions {
  /**
   * Logger instance to use. If omitted, a default one is created.
   */
  logger?: LoggerInterface;

  /**
   * Log level for successful requests (status < 400). Default: `"info"`.
   */
  levelSuccess?: LogLevel;

  /**
   * Log level for client errors (400–499). Default: `"warn"`.
   */
  levelClientError?: LogLevel;

  /**
   * Log level for server errors (500+). Default: `"error"`.
   */
  levelServerError?: LogLevel;

  /**
   * Exclude paths from logging (e.g., health checks, metrics).
   */
  excludePaths?: RegExp[];

  /**
   * Log request headers (be careful with sensitive data). Default: `false`.
   */
  logHeaders?: boolean;

  /**
   * Log request query parameters. Default: `false`.
   */
  logQuery?: boolean;

  /**
   * Custom function to extract a request ID from the request.
   * Default: generates a short random ID.
   */
  requestId?: (req: Request) => string;
}

/**
 * Logger interface for the Box logger.
 */
export interface LoggerInterface {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  fatal(message: string, meta?: Record<string, unknown>): void;

  /** Log with explicit level. */
  log(level: LogLevel, message: string, meta?: Record<string, unknown>): void;

  /** Create a child logger with bound context. */
  child(bindings: Record<string, unknown>): LoggerInterface;

  /** Flush pending writes (if applicable). */
  flush?(): Promise<void>;
}
