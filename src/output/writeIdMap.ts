import fs from "fs";
import path from "path";
import type { Ship } from "../schema/output/ship.js";
import type { IdMap } from "../schema/output/ship.js";

// ---------------------------------------------------------------------------
// writeIdMap
// ---------------------------------------------------------------------------

/**
 * Write a name/alias → canonical id map to disk.
 *
 * Shape: Record<string, string>
 *
 * For each ship: emits names.en → id, names.cn → id, names.jp → id, names.code → id
 * For each groupRow: emits padded code → group_type string (legacy AzurAPI lookup)
 *
 * Last-writer-wins for duplicate names.
 */
export function writeIdMap(
  ships: Ship[],
  groupRows: Array<{ code: number; group_type: number }>,
  outputPath = "data/id-map.json",
): void {
  const map: IdMap = {};

  // Collect all EN names first so we don't let names.code overwrite a real ship name
  const enNames = new Set<string>();
  for (const ship of ships) {
    if (ship.names.en !== undefined) enNames.add(ship.names.en);
  }

  // Per-ship name entries (first-writer-wins for code names to avoid collisions)
  for (const ship of ships) {
    const { id, names } = ship;
    if (names.en !== undefined) map[names.en] = id;
    if (names.cn !== undefined && !(names.cn in map)) map[names.cn] = id;
    if (names.jp !== undefined && !(names.jp in map)) map[names.jp] = id;
    if (names.code !== undefined && !(names.code in map) && !enNames.has(names.code)) {
      map[names.code] = id;
    }
  }

  // Legacy 3-digit code → group_type mapping from groupRows
  for (const row of groupRows) {
    const paddedCode = String(row.code).padStart(3, "0");
    map[paddedCode] = String(row.group_type);
  }

  const json = JSON.stringify(map, null, 2);

  const dir = path.dirname(path.resolve(outputPath));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, json, "utf-8");
}
