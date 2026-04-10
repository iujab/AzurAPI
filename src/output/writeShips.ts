import fs from "fs";
import path from "path";
import type { Ship } from "../schema/output/ship.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WriteShipsOptions {
  /** Output file path. Default: "data/ships.json" */
  outputPath?: string;
  /** Pretty-print with 2-space indent. Default: true */
  pretty?: boolean;
}

// ---------------------------------------------------------------------------
// writeShips
// ---------------------------------------------------------------------------

/**
 * Serialize a Ship array to the historical AzurAPI dict format:
 * { "077": {...Belfast...}, "20212": {...}, ... }
 *
 * Keyed by ship.id, sorted numerically for deterministic output.
 */
export function writeShips(ships: Ship[], options?: WriteShipsOptions): void {
  const outputPath = options?.outputPath ?? "data/ships.json";
  const pretty = options?.pretty !== false; // default true

  // Convert array to dict keyed by id, sorted by id numerically
  const sorted = [...ships].sort((a, b) => Number(a.id) - Number(b.id));
  const dict: Record<string, Ship> = {};
  for (const ship of sorted) {
    dict[ship.id] = ship;
  }

  const json = pretty
    ? JSON.stringify(dict, null, 2)
    : JSON.stringify(dict);

  const dir = path.dirname(path.resolve(outputPath));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, json, "utf-8");
}
