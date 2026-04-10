import type { Ship } from "../schema/output/ship.js";
import type {
  ShipDataTemplate,
  ShipDataBreakout,
  SkillDataTemplate,
  SkillDataDisplay,
  ShipDataTrans,
  TransformDataTemplate,
} from "../schema/raw/index.js";
import { skillColor } from "../translate/enums.js";
import {
  extractMaxLevelSubstitutions,
  substitutePlaceholders,
  splitLimitBreakBonuses,
} from "../translate/strings.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SkillsInputs {
  rowIds: string[];             // ascending by LB level, e.g. ["202121","202122","202123","202124"]
  en: {
    template: ShipDataTemplate;
    breakout: ShipDataBreakout;
    skillDataTemplate: SkillDataTemplate;
    skillDataDisplay: SkillDataDisplay;
    trans?: ShipDataTrans;
    transformDataTemplate?: TransformDataTemplate;
  };
  groupType: string;
}

export interface SkillsOutput {
  skills: Ship["skills"];
  limitBreaks?: Ship["limitBreaks"];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strip trailing Roman numeral suffix (Ⅰ–Ⅴ or ASCII I/II/III/IV/V) from a skill
 * name, returning just the "root" portion for comparison purposes.
 *
 * Examples:
 *   "All Out Assault Ⅰ"    → "All Out Assault"
 *   "All Out Assault Ⅱ"    → "All Out Assault"
 *   "Smokescreen: Light Cruisers" → "Smokescreen: Light Cruisers"
 *   "Burn Order"            → "Burn Order"
 */
function rootSkillName(name: string): string {
  // Trim Unicode Roman numerals (Ⅰ Ⅱ Ⅲ Ⅳ Ⅴ Ⅵ Ⅶ Ⅷ Ⅸ Ⅹ) and ASCII (I–X variants)
  // at end of string, optionally preceded by a colon/period and more text.
  return name
    .replace(/\s+[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩiIvVxX]+(?:[:.][^\s]*)*\s*$/, "")
    .trim();
}

/**
 * Normalize a `skill_id` value (number | number[] | undefined) to a number[].
 */
function normalizeSkillIdList(raw: number | number[] | undefined): number[] {
  if (raw === undefined) return [];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

/**
 * Build the description string for a skill.
 */
function buildDescription(
  skillTemplate: SkillDataTemplate,
  idStr: string,
): string {
  const row = skillTemplate[idStr];
  if (row === undefined) return "";

  const rawDesc = row.desc;
  if (rawDesc === undefined || rawDesc === "") return "";

  const substitutions = extractMaxLevelSubstitutions(row.desc_add, row.max_level ?? 10);
  return substitutePlaceholders(rawDesc, substitutions);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function normalizeSkills(inputs: SkillsInputs): SkillsOutput {
  const { rowIds, en, groupType } = inputs;
  const {
    template,
    breakout,
    skillDataTemplate,
    skillDataDisplay,
    trans,
    transformDataTemplate,
  } = en;

  // -------------------------------------------------------------------------
  // 1. Resolve the LB3 row ID (the row whose key ends with "4", or last entry).
  // -------------------------------------------------------------------------
  const lb3RowId =
    rowIds.find((id) => id.endsWith("4")) ?? rowIds[rowIds.length - 1] ?? groupType;

  // -------------------------------------------------------------------------
  // 2. Get the base skill ID list from the LB3 row.
  // -------------------------------------------------------------------------
  const lb3Template = template[lb3RowId];
  const baseSkillIds: number[] = lb3Template?.buff_list_display ?? [];

  // -------------------------------------------------------------------------
  // 3. Apply retrofit skill upgrades (if any).
  //
  // TODO: The retrofit skill-upgrade/replace logic is a best-effort
  // approximation.  AzurAPI's historical output was inconsistent here; some
  // versions replaced the base skill, others appended.  The implementation
  // below attempts a root-name match and replaces when found, otherwise
  // appends.  If this causes issues, simplify to just using `baseSkillIds`
  // directly.
  // -------------------------------------------------------------------------

  let finalSkillIds = [...baseSkillIds];

  if (trans !== undefined && transformDataTemplate !== undefined) {
    const transRow = trans[groupType];
    if (transRow !== undefined) {
      // Collect all retrofit skill IDs: from trans.skill_id + each transform node's skill_id
      const retrofitSkillIds = new Set<number>();

      // From the top-level trans row
      const topSkillIds = normalizeSkillIdList(transRow.skill_id);
      for (const sid of topSkillIds) {
        if (sid !== 0) retrofitSkillIds.add(sid);
      }

      // From each transform_data_template node referenced in transform_list
      const seenTransformIds = new Set<number>();
      for (const outerList of transRow.transform_list) {
        for (const pair of outerList) {
          const transformId = pair[1];
          if (transformId === undefined || seenTransformIds.has(transformId)) continue;
          seenTransformIds.add(transformId);

          const tRow = transformDataTemplate[String(transformId)];
          if (tRow === undefined) continue;

          const tSkillIds = normalizeSkillIdList(tRow.skill_id);
          for (const sid of tSkillIds) {
            if (sid !== 0) retrofitSkillIds.add(sid);
          }
        }
      }

      // Merge retrofit skills: replace base skill if root names match, else append
      for (const retrofitId of retrofitSkillIds) {
        const retrofitRow = skillDataTemplate[String(retrofitId)];
        if (retrofitRow === undefined) continue;
        const retrofitName = retrofitRow.name;
        if (retrofitName === undefined) continue;

        const retrofitRoot = rootSkillName(retrofitName);

        // Try to find a base skill with the same root name
        let replaced = false;
        for (let i = 0; i < finalSkillIds.length; i++) {
          const baseId = finalSkillIds[i];
          if (baseId === undefined) continue;
          const baseRow = skillDataTemplate[String(baseId)];
          if (baseRow === undefined) continue;
          const baseName = baseRow.name;
          if (baseName === undefined) continue;
          const baseRoot = rootSkillName(baseName);

          if (baseRoot === retrofitRoot && baseRoot.length > 0) {
            finalSkillIds[i] = retrofitId;
            replaced = true;
            break;
          }
        }

        if (!replaced) {
          // No matching base skill — append if not already present
          if (!finalSkillIds.includes(retrofitId)) {
            finalSkillIds.push(retrofitId);
          }
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // 4. Build skill objects.
  // -------------------------------------------------------------------------
  const skills: Ship["skills"] = [];

  for (const skillId of finalSkillIds) {
    const idStr = String(skillId);
    const skillRow = skillDataTemplate[idStr];
    const displayRow = skillDataDisplay[idStr];

    // Resolve name: prefer skill_data_template, fallback to skill_data_display
    let nameEn: string | undefined =
      skillRow?.name ?? displayRow?.name;

    if (nameEn === undefined || nameEn.trim() === "") {
      // No name at all — skip this skill
      console.warn(
        `normalizeSkills: skill ID ${skillId} has no name in skill_data_template or skill_data_display — skipping (group_type ${groupType})`,
      );
      continue;
    }

    nameEn = nameEn.trim();

    const type = skillRow?.type ?? 0;
    const color = skillColor(type);

    const description = buildDescription(skillDataTemplate, idStr);

    skills.push({
      color,
      names: { en: nameEn },
      description,
    });
  }

  // -------------------------------------------------------------------------
  // 5. Build limit breaks.
  //
  // rowIds[0..2] correspond to LB1/LB2/LB3 source rows.
  // The terminal row (index 3, ending in "4") has breakout_view: "None" → skip.
  // -------------------------------------------------------------------------

  // We want the first THREE non-terminal rows: rowIds[0], [1], [2]
  const limitBreaks: string[][] = [];

  for (let i = 0; i < 3; i++) {
    const rowId = rowIds[i];
    if (rowId === undefined) {
      // Fewer than 3 rows — some ships (e.g. META 4-star ships) may have fewer LB stages
      continue;
    }

    const breakoutRow = breakout[rowId];
    if (breakoutRow === undefined) {
      // Row missing from breakout table — skip
      continue;
    }

    const bonuses = splitLimitBreakBonuses(breakoutRow.breakout_view);
    limitBreaks.push(bonuses);
  }

  // If all three limit-break arrays are empty/absent, omit the field
  const hasLimitBreaks =
    limitBreaks.length > 0 && limitBreaks.some((lb) => lb.length > 0);

  return {
    skills,
    limitBreaks: hasLimitBreaks ? limitBreaks : undefined,
  };
}
