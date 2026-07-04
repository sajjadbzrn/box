import { describe, it, expect } from "bun:test";
import { createLogger, Logger } from "../../packages/logger/src/logger";

/**
 * Helper: create a writable stream that captures all writes into an array.
 */
function captureStream(): {
  stream: { write: (text: string) => void };
  lines: string[];
} {
  const lines: string[] = [];
  const stream = {
    write(text: string) {
      lines.push(text);
    },
  };
  return { stream, lines };
}

describe("Logger", () => {
  it("creates a logger with default options", () => {
    const log = createLogger();
    expect(log).toBeInstanceOf(Logger);
    expect(log.flush).toBeDefined();
  });

  it("writes log output to the provided stream", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "info", colors: false, timestamp: false });

    log.info("hello world");

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("hello world");
    expect(lines[0]).toContain("[INFO]");
  });

  it("filters out messages below the configured level", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "warn", colors: false, timestamp: false });

    log.debug("should not appear");
    log.info("should not appear either");
    log.warn("warning message");
    log.error("error message");

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("warning message");
    expect(lines[1]).toContain("error message");
  });

  it("logs at all levels with correct labels", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });

    log.debug("debug msg");
    log.info("info msg");
    log.warn("warn msg");
    log.error("error msg");
    log.fatal("fatal msg");

    expect(lines.length).toBe(5);
    expect(lines[0]).toContain("[DBUG]");
    expect(lines[1]).toContain("[INFO]");
    expect(lines[2]).toContain("[WARN]");
    expect(lines[3]).toContain("[EROR]");
    expect(lines[4]).toContain("[FATL]");
  });

  it("supports log() with explicit level", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "debug", colors: false, timestamp: false });

    log.log("debug", "explicit debug");
    log.log("error", "explicit error");

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("[DBUG]");
    expect(lines[1]).toContain("[EROR]");
  });

  it("includes timestamp when enabled", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "info", colors: false, timestamp: true });

    log.info("timestamped");

    expect(lines.length).toBe(1);
    // Should have a time pattern like HH:MM:SS.mmm
    expect(lines[0]).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
  });

  it("excludes timestamp when disabled", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "info", colors: false, timestamp: false });

    log.info("no timestamp");

    expect(lines.length).toBe(1);
    expect(lines[0]).toMatch(/^ \[INFO\]/);
  });

  it("includes metadata in the output", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "info", colors: false, timestamp: false });

    log.info("with meta", { userId: 42, role: "admin" });

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("userId");
    expect(lines[0]).toContain("42");
    expect(lines[0]).toContain("admin");
  });

  it("extracts error from meta and includes stack trace", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "error", colors: false, timestamp: false });

    const err = new Error("test error");
    log.error("something broke", { error: err });

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("test error");
    expect(lines[0]).toContain("Error: test error");
  });

  it("uses application name in log output", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "info", name: "my-app", colors: false, timestamp: false });

    log.info("named");

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("my-app");
  });

  it("defaults name to 'box'", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "info", colors: false, timestamp: false });

    log.info("default name");

    expect(lines[0]).toContain("box");
  });
});

describe("Logger — JSON format", () => {
  it("outputs structured JSON when format is 'json'", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({
      stream,
      level: "info",
      format: "json",
      name: "test-app",
      timestamp: false,
    });

    log.info("json log", { key: "value" });

    expect(lines.length).toBe(1);
    const parsed = JSON.parse(lines[0]);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("json log");
    expect(parsed.name).toBe("test-app");
    expect(parsed.meta).toEqual({ key: "value" });
    expect(parsed.timestamp).toBe("");
  });

  it("JSON format includes error details", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({
      stream,
      level: "error",
      format: "json",
      timestamp: false,
    });

    const err = new Error("boom");
    log.error("failed", { error: err });

    const parsed = JSON.parse(lines[0]);
    expect(parsed.error.message).toBe("boom");
    expect(parsed.error.stack).toBeDefined();
  });

  it("JSON format does not use ANSI colors", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({
      stream,
      level: "info",
      format: "json",
      colors: true,
      timestamp: false,
    });

    log.info("clean output");

    expect(lines[0]).not.toContain("\x1b");
  });
});

describe("Logger — child loggers", () => {
  it("child logger inherits parent config", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "debug", name: "parent", colors: false, timestamp: false });
    const child = log.child({ requestId: "abc-123" });

    child.info("from child");

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("parent");
    expect(lines[0]).toContain("requestId");
    expect(lines[0]).toContain("abc-123");
  });

  it("child logger bindings are included in every log call", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "info", colors: false, timestamp: false });
    const child = log.child({ requestId: "req-1", userId: "u-42" });

    child.info("first");
    child.warn("second");

    expect(lines.length).toBe(2);
    expect(lines[0]).toContain("req-1");
    expect(lines[0]).toContain("u-42");
    expect(lines[1]).toContain("req-1");
    expect(lines[1]).toContain("u-42");
  });

  it("child can override parent bindings", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "info", colors: false, timestamp: false });
    const child = log.child({ requestId: "original" });
    const grandchild = child.child({ requestId: "overridden" });

    grandchild.info("overridden binding");

    expect(lines[0]).toContain("overridden");
    expect(lines[0]).not.toContain("original");
  });

  it("child respects parent level filtering", () => {
    const { stream, lines } = captureStream();
    const log = createLogger({ stream, level: "error", colors: false, timestamp: false });
    const child = log.child({ requestId: "r-1" });

    child.info("should be filtered");
    child.error("should appear");

    expect(lines.length).toBe(1);
    expect(lines[0]).toContain("should appear");
  });
});

describe("Logger — flush", () => {
  it("flush resolves without error", async () => {
    const log = createLogger({ level: "info" });
    await log.flush!();
    expect(true).toBe(true);
  });
});

describe("createLogger", () => {
  it("returns a LoggerInterface", () => {
    const log = createLogger();
    expect(log.debug).toBeFunction();
    expect(log.info).toBeFunction();
    expect(log.warn).toBeFunction();
    expect(log.error).toBeFunction();
    expect(log.fatal).toBeFunction();
    expect(log.log).toBeFunction();
    expect(log.child).toBeFunction();
  });
});
