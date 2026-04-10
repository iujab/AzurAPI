import fs from "fs";
import path from "path";
import type { Ship } from "../schema/output/ship.js";
import type { ShipListEntry } from "../schema/output/ship.js";

// ---------------------------------------------------------------------------
// writeShipList
// ---------------------------------------------------------------------------

/**
 * Write a minimal ship list to disk.
 * Shape: Array<{ id: string; name: string; hullType: string; rarity: string }>
 *
 * `name` is resolved in priority order: names.en → names.code → id
 */
export function writeShipList(ships: Ship[], outputPath = "data/ship-list.json"): void {
  const list: ShipListEntry[] = ships.map((ship) => ({
    id: ship.id,
    name: ship.names.en ?? ship.names.code ?? ship.id,
    hullType: ship.hullType,
    rarity: ship.rarity,
  }));

  // Sort by id numerically for deterministic output
  list.sort((a, b) => Number(a.id) - Number(b.id));

  const json = JSON.stringify(list, null, 2);

  const dir = path.dirname(path.resolve(outputPath));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, json, "utf-8");
}
