import fs from "node:fs";
import path from "node:path";
import { Ships } from "./ships.js";
import { fetchLatestData, type FetchOptions } from "./fetcher.js";
import type { Ship } from "../schema/output/ship.js";

export interface AzurDataOptions {
  dataPath?: string;
}

export interface AzurDataInitOptions extends FetchOptions {
  /** Fetch latest data from GitHub on startup. Default: true */
  fetchLatest?: boolean;
}

function resolveThisDir(): string {
  // CJS: __dirname is injected by Node
  // ESM under tsx/ts-node: __dirname is polyfilled
  // Pure ESM: falls back to cwd
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore __dirname exists in CJS but not in ESM type defs
    if (typeof __dirname === "string") return __dirname; // eslint-disable-line no-undef
  } catch { /* not CJS */ }
  return process.cwd();
}

export class AzurData {
  readonly ships: Ships;

  /** Sync constructor — loads baked data from disk. No network. */
  constructor(options: AzurDataOptions = {}) {
    const dataDir = options.dataPath ?? AzurData.resolveDefaultDataPath();
    const shipsJson = JSON.parse(
      fs.readFileSync(path.join(dataDir, "ships.json"), "utf8"),
    ) as Record<string, Ship>;
    const idMapJson = JSON.parse(
      fs.readFileSync(path.join(dataDir, "id-map.json"), "utf8"),
    ) as Record<string, string>;
    this.ships = new Ships({ data: shipsJson, idMap: idMapJson });
  }

  /**
   * Async factory — fetches latest data from GitHub, caches locally,
   * falls back to baked data if offline.
   *
   * ```ts
   * const azur = await AzurData.init({ fetchLatest: true });
   * ```
   */
  static async init(options: AzurDataInitOptions = {}): Promise<AzurData> {
    const { fetchLatest = true, ...fetchOpts } = options;

    if (fetchLatest) {
      const fetched = await fetchLatestData(fetchOpts);
      if (fetched) {
        const instance = Object.create(AzurData.prototype) as AzurData;
        (instance as { ships: Ships }).ships = new Ships({
          data: fetched.ships,
          idMap: fetched.idMap,
        });
        return instance;
      }
    }

    // Fallback to baked data
    return new AzurData();
  }

  private static resolveDefaultDataPath(): string {
    const thisDir = resolveThisDir();
    let candidate = thisDir;
    for (let i = 0; i < 5; i++) {
      const dataPath = path.resolve(candidate, "data");
      if (fs.existsSync(path.join(dataPath, "ships.json"))) return dataPath;
      candidate = path.resolve(candidate, "..");
    }
    return path.resolve(process.cwd(), "data");
  }
}
