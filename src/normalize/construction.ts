import type { Ship } from "../schema/output/ship.js";
import type {
  ShipDataGroupValue,
  FleetTechShipTemplate,
  ShipDataCreateExchange,
  ShipDataByType,
  ShipDataByStar,
} from "../schema/raw/index.js";
import type { Lookups } from "../translate/lookups.js";
import { FLEET_TECH_STAT_MAP } from "../translate/enums.js";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export interface ConstructionInputs {
  groupType: string;
  /** Pre-resolved ship_data_group row */
  groupRow: ShipDataGroupValue;
  lb3RowId: string;
  /** from ship_data_template[lb3].type */
  shipType: number;
  /** star_max from template */
  starMax: number;
  /** star count at LB0 — used for medal scrap calculation */
  initialStar: number;
  fleetTechShipTemplate: FleetTechShipTemplate;
  shipDataCreateExchange: ShipDataCreateExchange;
  shipDataByType: ShipDataByType;
  shipDataByStar: ShipDataByStar;
  lookups: Lookups;
  /** Optional seed from data/overrides/construction-times.json */
  constructionTimeOverride?: string;
}

export interface ConstructionOutput {
  construction?: Ship["construction"];
  scrapValue?: Ship["scrapValue"];
  fleetTech?: Ship["fleetTech"];
  obtainedFrom?: Ship["obtainedFrom"];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Flatten all string tokens from a description entry tuple.
 * description entries are [string, unknown, number?] tuples.
 */
function descEntryText(entry: readonly [string, unknown, (number | undefined)?]): string {
  return entry[0];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function normalizeConstruction(inputs: ConstructionInputs): ConstructionOutput {
  const {
    groupType,
    groupRow,
    lb3RowId,
    shipType,
    initialStar,
    fleetTechShipTemplate,
    shipDataCreateExchange,
    shipDataByType,
    shipDataByStar,
    lookups,
    constructionTimeOverride,
  } = inputs;

  const result: ConstructionOutput = {};

  // -------------------------------------------------------------------------
  // 1. construction.availableIn
  // -------------------------------------------------------------------------

  const descriptions = groupRow.description ?? [];

  let lightFlag = false;
  let heavyFlag = false;
  let aviationFlag = false;
  let limitedFlag = false;

  for (const entry of descriptions) {
    const text = descEntryText(entry);
    const lower = text.toLowerCase();

    if (
      lower.includes("light construction") ||
      (lower.includes("light") && lower.includes("construction"))
    ) {
      lightFlag = true;
    }

    if (
      lower.includes("heavy construction") ||
      (lower.includes("heavy") && lower.includes("construction"))
    ) {
      heavyFlag = true;
    }

    if (
      lower.includes("special construction") ||
      (lower.includes("aviation") && lower.includes("construction"))
    ) {
      aviationFlag = true;
    }

    if (
      lower.startsWith("event:") ||
      lower === "limited build"
    ) {
      limitedFlag = true;
    }
  }

  // exchange: true if lb3RowId appears as a value in any exchange_ship_id array
  let exchangeFlag = false;
  const lb3RowIdNum = Number(lb3RowId);
  for (const exchangeRow of Object.values(shipDataCreateExchange)) {
    if (exchangeRow === undefined) continue;
    const ids = exchangeRow.exchange_ship_id ?? [];
    if (ids.includes(lb3RowIdNum)) {
      exchangeFlag = true;
      break;
    }
  }

  const anyAvailableIn =
    lightFlag || heavyFlag || aviationFlag || limitedFlag || exchangeFlag;
  const hasConstructionTime = constructionTimeOverride !== undefined;

  if (anyAvailableIn || hasConstructionTime) {
    const availableIn = anyAvailableIn
      ? {
          light: lightFlag,
          heavy: heavyFlag,
          aviation: aviationFlag,
          limited: limitedFlag,
          exchange: exchangeFlag,
        }
      : undefined;

    result.construction = {
      ...(hasConstructionTime ? { constructionTime: constructionTimeOverride } : {}),
      ...(availableIn !== undefined ? { availableIn } : {}),
    };
  }

  // -------------------------------------------------------------------------
  // 2. scrapValue
  // -------------------------------------------------------------------------

  const typeRow = shipDataByType[String(shipType)];
  const goldRatio = typeRow?.distory_resource_gold_ratio ?? 0;
  const fixGold = typeRow?.fix_resource_gold ?? 0;
  const coin = Math.floor(goldRatio * 120 + fixGold);

  // medal: from ship_data_by_star[initialStar].destory_item — find item_id === 15001
  const starRow = shipDataByStar[String(initialStar)];
  const destroyItems = starRow?.destory_item ?? [];
  let medal = 0;
  for (const [, itemId, qty] of destroyItems) {
    if (itemId === 15001) {
      medal = qty;
      break;
    }
  }

  if (coin > 0 || medal > 0) {
    result.scrapValue = { coin, oil: 0, medal };
  }

  // -------------------------------------------------------------------------
  // 3. fleetTech
  // -------------------------------------------------------------------------

  const techRow = fleetTechShipTemplate[groupType];
  if (techRow !== undefined) {
    const collection = techRow.pt_get;
    const maxLimitBreak = techRow.pt_upgrage;
    const maxLevel = techRow.pt_level;
    const total = collection + maxLimitBreak + maxLevel;

    const techPoints: NonNullable<Ship["fleetTech"]>["techPoints"] = {
      collection,
      maxLimitBreak,
      maxLevel,
      total,
    };

    // collection bonus
    let collectionBonus: NonNullable<Ship["fleetTech"]>["statsBonus"]["collection"] | undefined;
    if (techRow.add_get_attr !== 0 && techRow.add_get_value !== 0) {
      collectionBonus = {
        stat: FLEET_TECH_STAT_MAP[techRow.add_get_attr] ?? "unknown",
        bonus: techRow.add_get_value,
        applicable: techRow.add_get_shiptype.map((id) => lookups.hullTypeName(id)),
      };
    }

    // maxLevel bonus
    let maxLevelBonus: NonNullable<Ship["fleetTech"]>["statsBonus"]["maxLevel"] | undefined;
    if (techRow.add_level_attr !== 0 && techRow.add_level_value !== 0) {
      maxLevelBonus = {
        stat: FLEET_TECH_STAT_MAP[techRow.add_level_attr] ?? "unknown",
        bonus: techRow.add_level_value,
        applicable: techRow.add_level_shiptype.map((id) => lookups.hullTypeName(id)),
      };
    }

    result.fleetTech = {
      techPoints,
      statsBonus: {
        ...(collectionBonus !== undefined ? { collection: collectionBonus } : {}),
        ...(maxLevelBonus !== undefined ? { maxLevel: maxLevelBonus } : {}),
      },
    };
  }

  // -------------------------------------------------------------------------
  // 4. obtainedFrom
  // -------------------------------------------------------------------------

  const mapPrefixes = ["explore chapter", "exploring stage"];

  const fromMaps: string[] = [];
  let firstNonMapText: string | undefined;

  for (const entry of descriptions) {
    const text = descEntryText(entry);
    const lower = text.toLowerCase();

    const isMap = mapPrefixes.some((prefix) => lower.startsWith(prefix));

    if (isMap) {
      // Extract the stage code using a regex: match Chapter/Stage followed by digits/dashes
      const match = /\b(?:Chapter|Stage)\s+([0-9\-SEX\s]+)/i.exec(text);
      if (match !== null && match[1] !== undefined) {
        fromMaps.push(`Chapter ${match[1].trim()}`);
      } else {
        // Fallback: take last whitespace-separated token
        const tokens = text.trim().split(/\s+/);
        const last = tokens[tokens.length - 1];
        if (last !== undefined) {
          fromMaps.push(last);
        }
      }
    } else if (firstNonMapText === undefined) {
      firstNonMapText = text;
    }
  }

  let obtainedFromStr: string;
  if (firstNonMapText !== undefined) {
    obtainedFromStr = firstNonMapText;
  } else if (fromMaps.length > 0) {
    obtainedFromStr = "Map Drop";
  } else {
    obtainedFromStr = "Unknown";
  }

  const shouldEmitObtainedFrom = fromMaps.length > 0 || obtainedFromStr !== "Unknown";

  if (shouldEmitObtainedFrom) {
    result.obtainedFrom = {
      ...(fromMaps.length > 0 ? { fromMaps } : {}),
      obtainedFrom: obtainedFromStr,
    };
  }

  return result;
}
