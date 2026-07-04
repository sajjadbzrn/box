import { describe, it, expect } from "bun:test";
import { createFormatter } from "../../packages/logger/src/formatters";
import type { LogEntry } from "../../packages/logger/src/types";

function makeEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    level: "info",
    message: "test message",
    timestamp: "2026-07-04T12:34:56.789Z",
    name: "box",
    ...overrides,
  };
}

describe("Pretty formatter", () => {
  it("formats a basic log entry without colors", () => {
    const format = createFormatter({ format: "pretty", colors: false });
    const entry = makeEntry();
    const output = format(entry);

    // Should contain timestamp, level, name, arrow, message
    expect(output).toContain("12:34:56.789");
    expect(output).toContain("[INFO]");
    expect(output).toContain("box");
    expect(output).toContain("→");
    expect(output).toContain("test message");
    expect(output).toEndWith("\n");
  });

  it("includes ANSI color codes when colors are enabled", () => {
    const format = createFormatter({ format: "pretty", colors: true });
    const entry = makeEntry();
    const output = format(entry);

    // Should contain ANSI escape codes
    expect(output).toContain("\x1b[");
    expect(output).toContain("\x1b[0m"); // reset
  });

  it("formats status code with color (2xx green)", () => {
    const format = createFormatter({ format: "pretty", colors: true });
    const entry = makeEntry({ status: 200 });
    const output = format(entry);

    expect(output).toContain("200");
    // Green ANSI code
    expect(output).toContain("\x1b[32m");
  });

  it("formats status code with color (4xx yellow)", () => {
    const format = createFormatter({ format: "pretty", colors: true });
    const entry = makeEntry({ status: 404 });
    const output = format(entry);

    expect(output).toContain("404");
    // Yellow ANSI code
    expect(output).toContain("\x1b[33m");
  });

  it("formats status code with color (5xx red)", () => {
    const format = createFormatter({ format: "pretty", colors: true });
    const entry = makeEntry({ status: 500 });
    const output = format(entry);

    expect(output).toContain("500");
    // Red ANSI code
    expect(output).toContain("\x1b[31m");
  });

  it("includes duration in milliseconds", () => {
    const format = createFormatter({ format: "pretty", colors: false });
    const entry = makeEntry({ duration: 42 });
    const output = format(entry);

    expect(output).toContain("42ms");
  });

  it("formats duration over 1 second in seconds", () => {
    const format = createFormatter({ format: "pretty", colors: false });
    const entry = makeEntry({ duration: 2500 });
    const output = format(entry);

    expect(output).toContain("2.50s");
  });

  it("includes HTTP method and path", () => {
    const format = createFormatter({ format: "pretty", colors: false });
    const entry = makeEntry({ method: "GET", path: "/api/users" });
    const output = format(entry);

    expect(output).toContain("GET");
    expect(output).toContain("/api/users");
  });

  it("includes inline metadata", () => {
    const format = createFormatter({ format: "pretty", colors: false });
    const entry = makeEntry({ meta: { userId: 42, role: "admin" } });
    const output = format(entry);

    expect(output).toContain('"userId"');
    expect(output).toContain("42");
    expect(output).toContain('"role"');
    expect(output).toContain('"admin"');
  });

  it("includes error stack trace on a new line", () => {
    const format = createFormatter({ format: "pretty", colors: false });
    const err = new Error("something broke");
    const entry = makeEntry({ error: err, level: "error" });
    const output = format(entry);

    expect(output).toContain("Error: something broke");
    expect(output).toContain("\n  Error:");
  });

  it("handles different log levels with correct labels", () => {
    const format = createFormatter({ format: "pretty", colors: false });
    const levels: Array<LogEntry["level"]> = ["debug", "info", "warn", "error", "fatal"];
    const labels = ["[DBUG]", "[INFO]", "[WARN]", "[EROR]", "[FATL]"];

    for (let i = 0; i < levels.length; i++) {
      const output = format(makeEntry({ level: levels[i] }));
      expect(output).toContain(labels[i]);
    }
  });

  it("handles empty metadata gracefully", () => {
    const format = createFormatter({ format: "pretty", colors: false });
    const entry = makeEntry({ meta: {} });
    const output = format(entry);

    expect(output).toContain("test message");
    // Should not add extra spaces for empty meta
    expect(output).not.toContain("{}");
  });
});

describe("JSON formatter", () => {
  it("outputs valid JSON", () => {
    const format = createFormatter({ format: "json", colors: false });
    const entry = makeEntry();
    const output = format(entry);

    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("test message");
    expect(parsed.name).toBe("box");
    expect(parsed.timestamp).toBe("2026-07-04T12:34:56.789Z");
  });

  it("ends with a newline", () => {
    const format = createFormatter({ format: "json", colors: false });
    const output = format(makeEntry());

    expect(output).toEndWith("\n");
  });

  it("includes optional fields when present", () => {
    const format = createFormatter({ format: "json", colors: false });
    const entry = makeEntry({
      method: "POST",
      path: "/users",
      status: 201,
      duration: 150,
      meta: { userId: 1 },
    });
    const output = format(entry);
    const parsed = JSON.parse(output);

    expect(parsed.method).toBe("POST");
    expect(parsed.path).toBe("/users");
    expect(parsed.status).toBe(201);
    expect(parsed.duration).toBe(150);
    expect(parsed.meta.userId).toBe(1);
  });

  it("omits optional fields when absent", () => {
    const format = createFormatter({ format: "json", colors: false });
    const entry = makeEntry();
    const output = format(entry);
    const parsed = JSON.parse(output);

    expect(parsed.method).toBeUndefined();
    expect(parsed.path).toBeUndefined();
    expect(parsed.status).toBeUndefined();
    expect(parsed.duration).toBeUndefined();
    expect(parsed.meta).toBeUndefined();
  });

  it("includes error object with message and stack", () => {
    const format = createFormatter({ format: "json", colors: false });
    const err = new Error("test error");
    const entry = makeEntry({ error: err, level: "error" });
    const output = format(entry);
    const parsed = JSON.parse(output);

    expect(parsed.error.message).toBe("test error");
    expect(parsed.error.stack).toBeDefined();
    expect(parsed.error.stack).toContain("Error: test error");
  });

  it("does not include ANSI escape codes", () => {
    const format = createFormatter({ format: "json", colors: true });
    const entry = makeEntry();
    const output = format(entry);

    expect(output).not.toContain("\x1b");
  });

  it("includes duration field even when 0", () => {
    const format = createFormatter({ format: "json", colors: false });
    const entry = makeEntry({ duration: 0 });
    const output = format(entry);
    const parsed = JSON.parse(output);

    expect(parsed.duration).toBe(0);
  });

  it("includes status field even when 0", () => {
    const format = createFormatter({ format: "json", colors: false });
    // Status 0 shouldn't happen in practice, but test edge case
    const entry = makeEntry({ status: 0 });
    const output = format(entry);
    const parsed = JSON.parse(output);

    expect(parsed.status).toBe(0);
  });
});
