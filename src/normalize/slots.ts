import type { Ship } from "../schema/output/ship.js";
import type { ShipDataTemplate, ShipDataStatistics } from "../schema/raw/index.js";
import type { Lookups } from "../translate/lookups.js";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export interface SlotsInputs {
  /** Row ID with minimum proficiency (LB0). */
  lb0RowId: string;
  /** Row ID with maximum proficiency (LB3). */
  lb3RowId: string;
  template: ShipDataTemplate;
  statistics: ShipDataStatistics;
  lookups: Lookups;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function normalizeSlots(inputs: SlotsInputs): Ship["slots"] {
  const { lb0RowId, lb3RowId, template, statistics, lookups } = inputs;

  const tmplLb0 = template[lb0RowId];
  const tmplLb3 = template[lb3RowId];

  // If either template row is missing, return empty — orchestrator decides what to do.
  if (tmplLb0 === undefined || tmplLb3 === undefined) {
    return [];
  }

  const statsLb0 = statistics[lb0RowId];
  const statsLb3 = statistics[lb3RowId];

  const proficiencyLb0 = statsLb0?.equipment_proficiency ?? [];
  const proficiencyLb3 = statsLb3?.equipment_proficiency ?? [];

  // Equipment slot arrays: equip_1, equip_2, equip_3 (ignore 4th augment slot)
  const equipSlots: [number[], number[], number[]] = [
    tmplLb0.equip_1,
    tmplLb0.equip_2,
    tmplLb0.equip_3,
  ];

  const slots: Ship["slots"] = [];

  for (let i = 0; i < 3; i++) {
    const equipArr = equipSlots[i];
    const equipTypeId = equipArr?.[0];

    const type = equipTypeId !== undefined ? lookups.equipTypeName(equipTypeId) : "Unknown";
    const minEfficiency = proficiencyLb0[i] ?? 0;
    const maxEfficiency = proficiencyLb3[i] ?? 0;

    slots.push({ type, minEfficiency, maxEfficiency });
  }

  return slots;
}
