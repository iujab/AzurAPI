import type { Ship, StatBlock } from "../schema/output/ship.js";
import type {
  ShipDataStatistics,
  ShipDataStrengthen,
  ShipStrengthenBlueprint,
  ShipDataBlueprint,
  ShipDataTrans,
  TransformDataTemplate,
} from "../schema/raw/index.js";
import { STAT_INDEX_TO_FIELD } from "../translate/enums.js";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export interface StatsInputs {
  lb3RowId: string;
  en: {
    statistics: ShipDataStatistics;
    strengthen: ShipDataStrengthen;
    strengthenBlueprint: ShipStrengthenBlueprint;
    blueprint: ShipDataBlueprint;
    trans: ShipDataTrans;
    transformDataTemplate: TransformDataTemplate;
  };
  groupType: string;
  strengthenId: string;
  /** True when this group is a research/blueprint ship. */
  isResearch: boolean;
}

export interface StatsOutput {
  stats: Ship["stats"];
  enhanceValue: Ship["enhanceValue"];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a strengthen bonus array (12 elements) from a 5-element durability
 * array. Used for both `ship_data_strengthen.durability` and
 * `ship_strengthen_blueprint.effect` — they share the same layout:
 *   [0] → firepower (attrs index 1)
 *   [1] → torpedo   (attrs index 2)
 *   [2] → (unused / always 0 — would be AA)
 *   [3] → aviation  (attrs index 4)
 *   [4] → reload    (attrs index 5)
 */
function buildStrengthenBonus(durability: readonly number[]): number[] {
  const bonus = new Array<number>(12).fill(0);
  bonus[1] = durability[0] ?? 0; // firepower
  bonus[2] = durability[1] ?? 0; // torpedo
  bonus[4] = durability[3] ?? 0; // aviation
  bonus[5] = durability[4] ?? 0; // reload
  return bonus;
}

/**
 * Resolve the max strengthen durability for a research ship from
 * ship_data_blueprint + ship_strengthen_blueprint.
 *
 * The blueprint row lists:
 *   - strengthen_effect: dev-level rows 1..30 (cumulative; last entry is max)
 *   - fate_strengthen:   fate-sim rows     (cumulative deltas on top of dev max)
 *
 * Returns a 5-element array in the same layout as ship_data_strengthen.durability,
 * or `undefined` if the blueprint entry/strengthen rows are missing.
 */
function researchDurability(
  groupType: string,
  blueprint: ShipDataBlueprint,
  strengthenBlueprint: ShipStrengthenBlueprint,
): number[] | undefined {
  const bpRow = blueprint[groupType];
  if (bpRow === undefined) return undefined;

  const effectIds = bpRow.strengthen_effect ?? [];
  const fateIds = bpRow.fate_strengthen ?? [];

  const lastEffectId = effectIds[effectIds.length - 1];
  if (lastEffectId === undefined) return undefined;

  const lastEffectRow = strengthenBlueprint[String(lastEffectId)];
  if (lastEffectRow === undefined) return undefined;

  const result: number[] = [
    lastEffectRow.effect[0] ?? 0,
    lastEffectRow.effect[1] ?? 0,
    lastEffectRow.effect[2] ?? 0,
    lastEffectRow.effect[3] ?? 0,
    lastEffectRow.effect[4] ?? 0,
  ];

  // Layer on any non-zero fate strengthen max (currently all zero in EN data,
  // but handle it defensively so future fate entries flow through).
  const lastFateId = fateIds[fateIds.length - 1];
  if (lastFateId !== undefined) {
    const lastFateRow = strengthenBlueprint[String(lastFateId)];
    if (lastFateRow !== undefined) {
      result[0] = (result[0] ?? 0) + (lastFateRow.effect[0] ?? 0);
      result[1] = (result[1] ?? 0) + (lastFateRow.effect[1] ?? 0);
      result[2] = (result[2] ?? 0) + (lastFateRow.effect[2] ?? 0);
      result[3] = (result[3] ?? 0) + (lastFateRow.effect[3] ?? 0);
      result[4] = (result[4] ?? 0) + (lastFateRow.effect[4] ?? 0);
    }
  }

  return result;
}

/**
 * Compute a single stat value at the given level.
 * Formula: base + floor(growth * (level - 1) / 1000) + floor(growthExtra * max(level - 100, 0) / 1000) + strengthenBonus
 */
function computeStat(
  base: number,
  growth: number,
  growthExtra: number,
  level: number,
  strengthenBonus: number,
): number {
  const fromGrowth = Math.floor((growth * (level - 1)) / 1000);
  const fromExtra = level > 100 ? Math.floor((growthExtra * (level - 100)) / 1000) : 0;
  return base + fromGrowth + fromExtra + strengthenBonus;
}

/**
 * Build a StatBlock for a given level from the statistics arrays.
 */
function buildStatBlock(
  attrs: readonly number[],
  attrsGrowth: readonly number[],
  attrsGrowthExtra: readonly number[],
  level: number,
  strengthenBonus: readonly number[],
): StatBlock {
  const partial: Partial<StatBlock> = {};

  for (let i = 0; i < 12; i++) {
    const field = STAT_INDEX_TO_FIELD[i];
    if (field === undefined) continue;

    const stat = computeStat(
      attrs[i] ?? 0,
      attrsGrowth[i] ?? 0,
      attrsGrowthExtra[i] ?? 0,
      level,
      strengthenBonus[i] ?? 0,
    );
    (partial as Record<string, number>)[field] = stat;
  }

  // Ensure all required StatBlock fields are present (default 0)
  const block: StatBlock = {
    health: partial.health ?? 0,
    firepower: partial.firepower ?? 0,
    torpedo: partial.torpedo ?? 0,
    evasion: partial.evasion ?? 0,
    antiwar: partial.antiwar ?? 0,
    aviation: partial.aviation ?? 0,
    reload: partial.reload ?? 0,
    speed: partial.speed ?? 0,
    luck: partial.luck ?? 0,
    accuracy: partial.accuracy ?? 0,
  };

  return block;
}

/**
 * Retrofit raw stat name → StatBlock field mapping.
 */
const RETROFIT_RAW_NAME_MAP: Record<string, keyof StatBlock> = {
  durability: "health",
  cannon: "firepower",
  torpedo: "torpedo",
  antiaircraft: "antiwar",
  air: "aviation",
  reload: "reload",
  hit: "accuracy",
  dodge: "evasion",
  speed: "speed",
};

/**
 * Compute retrofit stat deltas by walking the transform_list.
 * Returns a partial StatBlock delta (only fields with non-zero deltas).
 */
function computeRetrofitDeltas(
  groupType: string,
  trans: ShipDataTrans,
  transformDataTemplate: TransformDataTemplate,
): Partial<Record<keyof StatBlock, number>> {
  const transRow = trans[groupType];
  if (transRow === undefined) return {};

  const deltas: Partial<Record<keyof StatBlock, number>> = {};
  const seenTransformIds = new Set<number>();

  for (const outerList of transRow.transform_list) {
    for (const pair of outerList) {
      const transformId = pair[1];
      if (transformId === undefined || seenTransformIds.has(transformId)) continue;
      seenTransformIds.add(transformId);

      const tRow = transformDataTemplate[String(transformId)];
      if (tRow === undefined) continue;

      for (const effectEntry of tRow.effect) {
        for (const [rawStatName, delta] of Object.entries(effectEntry)) {
          const field = RETROFIT_RAW_NAME_MAP[rawStatName];
          if (field === undefined) continue;
          const current = deltas[field] ?? 0;
          deltas[field] = current + delta;
        }
      }
    }
  }

  return deltas;
}

/**
 * Apply retrofit deltas to a StatBlock, returning a new StatBlock.
 */
function applyRetrofitDeltas(
  base: StatBlock,
  deltas: Partial<Record<keyof StatBlock, number>>,
): StatBlock {
  return {
    health: base.health + (deltas.health ?? 0),
    firepower: base.firepower + (deltas.firepower ?? 0),
    torpedo: base.torpedo + (deltas.torpedo ?? 0),
    evasion: base.evasion + (deltas.evasion ?? 0),
    antiwar: base.antiwar + (deltas.antiwar ?? 0),
    aviation: base.aviation + (deltas.aviation ?? 0),
    reload: base.reload + (deltas.reload ?? 0),
    speed: base.speed + (deltas.speed ?? 0),
    luck: base.luck + (deltas.luck ?? 0),
    accuracy: base.accuracy + (deltas.accuracy ?? 0),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function normalizeStats(inputs: StatsInputs): StatsOutput {
  const { lb3RowId, en, groupType, strengthenId, isResearch } = inputs;
  const {
    statistics,
    strengthen,
    strengthenBlueprint,
    blueprint,
    trans,
    transformDataTemplate,
  } = en;

  // ------------------------------------------------------------------
  // Get the LB3 statistics row
  // ------------------------------------------------------------------
  const statsRow = statistics[lb3RowId];
  if (statsRow === undefined) {
    throw new Error(
      `normalizeStats: missing statistics row "${lb3RowId}" for group_type "${groupType}"`,
    );
  }

  const attrs = statsRow.attrs;
  const attrsGrowth = statsRow.attrs_growth;
  const attrsGrowthExtra = statsRow.attrs_growth_extra ?? new Array<number>(12).fill(0);

  // ------------------------------------------------------------------
  // Strengthen bonus
  //
  // Research ships: sum the last strengthen_effect + fate_strengthen rows from
  // ship_strengthen_blueprint.json (ship_data_strengthen for research ships
  // either mirrors a partial/legacy value or is all-zero for newer Decisive
  // ships — don't trust it).
  //
  // Non-research ships: use ship_data_strengthen[strengthen_id].durability.
  // ------------------------------------------------------------------
  let durability: readonly number[];
  if (isResearch) {
    durability =
      researchDurability(groupType, blueprint, strengthenBlueprint) ?? [];
  } else {
    durability = strengthen[strengthenId]?.durability ?? [];
  }
  const strengthenBonus = buildStrengthenBonus(durability);

  // ------------------------------------------------------------------
  // Compute stat blocks at level 100 and 120
  // ------------------------------------------------------------------
  const level100 = buildStatBlock(attrs, attrsGrowth, attrsGrowthExtra, 100, strengthenBonus);
  const level120 = buildStatBlock(attrs, attrsGrowth, attrsGrowthExtra, 120, strengthenBonus);

  // ------------------------------------------------------------------
  // Retrofit deltas
  // ------------------------------------------------------------------
  const hasRetrofit = groupType in trans;
  let level100Retrofit: StatBlock | undefined;
  let level120Retrofit: StatBlock | undefined;

  if (hasRetrofit) {
    const deltas = computeRetrofitDeltas(groupType, trans, transformDataTemplate);
    level100Retrofit = applyRetrofitDeltas(level100, deltas);
    level120Retrofit = applyRetrofitDeltas(level120, deltas);
  }

  // ------------------------------------------------------------------
  // Enhance value
  // ------------------------------------------------------------------
  const enhanceValue: Ship["enhanceValue"] = {
    firepower: durability[0] ?? 0,
    torpedo: durability[1] ?? 0,
    aviation: durability[3] ?? 0,
    reload: durability[4] ?? 0,
  };

  // ------------------------------------------------------------------
  // Assemble output
  // ------------------------------------------------------------------
  const stats: Ship["stats"] = {
    level100,
    level120,
    ...(level100Retrofit !== undefined ? { level100Retrofit } : {}),
    ...(level120Retrofit !== undefined ? { level120Retrofit } : {}),
  };

  return { stats, enhanceValue };
}
