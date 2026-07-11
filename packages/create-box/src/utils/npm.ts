import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT = 5000;

function getCachePath(): string {
  const dir = join(tmpdir(), ".create-boxfw-cache");
  mkdirSync(dir, { recursive: true });
  return join(dir, "boxfw-version.json");
}

function readCache(): string | null {
  try {
    const p = getCachePath();
    if (!existsSync(p)) return null;
    const data = JSON.parse(readFileSync(p, "utf-8")) as { version: string; ts: number };
    if (Date.now() - data.ts < CACHE_TTL) return data.version;
  } catch {}
  return null;
}

function writeCache(version: string): void {
  try {
    writeFileSync(getCachePath(), JSON.stringify({ version, ts: Date.now() }));
  } catch {}
}

function readInstalledVersion(): string | null {
  try {
    const pkgPath = join(import.meta.dirname, "..", "node_modules", "boxfw-core", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
    if (pkg.version) return pkg.version;
  } catch {}
  return null;
}

async function fetchLatestVersion(): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch("https://registry.npmjs.org/boxfw-core/latest", {
      signal: ctrl.signal,
    });
    if (res.ok) {
      const data = (await res.json()) as { version: string };
      return data.version;
    }
  } catch {
  } finally {
    clearTimeout(timer);
  }
  return null;
}

export async function resolveLatestVersion(): Promise<string> {
  const cached = readCache();
  if (cached) return cached;

  const remote = await fetchLatestVersion();
  if (remote) {
    writeCache(remote);
    return remote;
  }

  const local = readInstalledVersion();
  if (local) return local;

  return "0.2.1";
}
