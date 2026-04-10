import type { StatBlock } from "../schema/output/ship.js";

// ---------------------------------------------------------------------------
// Rarity
// ---------------------------------------------------------------------------

/** Maps integer rarity → AzurAPI rarity string */
export const RARITY_MAP: Record<number, "Normal" | "Rare" | "Elite" | "Super Rare" | "Ultra Rare"> = {
  1: "Normal",
  2: "Normal",
  3: "Rare",
  4: "Elite",
  5: "Super Rare",
  6: "Ultra Rare",
};

/**
 * Resolve a rarity integer to its display string.
 *
 * Rules:
 *   - int === 6 && isResearch && blueprintVersion >= 6  → "Decisive"
 *   - int === 6 && isResearch                            → "Priority"
 *   - else                                               → RARITY_MAP[int] || "Normal"
 */
export function rarityName(
  rarity: number,
  isResearch: boolean,
  blueprintVersion: number | undefined,
): string {
  if (rarity === 6 && isResearch) {
    if (blueprintVersion !== undefined && blueprintVersion >= 6) {
      return "Decisive";
    }
    return "Priority";
  }
  return RARITY_MAP[rarity] ?? "Normal";
}

// ---------------------------------------------------------------------------
// Nationality
// ---------------------------------------------------------------------------

/** Nationality int → display string. Matches Azur Lane wiki convention. */
export const NATIONALITY_MAP: Record<number, string> = {
  0: "Universal",
  1: "Eagle Union",
  2: "Royal Navy",
  3: "Sakura Empire",
  4: "Iron Blood",
  5: "Dragon Empery",
  6: "Sardegna Empire",
  7: "Northern Parliament",
  8: "Iris Libre",
  9: "Vichya Dominion",
  10: "Iris Orthodoxy",
  11: "Kingdom of Tulipa",
  96: "Universal",
  97: "Tempesta",
  98: "Universal",
  101: "META",
  102: "Universal",
  103: "Universal",
  104: "Universal",
  105: "Neptunia",
  106: "KizunaAI",
  107: "Hololive",
  108: "Venus Vacation",
  109: "The Idolmaster",
  110: "SSSS",
  111: "Atelier Ryza",
  112: "Senran Kagura",
};

/** Look up a nationality code; falls back to "Universal". */
export function nationalityName(code: number): string {
  return NATIONALITY_MAP[code] ?? "Universal";
}

// ---------------------------------------------------------------------------
// Skill color
// ---------------------------------------------------------------------------

/**
 * Skill type int → AzurAPI color.
 * 1 = offensive (yellow), 2 = support (pink), 3 = defensive (blue), 0 = unset (pink).
 */
export const SKILL_COLOR_MAP: Record<number, "red" | "pink" | "gold" | "yellow" | "blue"> = {
  0: "pink",
  1: "yellow",
  2: "pink",
  3: "blue",
};

/** Look up a skill type color; falls back to "pink". */
export function skillColor(type: number): "red" | "pink" | "gold" | "yellow" | "blue" {
  return SKILL_COLOR_MAP[type] ?? "pink";
}

// ---------------------------------------------------------------------------
// Stat index map
// ---------------------------------------------------------------------------

/**
 * Stat index (0..11) → AzurAPI stat field name (on StatBlock).
 * Only the 10 exposed stats. armor (6) and antisub (11) are intentionally missing.
 */
export const STAT_INDEX_TO_FIELD: Record<number, keyof StatBlock | undefined> = {
  0: "health",
  1: "firepower",
  2: "torpedo",
  3: "antiwar",   // AA — keep AzurAPI typo
  4: "aviation",
  5: "reload",
  6: undefined,   // armor — not in StatBlock
  7: "accuracy",
  8: "evasion",
  9: "speed",
  10: "luck",
  11: undefined,  // antisub — not in StatBlock
};

// ---------------------------------------------------------------------------
// Fleet-tech stat map
// ---------------------------------------------------------------------------

/**
 * Fleet-tech attribute id → display name.
 * From attribute_info_by_type.json, but hard-coded to avoid a data lookup per ship.
 */
export const FLEET_TECH_STAT_MAP: Record<number, string> = {
  1: "health",
  2: "firepower",
  3: "torpedo",
  4: "antiaircraft",
  5: "aviation",
  6: "reload",
  7: "armor",
  8: "accuracy",
  9: "evasion",
  10: "speed",
  11: "luck",
  12: "antisub",
};
