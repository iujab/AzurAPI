import type { ShipDataGroupValue, ShipDataTrans } from "../schema/raw/index.js";
import type { Lookups } from "../translate/lookups.js";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export interface RetrofitInputs {
  groupType: string;
  groupRow?: ShipDataGroupValue;
  trans: ShipDataTrans;
  lookups: Lookups;
}

export interface RetrofitOutput {
  retrofit: boolean;
  retrofitHullType?: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function normalizeRetrofit(inputs: RetrofitInputs): RetrofitOutput {
  const { groupType, groupRow, trans, lookups } = inputs;

  const retrofit = groupType in trans;

  if (!retrofit) {
    return { retrofit: false };
  }

  // Resolve the post-retrofit hull type from trans_type on the group row.
  // If trans_type is 0 or missing, omit the field (no hull-type change detectable).
  const transType = groupRow?.trans_type ?? 0;

  if (transType === 0) {
    return { retrofit: true };
  }

  const retrofitHullType = lookups.hullTypeName(transType);

  return { retrofit: true, retrofitHullType };
}
