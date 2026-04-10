// ---------------------------------------------------------------------------
// Placeholder substitution
// ---------------------------------------------------------------------------

/**
 * Format a raw skill description by substituting $1, $2, ... placeholders.
 *
 * @example
 *   substitutePlaceholders("Increases DMG by $1 and AoE by $2.", ["25.0%", "3.0%"])
 *   // → "Increases DMG by 25.0% and AoE by 3.0%."
 */
export function substitutePlaceholders(
  raw: string,
  substitutions: ReadonlyArray<string>,
): string {
  return raw.replace(/\$(\d+)/g, (_match, indexStr: string) => {
    const idx = parseInt(indexStr, 10) - 1; // convert 1-based to 0-based
    return substitutions[idx] ?? _match;
  });
}

/**
 * Extract the max-rank substitution value from a skill's desc_add array.
 *
 * The true shape of desc_add is `Array<Array<Array<string | number>>>`:
 *   - Outer: one entry per placeholder ($N → outer[N-1])
 *   - Middle: one entry per skill level (length = max_level, usually 10)
 *   - Inner: a tuple of [current_value, delta] or [value] — we take index 0
 *
 * For the max-rank value we take desc_add[n-1][maxLevel-1][0].
 * If anything looks wrong, we use the last available entry, or "" as a last resort.
 */
export function extractMaxLevelSubstitutions(
  descAdd: unknown,
  maxLevel: number,
): string[] {
  if (!Array.isArray(descAdd)) return [];

  const result: string[] = [];

  for (const outerEntry of descAdd) {
    // outerEntry should be an array of per-level arrays
    if (!Array.isArray(outerEntry) || outerEntry.length === 0) {
      result.push("");
      continue;
    }

    // Pick the last-level entry, clamped to available entries
    const levelIndex = Math.min(maxLevel - 1, outerEntry.length - 1);
    const innerEntry = outerEntry[Math.max(0, levelIndex)];

    if (!Array.isArray(innerEntry) || innerEntry.length === 0) {
      result.push("");
      continue;
    }

    const value = innerEntry[0];
    if (value === null || value === undefined) {
      result.push("");
    } else {
      result.push(String(value));
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Stars
// ---------------------------------------------------------------------------

/**
 * Convert star count 1..6 to a unicode-star string like "★★★★".
 */
export function starsString(count: number): string {
  return "★".repeat(Math.max(0, count));
}

// ---------------------------------------------------------------------------
// Wiki URL
// ---------------------------------------------------------------------------

/**
 * Convert an EN ship name to a wiki URL.
 * e.g. "Belfast" → "https://azurlane.koumakan.jp/wiki/Belfast"
 */
export function wikiUrlFor(name: string): string {
  return `https://azurlane.koumakan.jp/wiki/${encodeURIComponent(name)}`;
}

// ---------------------------------------------------------------------------
// Limit break bonus string splitting
// ---------------------------------------------------------------------------

/**
 * Split a limit-break bonus string on "/" or "|" into bullet items. Trim whitespace.
 *
 * @example
 *   splitLimitBreakBonuses("Unlock X/Main gun +5%/+10 FP")
 *   // → ["Unlock X", "Main gun +5%", "+10 FP"]
 *
 * Returns [] for the empty string or for "None".
 */
export function splitLimitBreakBonuses(raw: string): string[] {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "None") return [];
  return trimmed.split(/[/|]/).map((s) => s.trim()).filter((s) => s.length > 0);
}
