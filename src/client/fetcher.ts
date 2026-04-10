import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { DATA_BASE_URL } from "../config.js";
import type { Ship } from "../schema/output/ship.js";

const DEFAULT_CACHE_DIR = path.join(os.homedir(), ".azurapi");
const DEFAULT_MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours

export interface FetchOptions {
  /** Directory to cache downloaded data. Default: ~/.azurapi */
  cacheDir?: string;
  /** Re-fetch if cache is older than this (ms). Default: 6 hours */
  maxAge?: number;
  /** Base URL for raw data files. Default: GitHub raw URL */
  dataUrl?: string;
}

interface VersionInfo {
  generatedAt: string;
  shipCount: number;
}

interface FetchedData {
  ships: Record<string, Ship>;
  idMap: Record<string, string>;
}

/**
 * Fetch latest data from GitHub, with local cache and baked-data fallback.
 *
 * Flow:
 * 1. If cache exists and is fresh (< maxAge) → load from cache
 * 2. Else fetch version.json from remote → compare with cache
 * 3. If remote is newer → fetch ships.json + id-map.json, write to cache
 * 4. If any fetch fails → fall back to cache, then to null (caller uses baked data)
 */
export async function fetchLatestData(
  options: FetchOptions = {},
): Promise<FetchedData | null> {
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE;
  const baseUrl = options.dataUrl ?? DATA_BASE_URL;

  // Check cache freshness
  const cachedShipsPath = path.join(cacheDir, "ships.json");
  const cachedIdMapPath = path.join(cacheDir, "id-map.json");
  const cachedVersionPath = path.join(cacheDir, "version.json");

  if (isCacheFresh(cachedVersionPath, maxAge)) {
    return loadFromCache(cachedShipsPath, cachedIdMapPath);
  }

  // Fetch remote version
  let remoteVersion: VersionInfo | null = null;
  try {
    remoteVersion = await fetchJson<VersionInfo>(`${baseUrl}/version.json`);
  } catch {
    // Network error — try cache regardless of age
    return loadFromCache(cachedShipsPath, cachedIdMapPath);
  }

  // Compare with cached version
  if (remoteVersion && isCacheUpToDate(cachedVersionPath, remoteVersion)) {
    // Touch the cache file to reset maxAge timer
    touchFile(cachedVersionPath);
    return loadFromCache(cachedShipsPath, cachedIdMapPath);
  }

  // Fetch fresh data
  try {
    const [ships, idMap] = await Promise.all([
      fetchJson<Record<string, Ship>>(`${baseUrl}/ships.json`),
      fetchJson<Record<string, string>>(`${baseUrl}/id-map.json`),
    ]);

    if (!ships || !idMap) {
      return loadFromCache(cachedShipsPath, cachedIdMapPath);
    }

    // Write to cache atomically
    writeCache(cacheDir, {
      "ships.json": ships,
      "id-map.json": idMap,
      "version.json": remoteVersion,
    });

    return { ships, idMap };
  } catch {
    return loadFromCache(cachedShipsPath, cachedIdMapPath);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return (await res.json()) as T;
}

function isCacheFresh(versionPath: string, maxAge: number): boolean {
  try {
    const stat = fs.statSync(versionPath);
    return Date.now() - stat.mtimeMs < maxAge;
  } catch {
    return false;
  }
}

function isCacheUpToDate(
  versionPath: string,
  remote: VersionInfo,
): boolean {
  try {
    const cached = JSON.parse(
      fs.readFileSync(versionPath, "utf8"),
    ) as VersionInfo;
    return cached.generatedAt === remote.generatedAt;
  } catch {
    return false;
  }
}

function touchFile(filePath: string): void {
  try {
    const now = new Date();
    fs.utimesSync(filePath, now, now);
  } catch { /* ignore */ }
}

function loadFromCache(
  shipsPath: string,
  idMapPath: string,
): FetchedData | null {
  try {
    if (!fs.existsSync(shipsPath) || !fs.existsSync(idMapPath)) return null;
    const ships = JSON.parse(fs.readFileSync(shipsPath, "utf8")) as Record<string, Ship>;
    const idMap = JSON.parse(fs.readFileSync(idMapPath, "utf8")) as Record<string, string>;
    return { ships, idMap };
  } catch {
    return null;
  }
}

function writeCache(
  cacheDir: string,
  files: Record<string, unknown>,
): void {
  fs.mkdirSync(cacheDir, { recursive: true });
  for (const [name, data] of Object.entries(files)) {
    const target = path.join(cacheDir, name);
    const tmp = target + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
    fs.renameSync(tmp, target); // atomic on most filesystems
  }
}
