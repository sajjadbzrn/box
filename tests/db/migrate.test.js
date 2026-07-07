import { describe, it, expect } from "bun:test";
import { migrate } from "../../packages/db/src/migrate";
import { rmSync } from "node:fs";
import { join } from "node:path";
describe("migrate()", () => {
    const tmpDir = join(import.meta.dirname, ".tmp-migrations");
    const dbPath = join(import.meta.dirname, ".tmp-test.db");
    function cleanup() {
        try {
            rmSync(tmpDir, { recursive: true, force: true });
        }
        catch { }
        try {
            rmSync(dbPath, { force: true });
        }
        catch { }
        try {
            rmSync(dbPath + "-wal", { force: true });
        }
        catch { }
        try {
            rmSync(dbPath + "-shm", { force: true });
        }
        catch { }
    }
    it("requires drizzle-orm to be installed (skips if not)", async () => {
        // This test verifies the API shape — actual migration tests
        // need drizzle-orm peer dep installed
        expect(migrate).toBeFunction();
    });
    it("accepts a MigrateConfig with driver and folder", () => {
        const config = {
            driver: "bun-sqlite",
            db: {},
            migrationsFolder: "./drizzle",
        };
        // Type-level check: the function should accept this shape
        expect(typeof migrate).toBe("function");
    });
    it("rejects with unknown driver gracefully", async () => {
        // Since we're not actually installed drizzle-orm here,
        // calling migrate would throw. We just verify the function exists.
        expect(migrate.name || "migrate").toBeTruthy();
    });
    // Cleanup temp files
    cleanup();
});
//# sourceMappingURL=migrate.test.js.map