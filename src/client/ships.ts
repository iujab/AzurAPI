import Fuse from "fuse.js";
import type { Ship } from "../schema/output/ship.js";

export interface ShipsOptions {
  data: Record<string, Ship>;        // ships.json contents
  idMap: Record<string, string>;     // id-map.json contents
  fuseThreshold?: number;            // default 0.4
}

export class Ships {
  private readonly data: Record<string, Ship>;
  private readonly idMap: Record<string, string>;
  private readonly fuse: Fuse<Ship>;

  constructor(options: ShipsOptions) {
    this.data = options.data;
    this.idMap = options.idMap;
    this.fuse = new Fuse(Object.values(options.data), {
      keys: [
        { name: "names.en", weight: 3 },
        { name: "names.code", weight: 2 },
        { name: "names.jp", weight: 1 },
        { name: "names.cn", weight: 1 },
      ],
      threshold: options.fuseThreshold ?? 0.4,
      includeScore: true,
    });
  }

  // Primary getter. Accepts:
  //   - canonical group_type: "20212"
  //   - legacy 3-digit code: "115" (via idMap)
  //   - any name in idMap (case-insensitive)
  //   - fuzzy match via fuse.js
  get(nameOrId: string): Ship | undefined {
    if (typeof nameOrId !== "string" || nameOrId.length === 0) return undefined;

    // 1. Direct id hit
    if (this.data[nameOrId]) return this.data[nameOrId];

    // 2. Exact id-map hit (case sensitive first)
    const directId = this.idMap[nameOrId];
    if (directId && this.data[directId]) return this.data[directId];

    // 3. Case-insensitive id-map hit
    // Build a lowercased copy lazily
    const lower = nameOrId.toLowerCase();
    const ciIdMap = this.getCiIdMap();
    const ciId = ciIdMap[lower];
    if (ciId && this.data[ciId]) return this.data[ciId];

    // 4. Fuse.js fuzzy
    const results = this.fuse.search(nameOrId, { limit: 1 });
    if (results.length > 0 && results[0]!.score !== undefined && results[0]!.score < 0.5) {
      return results[0]!.item;
    }
    return undefined;
  }

  private _ciIdMap?: Record<string, string>;
  private getCiIdMap(): Record<string, string> {
    if (!this._ciIdMap) {
      this._ciIdMap = {};
      for (const [k, v] of Object.entries(this.idMap)) {
        this._ciIdMap[k.toLowerCase()] = v;
      }
    }
    return this._ciIdMap;
  }

  getAll(): Ship[] {
    return Object.values(this.data);
  }

  getById(id: string): Ship | undefined {
    return this.data[id];
  }

  count(): number {
    return Object.keys(this.data).length;
  }

  // Search multiple matches
  search(query: string, limit = 10): Ship[] {
    const results = this.fuse.search(query, { limit });
    return results.map(r => r.item);
  }
}
