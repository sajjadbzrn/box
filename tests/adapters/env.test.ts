import { describe, expect, it } from "bun:test";
import { bunEnv, workerEnv } from "../../packages/adapters/src/index";
import type { EnvStore } from "../../packages/core/src/types";

describe("bunEnv", () => {
  it("returns an EnvStore that reads from process.env", () => {
    const store = bunEnv();
    expect(store.get).toBeFunction();
  });

  it("returns undefined for missing keys", () => {
    const store = bunEnv();
    expect(store.get("__BOX_NONEXISTENT_KEY_12345__")).toBeUndefined();
  });

  it("reads existing env vars", () => {
    const store = bunEnv();
    const keys = Object.keys(process.env);
    if (keys.length > 0) {
      const val = store.get(keys[0]!);
      expect(val).toBeString();
    }
  });
});

describe("workerEnv", () => {
  const bindings = {
    DB: { prepare: () => {} },
    KV: { get: async () => "value" },
    SECRET_KEY: "my-secret",
    APP_ENV: "production",
  };

  it("reads string bindings", () => {
    const store = workerEnv(bindings);
    expect(store.get("APP_ENV")).toBe("production");
    expect(store.get("SECRET_KEY")).toBe("my-secret");
  });

  it("reads object bindings (D1, KV, R2)", () => {
    const store = workerEnv(bindings);
    const db = store.get("DB");
    expect(db).toBeDefined();
    expect(typeof db).toBe("object");

    const kv = store.get("KV");
    expect(kv).toBeDefined();
  });

  it("returns undefined for missing keys", () => {
    const store = workerEnv(bindings);
    expect(store.get("NONEXISTENT")).toBeUndefined();
  });
});

describe("EnvStore interface compatibility", () => {
  it("both bunEnv and workerEnv satisfy the EnvStore interface", () => {
    const bun: EnvStore = bunEnv();
    const worker: EnvStore = workerEnv({ KEY: "val" });

    // They should both have a get method
    expect(typeof bun.get).toBe("function");
    expect(typeof worker.get).toBe("function");

    // worker env should return the value
    expect(worker.get("KEY")).toBe("val");
  });
});
